import { describe, expect, it } from "vitest";
import { analyze, mean } from "./engine";
import { parseCsv } from "../chat-parser/parser";
import { createSample } from "../chat-parser/sample";
import type { AnalysisOptions } from "../../types/chat";

const options: AnalysisOptions = {
  participants: ["p1", "p2"],
  start: "2026-10-01",
  end: "2026-10-03",
  sessionHours: 6,
};
const input = (...rows: string[]) =>
  parseCsv(`Date,User,Message\n${rows.join("\n")}`).messages;
describe("conversation sessions and response turns", () => {
  it("counts only sender changes and uses the last consecutive message", () => {
    const data = input(
      "2026-10-01 09:00,A,첫 번째",
      "2026-10-01 09:02,A,이어 보냄",
      "2026-10-01 09:05,B,답장",
      "2026-10-01 09:06,B,이어 보냄",
      "2026-10-01 09:07,A,답장",
      "2026-10-01 15:07,B,새 세션",
    );
    const result = analyze(data, options);
    expect(result.sessions).toBe(2);
    expect(result.people.map((p) => p.starts)).toEqual([1, 1]);
    expect(result.people[0].averageReply).toBe(60);
    expect(result.people[1].averageReply).toBe(180);
    expect(result.averageReply).toBe(120);
    expect(result).not.toHaveProperty("medianReply");
    expect(result.people[0]).not.toHaveProperty("medianReply");
    expect(result.averageSession).toBe(210);
  });
  it("includes midnight crossovers in a session and buckets days in KST", () => {
    const data = input("2026-10-01 23:59,A,안녕", "2026-10-02 00:01,B,응");
    const result = analyze(data, options);
    expect(result.sessions).toBe(1);
    expect(result.averageReply).toBe(120);
    expect(result.activeDays).toBe(2);
    expect(result.longestStreak).toBe(2);
    expect(result.daily.map((p) => p.total)).toEqual([1, 1, 0]);
    expect(result.longestGap).toBe(1);
  });
  it("handles same timestamp, 0-second replies, and changed threshold", () => {
    const data = input(
      "2026-10-01 09:00,A,a",
      "2026-10-01 09:00,B,b",
      "2026-10-01 12:00,A,c",
    );
    expect(analyze(data, options).people[1].averageReply).toBe(0);
    expect(analyze(data, { ...options, sessionHours: 3 }).sessions).toBe(2);
    expect(analyze(data, options).sessions).toBe(1);
  });
  it("returns honest nulls for empty periods and missing replies", () => {
    const data = input("2026-10-01 09:00,A,a", "2026-10-01 09:01,B,b");
    const result = analyze(data, { ...options, start: "2026-10-03" });
    expect(result.total).toBe(0);
    expect(result.averageReply).toBeNull();
    expect(result.peakHour).toBeNull();
    expect(result.people[0].averageReply).toBeNull();
  });
  it("validates participants, periods and thresholds", () => {
    expect(() =>
      analyze([], { ...options, participants: ["p1", "p1"] }),
    ).toThrow();
    expect(() => analyze([], { ...options, start: "2026-10-04" })).toThrow();
    expect(() => analyze([], { ...options, sessionHours: 0 })).toThrow();
  });
});
describe("aggregations and change comparisons", () => {
  it("excludes media and deleted records from text length and short reply ratios", () => {
    const data = input(
      "2026-10-01 09:00,A,안녕하세요",
      "2026-10-01 09:01,B,네",
      "2026-10-01 09:02,A,사진",
      "2026-10-01 09:03,A,메시지가 삭제되었습니다",
    );
    const result = analyze(data, options);
    expect(result.people[0].messages).toBe(3);
    expect(result.people[0].textMessages).toBe(1);
    expect(result.people[0].characters).toBe(5);
    expect(result.monthly[0].averageLength).toBe(3);
  });
  it("does not invent a trend when 60 days or a denominator is missing", () => {
    const data = input("2026-10-01 09:00,A,a", "2026-10-01 09:01,B,b");
    expect(analyze(data, options).recent.change).toBeNull();
    expect(
      analyze(data, { ...options, start: "2026-08-01" }).recent.change,
    ).toBeNull();
  });
  it("compares exactly the two 30-day windows anchored to the selected end", () => {
    const data = input(
      "2026-09-01 10:00,A,a",
      "2026-09-02 10:00,B,b",
      "2026-10-01 10:00,A,c",
      "2026-10-02 10:00,B,d",
      "2026-10-02 10:01,A,e",
    );
    const result = analyze(data, { ...options, start: "2026-08-01" });
    expect(result.recent).toEqual({
      complete: true,
      previous: 2,
      current: 3,
      change: 50,
    });
    expect(result.monthly.reduce((s, m) => s + m.total, 0)).toBe(result.total);
    expect(result.weekly.reduce((s, m) => s + m.total, 0)).toBe(result.total);
  });
  it("only analyzes the selected pair and warns about small samples", () => {
    const data = input(
      "2026-10-01 09:00,A,a",
      "2026-10-01 09:01,B,b",
      "2026-10-01 09:02,C,c",
    );
    const result = analyze(data, options);
    expect(result.total).toBe(2);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
  it("generates deterministic synthetic data using the actual engine", () => {
    const sample = createSample(),
      result = analyze(sample.messages, {
        ...options,
        start: "2026-05-01",
        end: "2026-10-31",
      });
    expect(sample).toEqual(createSample());
    expect(result.total).toBe(sample.messages.length);
    expect(result.kind).toBe("observed-statistics");
    expect(result.people[0].messages + result.people[1].messages).toBe(
      result.total,
    );
    expect(result.people[0].starts + result.people[1].starts).toBe(
      result.sessions,
    );
  });
  it("computes the mean without changing the source and handles no samples", () => {
    const source = [10, 1, 4, 2];
    expect(mean(source)).toBe(4.25);
    expect(source).toEqual([10, 1, 4, 2]);
    expect(mean([])).toBeNull();
  });
});
