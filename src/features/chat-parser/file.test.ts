import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { inspectZip, LIMITS, readChatFile, validateFile } from "./file";

describe("file boundaries", () => {
  it("rejects empty, unsupported and oversized inputs", () => {
    expect(() => validateFile({ name: "chat.exe", size: 10 })).toThrow("TXT");
    expect(() => validateFile({ name: "chat.txt", size: 0 })).toThrow(
      "빈 파일",
    );
    expect(() =>
      validateFile({ name: "chat.txt", size: LIMITS.fileBytes + 1 }),
    ).toThrow("20 MB");
  });
  it("rejects invalid ZIP and too many entries before extraction", async () => {
    expect(() => inspectZip(new Uint8Array(10))).toThrow("ZIP");
    const zip = new JSZip();
    for (let i = 0; i < 101; i++) zip.file(`${i}.txt`, "x");
    expect(() => inspectZip(new Uint8Array())).toThrow();
    const bytes = await zip.generateAsync({ type: "uint8array" });
    expect(() => inspectZip(bytes)).toThrow("100개");
  });
  it("rejects dangerous paths and compression bombs", async () => {
    const bad = new JSZip().file("../chat.txt", "hello");
    expect(() => inspectZip(new Uint8Array())).toThrow();
    const pathBytes = await bad.generateAsync({ type: "uint8array" });
    expect(() => inspectZip(pathBytes)).toThrow("경로");
    const bomb = await new JSZip()
      .file("chat.txt", "a".repeat(200000))
      .generateAsync({ type: "uint8array", compression: "DEFLATE" });
    expect(() => inspectZip(bomb)).toThrow("압축 해제 한도");
  });
  it("extracts one text conversation and skips media", async () => {
    const bytes = await new JSZip()
      .file(
        "chat.txt",
        "2026년 10월 1일 오전 9:00, A : 안녕\n2026년 10월 1일 오전 9:01, B : 반가워",
      )
      .file("photo.jpg", new Uint8Array([1, 2, 3]))
      .generateAsync({ type: "arraybuffer" });
    const file = {
      name: "chat.zip",
      size: bytes.byteLength,
      arrayBuffer: async () => bytes,
    } as File;
    const result = await readChatFile(file, () => {});
    expect(result.messages).toHaveLength(2);
  });
  it("rejects archives with multiple candidate conversations", async () => {
    const bytes = await new JSZip()
      .file("a.txt", "x")
      .file("b.txt", "y")
      .generateAsync({ type: "arraybuffer" });
    await expect(
      readChatFile(
        {
          name: "chat.zip",
          size: bytes.byteLength,
          arrayBuffer: async () => bytes,
        } as File,
        () => {},
      ),
    ).rejects.toThrow("하나");
  });
});
