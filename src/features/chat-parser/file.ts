import JSZip from "jszip";
import { decodeChat, parseCsv, parseTxt } from "./parser";
import type { ParsedChat } from "../../types/chat";
import { validateFile } from "./file-validation";
export { validateFile } from "./file-validation";

export const LIMITS = {
  fileBytes: 20 * 1024 * 1024,
  expandedBytes: 40 * 1024 * 1024,
  entries: 100,
  ratio: 200,
};
/** Preflight central directory BEFORE decompression, including ignored media. ZIP64/multidisk/encrypted are unsupported. */
export function inspectZip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (
      view.getUint32(i, true) === 0x06054b50 &&
      i + 22 + view.getUint16(i + 20, true) === bytes.length
    ) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("올바른 ZIP 파일이 아니에요.");
  const count = view.getUint16(eocd + 10, true),
    size = view.getUint32(eocd + 12, true),
    offset = view.getUint32(eocd + 16, true);
  if (
    count > LIMITS.entries ||
    view.getUint16(eocd + 4, true) ||
    view.getUint16(eocd + 6, true) ||
    count !== view.getUint16(eocd + 8, true) ||
    offset + size > eocd
  )
    throw new Error("ZIP은 단일 볼륨, 일반 형식, 100개 항목까지 지원해요.");
  let cursor = offset,
    expanded = 0;
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > eocd || view.getUint32(cursor, true) !== 0x02014b50)
      throw new Error("ZIP 목차가 손상되었어요.");
    const flags = view.getUint16(cursor + 8, true),
      compressed = view.getUint32(cursor + 20, true),
      original = view.getUint32(cursor + 24, true);
    const length = view.getUint16(cursor + 28, true),
      extra = view.getUint16(cursor + 30, true),
      comment = view.getUint16(cursor + 32, true);
    expanded += original;
    if (
      flags & 1 ||
      original === 0xffffffff ||
      expanded > LIMITS.expandedBytes ||
      original / Math.max(1, compressed) > LIMITS.ratio
    )
      throw new Error(
        "암호화되었거나 압축 해제 한도(40 MB / 200배)를 넘는 ZIP이에요.",
      );
    if (cursor + 46 + length + extra + comment > eocd)
      throw new Error("ZIP 항목 정보가 손상되었어요.");
    const name = new TextDecoder().decode(
      bytes.subarray(cursor + 46, cursor + 46 + length),
    );
    if (/^[/\\]|^[a-z]:|(?:^|[/\\])\.\.(?:[/\\]|$)/i.test(name))
      throw new Error("안전하지 않은 경로가 포함된 ZIP이에요.");
    cursor += 46 + length + extra + comment;
  }
  if (cursor !== offset + size)
    throw new Error("ZIP 목차 크기가 일치하지 않아요.");
}

async function boundedExtract(entry: JSZip.JSZipObject): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    // JSZip 3.10 exposes this documented browser streaming API but omits it from JSZipObject's typings.
    const stream = (
      entry as JSZip.JSZipObject & {
        internalStream(type: "uint8array"): JSZip.JSZipStreamHelper<Uint8Array>;
      }
    ).internalStream("uint8array");
    stream
      .on("data", (chunk) => {
        size += chunk.length;
        if (size > LIMITS.fileBytes) {
          stream.pause();
          reject(new Error("ZIP 안의 대화 텍스트가 20 MB를 넘어요."));
          return;
        }
        chunks.push(chunk);
      })
      .on("error", () =>
        reject(
          new Error("ZIP 압축을 해제할 수 없어요. 파일을 다시 내보내 주세요."),
        ),
      )
      .on("end", () => {
        const result = new Uint8Array(size);
        let cursor = 0;
        for (const chunk of chunks) {
          result.set(chunk, cursor);
          cursor += chunk.length;
        }
        resolve(result.buffer);
      })
      .resume();
  });
}

export async function readChatFile(
  file: File,
  progress: (value: number, stage: string) => void,
): Promise<ParsedChat> {
  validateFile(file);
  progress(10, "파일을 읽고 있어요…");
  let buffer = await file.arrayBuffer(),
    name = file.name;
  if (/\.zip$/i.test(name)) {
    inspectZip(new Uint8Array(buffer));
    progress(25, "ZIP의 안전 한도를 확인했어요…");
    const zip = await JSZip.loadAsync(buffer);
    const candidates = Object.values(zip.files).filter(
      (entry) =>
        !entry.dir &&
        !entry.name.startsWith("__MACOSX/") &&
        /\.(txt|csv)$/i.test(entry.name),
    );
    if (candidates.length !== 1)
      throw new Error(
        "ZIP에는 대화 TXT 또는 CSV가 하나 있어야 해요. 분석할 파일 하나를 직접 선택해 주세요. 이미지와 미디어는 읽지 않아요.",
      );
    buffer = await boundedExtract(candidates[0]);
    name = candidates[0].name;
  }
  progress(55, "대화 형식과 메시지를 확인하고 있어요…");
  const decoded = decodeChat(buffer);
  const parsed = /\.csv$/i.test(name)
    ? parseCsv(decoded.text, name)
    : parseTxt(decoded.text, name);
  progress(90, "분석 대상자를 준비하고 있어요…");
  return { ...parsed, encoding: decoded.encoding };
}
