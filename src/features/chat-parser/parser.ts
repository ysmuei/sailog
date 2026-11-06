import Papa from "papaparse";
import { parseChatTimestamp } from "../../lib/date";
import type { Message, ParsedChat, ParseIssue } from "../../types/chat";

export const MAX_MESSAGES = 300_000;
const systemPattern =
  /^(?:.+님이 (?:들어왔습니다|나갔습니다|초대했습니다)|.+님을 초대했습니다|메시지가 삭제되었습니다|삭제된 메시지입니다|채팅방 관리자가 .+|톡게시판 .+)\.?$/;
const noticePattern =
  /^(?:저장한 날짜\s*:|저장한 시간\s*:|대화 저장 날짜\s*:|.+ 님과 카카오톡 대화|.+님과 카카오톡 대화|Date,User,Message|Chat saved)/;
const pcDateDividerPattern =
  /^(?:-+\s*)?(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일(?:\s+[월화수목금토일]요일)?(?:\s*-+)?$/;
// Confirmed PC export variant. YY explicitly means 2000 + YY, never Date.parse's century pivot.
const pcShortYearDividerPattern =
  /^-+\s*(\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일(?:\s+[월화수목금토일]요일)?\s*-+$/;

export function decodeChat(buffer: ArrayBuffer): {
  text: string;
  encoding: string;
} {
  try {
    return {
      text: new TextDecoder("utf-8", { fatal: true })
        .decode(buffer)
        .replace(/^\uFEFF/, ""),
      encoding: "UTF-8",
    };
  } catch {
    try {
      return {
        text: new TextDecoder("euc-kr", { fatal: true }).decode(buffer),
        encoding: "CP949 / EUC-KR",
      };
    } catch {
      throw new Error(
        "텍스트 인코딩을 읽을 수 없어요. UTF-8로 저장한 대화 파일을 선택해 주세요.",
      );
    }
  }
}

function issue(issues: ParseIssue[], line: number, reason: string) {
  const same = issues.find((i) => i.reason === reason);
  if (same) same.count++;
  else issues.push({ line, reason, count: 1 });
}
function normalize(messages: Message[]) {
  if (messages.length > MAX_MESSAGES)
    throw new Error(
      "메시지가 30만 개를 넘어요. 기간을 나눈 파일을 선택해 주세요.",
    );
  for (const item of messages) item.type = messageType(item.content);
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}
function messageType(content: string): Message["type"] {
  const text = content.trim();
  if (
    /^(?:사진(?:\s+\d+장)?|동영상|이모티콘|음성메시지|<사진>|<동영상>)$|^파일\s*:/.test(
      text,
    )
  )
    return "media";
  if (/^(?:삭제된 메시지입니다|메시지가 삭제되었습니다)\.?$/.test(text))
    return "deleted";
  return "text";
}
function message(
  sender: string,
  timestamp: number,
  content: string,
  line: number,
  file: string,
  format: Message["source"]["format"],
  names: Map<string, string>,
): Message {
  if (!names.has(sender)) names.set(sender, `p${names.size + 1}`);
  return {
    id: `m${line}`,
    senderId: names.get(sender)!,
    senderName: sender,
    timestamp,
    content,
    type: messageType(content),
    source: { file, line, format },
  };
}

export function parseTxt(text: string, file = "chat.txt"): ParsedChat {
  const messages: Message[] = [],
    issues: ParseIssue[] = [],
    names = new Map<string, string>();
  let currentDate = "",
    active: Message | undefined,
    ignoredSystem = 0,
    detected = "";
  let currentPcFormat: "pc-txt" | "pc-short-year-txt" = "pc-txt";
  const lines = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i],
      clean = line.trim();
    const divider =
      clean.match(pcDateDividerPattern) ||
      clean.match(pcShortYearDividerPattern);
    if (divider) {
      const shortYear = divider[1].length === 2;
      const year = shortYear ? 2000 + Number(divider[1]) : Number(divider[1]);
      currentDate = `${year}-${divider[2]}-${divider[3]}`;
      currentPcFormat = shortYear ? "pc-short-year-txt" : "pc-txt";
      active = undefined;
      continue;
    }
    const pc = line.match(
      /^\[(.+?)\]\s*\[((?:오전|오후|AM|PM)\s*\d{1,2}:\d{2}|\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)\]\s?(.*)$/i,
    );
    const mobile = line.match(
      /^(\d{4}(?:년|[.\-/])\s*\d{1,2}(?:월|[.\-/])\s*\d{1,2}(?:일|\.)?\s+(?:(?:오전|오후|AM|PM)\s*)?\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM))?),\s*(.+?)\s*:\s?(.*)$/i,
    );
    if (pc || mobile) {
      const sender = (pc ? pc[1] : mobile![2]).trim();
      const stamp = pc ? `${currentDate} ${pc[2]}` : mobile![1];
      const timestamp = parseChatTimestamp(stamp);
      active = undefined;
      if (!sender || timestamp === null) {
        issue(issues, i + 1, "날짜 또는 발신자를 확인할 수 없는 메시지");
        continue;
      }
      const format = pc ? currentPcFormat : "mobile-txt";
      detected = detected && detected !== format ? "mixed-txt" : format;
      active = message(
        sender,
        timestamp,
        pc ? pc[3] : mobile![3],
        i + 1,
        file,
        format,
        names,
      );
      messages.push(active);
      if (messages.length > MAX_MESSAGES)
        throw new Error("메시지는 파일당 30만 개까지 분석할 수 있어요.");
      continue;
    }
    const mobileSystem = clean.replace(/^\d{4}.+?\d{1,2}:\d{2},\s*/, "");
    if (
      systemPattern.test(clean) ||
      systemPattern.test(mobileSystem) ||
      noticePattern.test(clean)
    ) {
      ignoredSystem++;
      active = undefined;
      continue;
    }
    // A malformed record is never silently appended to the previous message.
    if (/^\d{4}[.\-/년].*\d{1,2}:\d{2},|^\[.+?\]\s*\[|^-{3,}/.test(clean)) {
      if (/^-{3,}/.test(clean)) currentDate = "";
      issue(issues, i + 1, "지원 형식과 일치하지 않는 행");
      active = undefined;
      continue;
    }
    if (active) active.content += `\n${line}`;
    else if (clean) issue(issues, i + 1, "메시지로 식별하지 못한 행");
  }
  if (!messages.length)
    throw new Error(
      "지원하는 카카오톡 대화를 찾지 못했어요. PC·모바일에서 내보낸 TXT 또는 Date,User,Message 형식의 CSV를 선택해 주세요.",
    );
  return {
    messages: normalize(messages),
    issues,
    ignoredSystem,
    format: detected,
    encoding: "UTF-8",
  };
}

export function parseCsv(text: string, file = "chat.csv"): ParsedChat {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const records: { data: string[]; line: number; malformed: boolean }[] = [];
  let cursor = 0,
    physicalLine = 1;
  Papa.parse<string[]>(normalized, {
    skipEmptyLines: "greedy",
    step: (row) => {
      const consumed = normalized.slice(cursor, row.meta.cursor);
      const leadingBlank = consumed.match(/^(?:[ \t]*\n)*/)?.[0] || "";
      records.push({
        data: row.data,
        line: physicalLine + (leadingBlank.match(/\n/g)?.length || 0),
        malformed: row.errors.length > 0,
      });
      physicalLine += consumed.match(/\n/g)?.length || 0;
      cursor = row.meta.cursor;
    },
  });
  const header = records[0]?.data,
    rows = records.slice(1);
  if (!header || header.map((h) => h.trim()).join(",") !== "Date,User,Message")
    throw new Error(
      "CSV의 첫 행은 Date,User,Message여야 해요. 지원하지 않는 열 구성은 임의로 해석하지 않아요.",
    );
  const messages: Message[] = [],
    issues: ParseIssue[] = [],
    names = new Map<string, string>();
  let ignoredSystem = 0;
  for (let index = 0; index < rows.length; index++) {
    const { data: row, line, malformed } = rows[index];
    if (malformed) {
      issue(issues, line, "CSV 따옴표 또는 구분자 오류");
      continue;
    }
    const timestamp = row[0] ? parseChatTimestamp(row[0]) : null;
    if (row.length !== 3 || timestamp === null) {
      issue(issues, line, "CSV 열 수 또는 날짜 오류");
      continue;
    }
    const sender = row[1].trim();
    if (!sender) {
      ignoredSystem++;
      continue;
    }
    messages.push(message(sender, timestamp, row[2], line, file, "csv", names));
    if (messages.length > MAX_MESSAGES)
      throw new Error("메시지는 파일당 30만 개까지 분석할 수 있어요.");
  }
  if (!messages.length)
    throw new Error(
      "분석할 메시지가 없어요. CSV의 날짜와 발신자 열을 확인해 주세요.",
    );
  return {
    messages: normalize(messages),
    issues,
    ignoredSystem,
    format: "csv",
    encoding: "UTF-8",
  };
}
