import { duration, number } from "../../lib/date";
import type { ReportCardData } from "./model";

export const CARD_METRICS = [
  { id: "messages", label: "메시지 수" },
  { id: "starts", label: "선톡 비율" },
  { id: "streak", label: "최장 연속 연락" },
  { id: "days", label: "대화를 나눈 날" },
  { id: "reply", label: "평균 답장 시간" },
  { id: "peak", label: "가장 활발한 시간대" },
  { id: "sessions", label: "대화 시작 횟수" },
] as const;
export type CardMetric = (typeof CARD_METRICS)[number]["id"];
export const DEFAULT_METRICS: CardMetric[] = ["messages", "starts", "streak"];
export const MAX_CARD_METRICS = 4;

export function cardMetric(data: ReportCardData, id: CardMetric) {
  switch (id) {
    case "messages":
      return {
        label: "주고받은 메시지",
        value: `${number(data.total)}개`,
        detail: "",
      };
    case "starts":
      return {
        label: "대화를 여는 첫마디",
        value: data.starterPercent
          ? `${number(data.starterPercent[0])}%  ·  ${number(data.starterPercent[1])}%`
          : "기록 없음",
        detail: `${data.names[0]}  ·  ${data.names[1]}  |  ${data.sessionHours}시간 이상 공백 기준`,
      };
    case "streak":
      return {
        label: "최장 연속 연락",
        value: `${number(data.longestStreak)}일`,
        detail: "",
      };
    case "days":
      return {
        label: "대화를 나눈 날",
        value: `${number(data.activeDays)}일`,
        detail: "",
      };
    case "reply":
      return {
        label: "평균 답장 시간",
        value: duration(data.averageReply),
        detail: "같은 대화 안에서 주고받은 답장 기준",
      };
    case "peak":
      return {
        label: "가장 활발한 시간대",
        value:
          data.peakHour === null
            ? "기록 없음"
            : `${data.peakHour}시 – ${data.peakHour + 1}시`,
        detail: "",
      };
    case "sessions":
      return {
        label: "대화 시작 횟수",
        value: `${number(data.sessions)}회`,
        detail: `${data.sessionHours}시간 이상 공백 기준`,
      };
  }
}
