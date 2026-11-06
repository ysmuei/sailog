import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

export const KST = 9 * 60 * 60 * 1000;
export const DAY = 24 * 60 * 60 * 1000;
export const dayKey = (timestamp: number) =>
  new Date(timestamp + KST).toISOString().slice(0, 10);
export const hourOf = (timestamp: number) =>
  new Date(timestamp + KST).getUTCHours();
export const dayStart = (key: string) => Date.parse(`${key}T00:00:00+09:00`);
export const shiftDay = (key: string, amount: number) =>
  format(addDays(parseISO(key), amount), "yyyy-MM-dd");
export const dayDistance = (a: string, b: string) =>
  differenceInCalendarDays(parseISO(a), parseISO(b));
export const weekKey = (key: string) =>
  format(startOfWeek(parseISO(key), { weekStartsOn: 1 }), "yyyy-MM-dd");
export const prettyDate = (key: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(dayStart(key));
export const number = (n: number) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(n);
export function duration(seconds: number | null) {
  if (seconds === null) return "기록 없음";
  if (seconds < 60) return `${Math.round(seconds)}초`;
  if (seconds < 3600) return `${number(seconds / 60)}분`;
  return `${number(seconds / 3600)}시간`;
}

/** Only explicit calendar dates, interpreted as Korea local time. No Date.parse guessing. */
export function parseChatTimestamp(raw: string): number | null {
  const match = raw
    .trim()
    .match(
      /^(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})(?:일|\.)?\s*[T ]\s*(?:(오전|오후|AM|PM)\s*)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i,
    );
  if (!match) return null;
  const [, ys, mos, ds, meridiem, hs, ms, ss, suffix] = match;
  const [y, mo, d, minute, second] = [ys, mos, ds, ms, ss || "0"].map(Number);
  let h = Number(hs);
  const period = (meridiem || suffix || "").toUpperCase();
  if (period) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (period === "오후" || period === "PM" ? 12 : 0);
  }
  if (
    y < 2000 ||
    y > 2100 ||
    mo < 1 ||
    mo > 12 ||
    d < 1 ||
    d > 31 ||
    h > 23 ||
    minute > 59 ||
    second > 59
  )
    return null;
  const time = Date.UTC(y, mo - 1, d, h, minute, second);
  const check = new Date(time);
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return time - KST;
}
