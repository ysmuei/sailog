export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  content: string;
  type: "text" | "media" | "deleted";
  source: {
    file: string;
    line: number;
    format: "pc-txt" | "pc-short-year-txt" | "mobile-txt" | "csv" | "sample";
  };
};
export type ParseIssue = { line: number; reason: string; count: number };
export type ParsedChat = {
  messages: Message[];
  issues: ParseIssue[];
  ignoredSystem: number;
  format: string;
  encoding: string;
};
export type ChatInfo = Omit<ParsedChat, "messages"> & {
  participants: { id: string; name: string; count: number }[];
  messageCount: number;
  start: string;
  end: string;
  sample: boolean;
};
export type AnalysisOptions = {
  participants: [string, string];
  start: string;
  end: string;
  sessionHours: number;
};
export type SeriesPoint = {
  label: string;
  a: number;
  b: number;
  total: number;
};
export type PersonStats = {
  id: string;
  messages: number;
  textMessages: number;
  starts: number;
  averageReply: number | null;
  replies: number;
  characters: number;
  short: number;
  long: number;
  distribution: number[];
};
export type MonthTrend = SeriesPoint & {
  startsA: number;
  startsB: number;
  replyA: number | null;
  replyB: number | null;
  averageLength: number;
  averageSession: number;
};
export type Report = {
  kind: "observed-statistics";
  options: AnalysisOptions;
  total: number;
  activeDays: number;
  calendarDays: number;
  sessions: number;
  people: [PersonStats, PersonStats];
  daily: SeriesPoint[];
  weekly: SeriesPoint[];
  monthly: MonthTrend[];
  hourly: SeriesPoint[];
  weekdays: SeriesPoint[];
  averageReply: number | null;
  averageSession: number | null;
  longestStreak: number;
  longestGap: number;
  peakDay: SeriesPoint | null;
  peakHour: number | null;
  recent: {
    current: number;
    previous: number;
    change: number | null;
    complete: boolean;
  };
  warnings: string[];
};
// Future provider must require explicit consent and a server endpoint. No provider runs in MVP.
export type AIInsightProvider = {
  kind: "ai-inference";
  analyze: (request: {
    consent: { grantedAt: string; purpose: string; retentionDays: number };
    messages: Message[];
  }) => Promise<{
    claims: { text: string; evidenceMessageIds: string[]; dates: string[] }[];
    model: string;
  }>;
};
