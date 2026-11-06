import { describe, expect, it } from "vitest";
import { decodeChat, parseCsv, parseTxt } from "./parser";
import { dayKey, hourOf, parseChatTimestamp } from "../../lib/date";

describe("explicit Korean timestamp parsing", () => {
  it.each([
    ["2026년 10월 1일 오전 12:05", 0],
    ["2026년 10월 1일 오후 12:05", 12],
    ["2026. 10. 1. 오후 1:05", 13],
    ["2026-10-01 23:05:30", 23],
    ["2026-10-01 1:05 PM", 13],
  ])("%s is Korea time", (date, h) => {
    const t = parseChatTimestamp(date)!;
    expect(hourOf(t)).toBe(h);
    expect(dayKey(t)).toBe("2026-10-01");
  });
  it.each([
    "2026-02-30 10:30",
    "2026-10-01 오후 13:30",
    "2026-10-01 25:30",
    "10/01/2026 10:30",
    "2026-10-01 10:69",
    "2026-13-01 10:30",
  ])("rejects %s without guessing", (s) =>
    expect(parseChatTimestamp(s)).toBeNull(),
  );
});
describe("TXT formats", () => {
  it("reads the confirmed PC two-digit-year format, multiline content and midnight rollover", () => {
    const result = parseTxt(
      "가상 참여자 님과 카카오톡 대화\r\n저장한 날짜 : 2026-11-06 11:30:00\r\n\r\n--------------- 25년 12월 31일 ---------------\r\n[가상 A] [오후 11:59] 가상 메시지\r\n다음 줄의 가상 내용\r\n--------------- 26년 1월 1일 ---------------\r\n[가상 B] [오전 12:01] 가상 답장",
    );
    expect(result.format).toBe("pc-short-year-txt");
    expect(result.messages).toHaveLength(2);
    expect(dayKey(result.messages[0].timestamp)).toBe("2025-12-31");
    expect(dayKey(result.messages[1].timestamp)).toBe("2026-01-01");
    expect(result.messages[1].timestamp - result.messages[0].timestamp).toBe(
      120000,
    );
    expect(result.messages[0].content).toBe("가상 메시지\n다음 줄의 가상 내용");
    expect(result.messages[1].source).toMatchObject({
      line: 8,
      format: "pc-short-year-txt",
    });
    expect(result.issues).toEqual([]);
  });
  it("uses the explicit 20YY century rule without affecting full-year records", () => {
    const result = parseTxt(
      "--------------- 00년 1월 1일 ---------------\n[A] [오전 12:00] 가상\n--------------- 2099년 12월 31일 목요일 ---------------\n[B] [오후 12:00] 가상",
    );
    expect(result.messages.map((m) => dayKey(m.timestamp))).toEqual([
      "2000-01-01",
      "2099-12-31",
    ]);
    expect(result.messages.map((m) => m.source.format)).toEqual([
      "pc-short-year-txt",
      "pc-txt",
    ]);
    expect(result.format).toBe("mixed-txt");
  });
  it("does not reuse a previous date after an unsupported or invalid date divider", () => {
    const result = parseTxt(
      "--------------- 26년 1월 1일 ---------------\n[A] [오전 9:00] 정상\n--------------- 026년 1월 2일 ---------------\n[B] [오전 9:01] 잘못된 날짜\n--------------- 26년 2월 30일 ---------------\n[B] [오전 9:02] 없는 날짜\n--------------- 26년 3월 1일 ---------------\n[B] [오전 9:03] 정상",
    );
    expect(result.messages).toHaveLength(2);
    expect(dayKey(result.messages[1].timestamp)).toBe("2026-03-01");
    expect(result.issues.reduce((sum, issue) => sum + issue.count, 0)).toBe(3);
  });
  it("does not classify ordinary sentences about photos as attachment placeholders", () => {
    const result = parseTxt(
      "2026년 10월 1일 오전 9:00, A : 사진 찍으러 가자\n2026년 10월 1일 오전 9:01, B : 사진\n좋아하는 사진이야\n2026년 10월 1일 오전 9:02, A : 사진 2장",
    );
    expect(result.messages.map((message) => message.type)).toEqual([
      "text",
      "text",
      "media",
    ]);
  });
  it("reads PC headers, multiline text, same-minute order and systems", () => {
    const result = parseTxt(
      "\uFEFF서연 님과 카카오톡 대화\n저장한 날짜 : 2026-10-02\n--------------- 2026년 10월 1일 목요일 ---------------\n[서연] [오전 12:01] 안녕\n이어지는 내용, '인용'\n[도윤] [오전 12:01] 반가워\n도윤님이 나갔습니다.\n[서연] [오후 12:30] 사진",
    );
    expect(result.messages).toHaveLength(3);
    expect(result.messages[0].content).toBe("안녕\n이어지는 내용, '인용'");
    expect(result.messages.map((m) => m.senderName)).toEqual([
      "서연",
      "도윤",
      "서연",
    ]);
    expect(result.messages[2].type).toBe("media");
    expect(result.messages[0].source.line).toBe(4);
    expect(result.ignoredSystem).toBe(3);
    expect(result.issues).toEqual([]);
  });
  it("reads Korean mobile export and dotted iOS records", () => {
    const result = parseTxt(
      "2026년 10월 1일 오후 11:59, A : 자니?\n2026. 10. 2. 오전 12:01, B : 응\n여러 줄\n2026년 10월 2일 오전 12:02, B님이 나갔습니다.",
    );
    expect(result.messages).toHaveLength(2);
    expect(result.messages[1].timestamp - result.messages[0].timestamp).toBe(
      120000,
    );
    expect(result.messages[1].content).toBe("응\n여러 줄");
    expect(result.ignoredSystem).toBe(1);
  });
  it("reports malformed rows instead of folding them into messages", () => {
    const result = parseTxt(
      "안내가 아닌 미확인 행\n2026년 10월 1일 오전 9:00, A : 정상\n2026년 13월 1일 오전 9:01, B : 오류\n[미완성] [오전 9:02]\n2026년 10월 1일 오전 9:03, B : 정상",
    );
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe("정상");
    expect(result.issues.reduce((s, i) => s + i.count, 0)).toBe(3);
  });
  it("rejects unknown formats and undated PC messages", () => {
    expect(() => parseTxt("random text only")).toThrow("찾지 못했어요");
    expect(() => parseTxt("[A] [오전 9:00] 날짜 없음")).toThrow();
  });
});
describe("CSV quoting and diagnostics", () => {
  it("preserves commas, escaped quotes and embedded newlines", () => {
    const result = parseCsv(
      'Date,User,Message\r\n2026-10-01 09:00:00,A,"안녕, ""친구""\n둘째 줄"\r\n2026-10-01 09:01:00,B,응',
    );
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe('안녕, "친구"\n둘째 줄');
    expect(result.messages[1].source.line).toBe(4);
  });
  it("excludes invalid dates and incomplete rows with reasons", () => {
    const result = parseCsv(
      "Date,User,Message\n2026-10-01 09:00,A,안녕\n2026-02-30 09:00,B,오류\n2026-10-01 10:00,B\n2026-10-01 10:01,,시스템",
    );
    expect(result.messages).toHaveLength(1);
    expect(result.issues[0].count).toBe(2);
    expect(result.ignoredSystem).toBe(1);
  });
  it("rejects unknown columns", () =>
    expect(() => parseCsv("sender,time,text\nA,2026-10-01,안녕")).toThrow(
      "첫 행",
    ));
});
describe("decoding", () => {
  it("reads UTF-8 BOM", () => {
    const result = decodeChat(
      new Uint8Array([239, 187, 191, ...new TextEncoder().encode("안녕")])
        .buffer,
    );
    expect(result.text).toBe("안녕");
    expect(result.encoding).toBe("UTF-8");
  });
  it("falls back to the Korean legacy encoding", () => {
    const result = decodeChat(new Uint8Array([0xbe, 0xc8, 0xb3, 0xe7]).buffer);
    expect(result.text).toBe("안녕");
    expect(result.encoding).toBe("CP949 / EUC-KR");
  });
});
