import {
  DAY,
  dayDistance,
  dayKey,
  dayStart,
  hourOf,
  shiftDay,
  weekKey,
} from "../../lib/date";
import type {
  AnalysisOptions,
  Message,
  MonthTrend,
  PersonStats,
  Report,
  SeriesPoint,
} from "../../types/chat";

export const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const point = (label: string): SeriesPoint => ({ label, a: 0, b: 0, total: 0 });
const person = (id: string): PersonStats => ({
  id,
  messages: 0,
  textMessages: 0,
  starts: 0,
  averageReply: null,
  replies: 0,
  characters: 0,
  short: 0,
  long: 0,
  distribution: [0, 0, 0, 0],
});
export function analyze(messages: Message[], options: AnalysisOptions): Report {
  const { start, end, participants, sessionHours } = options;
  if (participants[0] === participants[1] || !participants.every(Boolean))
    throw new Error("서로 다른 두 참여자를 선택해 주세요.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    start > end ||
    dayDistance(end, start) > 36600 ||
    !Number.isFinite(dayStart(start)) ||
    !Number.isFinite(dayStart(end))
  )
    throw new Error("올바른 분석 기간을 선택해 주세요.");
  if (sessionHours < 1 || sessionHours > 24 || !Number.isFinite(sessionHours))
    throw new Error("세션 기준은 1~24시간으로 설정해 주세요.");
  const lower = dayStart(start),
    upper = dayStart(end) + DAY;
  const selected = messages
    .filter(
      (m) =>
        m.timestamp >= lower &&
        m.timestamp < upper &&
        participants.includes(m.senderId),
    )
    .sort((a, b) => a.timestamp - b.timestamp);
  const people: [PersonStats, PersonStats] = [
    person(participants[0]),
    person(participants[1]),
  ];
  const daily = new Map<string, SeriesPoint>(),
    monthly = new Map<string, MonthTrend>();
  const hourly = Array.from({ length: 24 }, (_, h) => point(`${h}시`));
  const weekdays = ["월", "화", "수", "목", "금", "토", "일"].map(point);
  const calendarDays = dayDistance(end, start) + 1;
  for (let i = 0; i < calendarDays; i++) {
    const date = shiftDay(start, i);
    daily.set(date, point(date));
    const month = date.slice(0, 7);
    if (!monthly.has(month))
      monthly.set(month, {
        ...point(month),
        startsA: 0,
        startsB: 0,
        replyA: null,
        replyB: null,
        averageLength: 0,
        averageSession: 0,
      });
  }
  const replies: [number[], number[]] = [[], []];
  const monthReplies = new Map<string, [number[], number[]]>(),
    monthCharacters = new Map<string, number>(),
    monthTextCount = new Map<string, number>();
  const monthSessions = new Map<string, number[]>();
  let previous: Message | undefined,
    sessions = 0,
    sessionStart = 0,
    sessionLast = 0;
  const sessionDurations: number[] = [];
  function closeSession() {
    const length = (sessionLast - sessionStart) / 1000;
    sessionDurations.push(length);
    const key = dayKey(sessionStart).slice(0, 7);
    if (!monthSessions.has(key)) monthSessions.set(key, []);
    monthSessions.get(key)!.push(length);
  }
  for (const msg of selected) {
    const index = msg.senderId === participants[0] ? 0 : 1;
    const p = people[index],
      date = dayKey(msg.timestamp),
      month = date.slice(0, 7),
      monthPoint = monthly.get(month)!;
    const dayIndex = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
    for (const bucket of [
      daily.get(date)!,
      monthPoint,
      hourly[hourOf(msg.timestamp)],
      weekdays[dayIndex],
    ]) {
      bucket[index === 0 ? "a" : "b"]++;
      bucket.total++;
    }
    p.messages++;
    if (msg.type === "text") {
      p.textMessages++;
      const chars = Array.from(msg.content.trim()).length;
      p.characters += chars;
      if (chars <= 10) p.short++;
      if (chars >= 50) p.long++;
      monthCharacters.set(month, (monthCharacters.get(month) || 0) + chars);
      monthTextCount.set(month, (monthTextCount.get(month) || 0) + 1);
    }
    const gap = previous ? msg.timestamp - previous.timestamp : Infinity;
    if (!previous || gap >= sessionHours * 3600_000) {
      if (previous) closeSession();
      sessions++;
      p.starts++;
      monthPoint[index === 0 ? "startsA" : "startsB"]++;
      sessionStart = msg.timestamp;
    } else if (previous.senderId !== msg.senderId) {
      const seconds = gap / 1000;
      replies[index].push(seconds);
      p.replies++;
      p.distribution[
        seconds <= 60 ? 0 : seconds <= 300 ? 1 : seconds <= 1800 ? 2 : 3
      ]++;
      if (!monthReplies.has(month)) monthReplies.set(month, [[], []]);
      monthReplies.get(month)![index].push(seconds);
    }
    sessionLast = msg.timestamp;
    previous = msg;
  }
  if (selected.length) closeSession();
  people.forEach((p, i) => {
    p.averageReply = mean(replies[i]);
  });
  for (const [key, m] of monthly) {
    m.replyA = mean(monthReplies.get(key)?.[0] || []);
    m.replyB = mean(monthReplies.get(key)?.[1] || []);
    m.averageLength = monthTextCount.get(key)
      ? (monthCharacters.get(key) || 0) / monthTextCount.get(key)!
      : 0;
    m.averageSession = mean(monthSessions.get(key) || []) || 0;
  }
  const dailyValues = [...daily.values()],
    weekly = new Map<string, SeriesPoint>();
  let longestStreak = 0,
    streak = 0,
    longestGap = 0,
    gapDays = 0,
    activeDays = 0,
    peakDay: SeriesPoint | null = null;
  for (const day of dailyValues) {
    const key = weekKey(day.label);
    if (!weekly.has(key)) weekly.set(key, point(key));
    const w = weekly.get(key)!;
    w.a += day.a;
    w.b += day.b;
    w.total += day.total;
    if (day.total) {
      streak++;
      gapDays = 0;
      activeDays++;
      if (!peakDay || day.total > peakDay.total) peakDay = day;
    } else {
      gapDays++;
      streak = 0;
    }
    longestStreak = Math.max(longestStreak, streak);
    longestGap = Math.max(longestGap, gapDays);
  }
  const recentStart = shiftDay(end, -29),
    previousStart = shiftDay(end, -59);
  let current = 0,
    prior = 0;
  for (const day of dailyValues) {
    if (day.label >= recentStart) current += day.total;
    else if (day.label >= previousStart) prior += day.total;
  }
  const complete = start <= previousStart;
  const warnings: string[] = [];
  if (selected.length < 100 || activeDays < 7)
    warnings.push(
      "메시지 100개 미만이거나 대화 날짜가 7일 미만이에요. 적은 기록의 평균과 비율은 쉽게 달라질 수 있어요.",
    );
  if (!complete)
    warnings.push(
      "최근 30일과 이전 30일을 비교하려면 최소 60일의 분석 기간이 필요해요.",
    );
  const allReplies = [...replies[0], ...replies[1]];
  return {
    kind: "observed-statistics",
    options,
    total: selected.length,
    calendarDays,
    activeDays,
    sessions,
    people,
    daily: dailyValues,
    weekly: [...weekly.values()],
    monthly: [...monthly.values()],
    hourly,
    weekdays,
    averageReply: mean(allReplies),
    averageSession: mean(sessionDurations),
    longestStreak,
    longestGap,
    peakDay,
    peakHour: selected.length
      ? hourly.reduce(
          (best, h, i) => (h.total > hourly[best].total ? i : best),
          0,
        )
      : null,
    recent: {
      current,
      previous: prior,
      change: complete && prior > 0 ? ((current - prior) / prior) * 100 : null,
      complete,
    },
    warnings,
  };
}
