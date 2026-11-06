import { describe, expect, it } from "vitest";
import { analyze } from "../statistics/engine";
import { createSample } from "../chat-parser/sample";
import { createReportCardData, reportCardFilename } from "./model";

const sample = createSample();
const report = analyze(sample.messages, {
  participants: ["p1", "p2"],
  start: "2026-05-01",
  end: "2026-10-31",
  sessionHours: 6,
});

describe("report card data boundaries", () => {
  it("defaults to anonymous even when participant names are supplied", () => {
    const data = createReportCardData(report, {
      sample: true,
      participantNames: ["가상 비공개 이름 A", "가상 비공개 이름 B"],
    });
    expect(data.names).toEqual(["참여자 A", "참여자 B"]);
    expect(data.anonymous).toBe(true);
    expect(JSON.stringify(data)).not.toContain("가상 비공개");
  });
  it("allowlists only aggregate values, excluding source paths, raw content and internal IDs", () => {
    const data = createReportCardData(report, { sample: false });
    expect(Object.keys(data).sort()).toEqual(
      [
        "sample",
        "anonymous",
        "names",
        "start",
        "end",
        "total",
        "longestStreak",
        "sessionHours",
        "starts",
        "starterPercent",
        "limitedSample",
      ].sort(),
    );
    expect(data.total).toBe(report.total);
    expect(data.longestStreak).toBe(report.longestStreak);
    expect(data.starterPercent![0]).toBe(
      (report.people[0].starts / report.sessions) * 100,
    );
    expect(data.starterPercent![0] + data.starterPercent![1]).toBeCloseTo(100);
    expect(JSON.stringify(data)).not.toContain(sample.messages[0].content);
    expect(JSON.stringify(data)).not.toContain("p1");
  });
  it("includes a copy of the names only after explicit opt-in", () => {
    const names: [string, string] = ["가상 이름 A", "가상 이름 B"];
    const data = createReportCardData(report, {
      sample: false,
      includeNames: true,
      participantNames: names,
    });
    names[0] = "나중에 바뀐 이름";
    expect(data.names).toEqual(["가상 이름 A", "가상 이름 B"]);
    expect(data.anonymous).toBe(false);
  });
  it("uses exactly the selected period and flags a small sample", () => {
    const filtered = analyze(sample.messages, {
      ...report.options,
      start: "2026-10-31",
      end: "2026-10-31",
    });
    const data = createReportCardData(filtered, { sample: true });
    expect(data.total).toBe(filtered.total);
    expect(data.start).toBe("2026-10-31");
    expect(data.end).toBe("2026-10-31");
    expect(data.limitedSample).toBe(true);
    expect(data.sample).toBe(true);
  });
  it("rejects empty periods and does not fabricate ratios for missing sessions", () => {
    expect(() =>
      createReportCardData({ ...report, total: 0 }, { sample: true }),
    ).toThrow("기록");
    const data = createReportCardData(
      {
        ...report,
        people: [
          { ...report.people[0], starts: 0 },
          { ...report.people[1], starts: 0 },
        ],
      },
      { sample: true },
    );
    expect(data.starterPercent).toBeNull();
  });
  it("keeps names and source filenames out of the download filename and labels samples", () => {
    expect(reportCardFilename({ end: "2026-10-31", sample: true })).toBe(
      "sailog-report-20261031-sample.png",
    );
    expect(reportCardFilename({ end: "2026-10-31", sample: false })).toBe(
      "sailog-report-20261031.png",
    );
  });
});
