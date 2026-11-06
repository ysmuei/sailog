import type { Report } from "../../types/chat";

/** An allowlist of aggregate values: no raw messages, source filename, or participant IDs. */
export type ReportCardData = {
  sample: boolean;
  anonymous: boolean;
  names: [string, string];
  start: string;
  end: string;
  total: number;
  longestStreak: number;
  activeDays: number;
  averageReply: number | null;
  peakHour: number | null;
  sessions: number;
  sessionHours: number;
  starts: [number, number];
  starterPercent: [number, number] | null;
  limitedSample: boolean;
};
export function createReportCardData(
  report: Report,
  options: {
    sample: boolean;
    includeNames?: boolean;
    participantNames?: [string, string];
  },
): ReportCardData {
  if (!report.total)
    throw new Error("저장할 대화 기록이 없어요. 기간을 변경해 주세요.");
  const starts: [number, number] = [
    report.people[0].starts,
    report.people[1].starts,
  ];
  const sessions = starts[0] + starts[1];
  const includeNames =
    options.includeNames === true && options.participantNames !== undefined;
  return {
    sample: options.sample,
    anonymous: !includeNames,
    names: includeNames
      ? [...options.participantNames!]
      : ["참여자 A", "참여자 B"],
    start: report.options.start,
    end: report.options.end,
    total: report.total,
    longestStreak: report.longestStreak,
    activeDays: report.activeDays,
    averageReply: report.averageReply,
    peakHour: report.peakHour,
    sessions: report.sessions,
    sessionHours: report.options.sessionHours,
    starts,
    starterPercent: sessions
      ? [(starts[0] / sessions) * 100, (starts[1] / sessions) * 100]
      : null,
    limitedSample: report.total < 100 || report.activeDays < 7,
  };
}
export function reportCardFilename(
  data: Pick<ReportCardData, "end" | "sample">,
) {
  return `sailog-report-${data.end.replaceAll("-", "")}${data.sample ? "-sample" : ""}.png`;
}
