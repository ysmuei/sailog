import { number, prettyDate } from "../../lib/date";
import type { ReportCardData } from "./model";

export const CARD_SIZE = { width: 1080, height: 1350 };
export type CardStyle = "rose" | "lavender";
type Palette = {
  paper: string;
  surface: string;
  ink: string;
  muted: string;
  border: string;
  accent: string;
  soft: string;
  second: string;
};
const FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

/** Read dedicated export tokens, whose light palette stays stable in the app's dark mode. */
export function cardPalette(style: CardStyle): Palette {
  const tokens = getComputedStyle(document.documentElement);
  const token = (name: string) => {
    const value = tokens.getPropertyValue(`--report-${name}`).trim();
    if (!value)
      throw new Error(
        "카드 스타일을 불러오지 못했어요. 화면을 새로고침해 주세요.",
      );
    return value;
  };
  return {
    paper: token("paper"),
    surface: token("surface"),
    ink: token("ink"),
    muted: token("muted"),
    border: token("border"),
    accent: token(style),
    soft: token(`${style}-soft`),
    second: token(style === "rose" ? "lavender" : "blue"),
  };
}

function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = 400,
  align: CanvasTextAlign = "left",
  maxWidth?: number,
) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = `${weight} ${size}px ${FONT}`;
  let output = value;
  if (maxWidth !== undefined && ctx.measureText(output).width > maxWidth) {
    const chars = Array.from(value);
    while (
      chars.length &&
      ctx.measureText(`${chars.join("")}…`).width > maxWidth
    )
      chars.pop();
    output = `${chars.join("")}…`;
  }
  ctx.fillText(output, x, y);
}

/** Render only the narrow export model. Never screenshot the dashboard DOM. */
export function drawReportCard(
  canvas: HTMLCanvasElement,
  data: ReportCardData,
  palette: Palette,
) {
  canvas.width = CARD_SIZE.width;
  canvas.height = CARD_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error(
      "이 브라우저에서는 이미지를 만들 수 없어요. 다른 브라우저에서 다시 시도해 주세요.",
    );
  const { paper, surface, ink, muted, border, accent, soft, second } = palette;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 1080, 1350);
  // SaiLog's three strokes, carried over from the product wordmark.
  ctx.save();
  ctx.translate(94, 92);
  ctx.rotate(0.27);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  [15, 25, 35].forEach((h, i) => {
    ctx.globalAlpha = 0.55 + i * 0.2;
    ctx.beginPath();
    ctx.moveTo(i * 14, 13);
    ctx.lineTo(i * 14, 13 - h);
    ctx.stroke();
  });
  ctx.restore();
  text(ctx, "SaiLog.", 160, 106, 43, ink, 700);
  text(ctx, "READ BETWEEN THE LINES", 1000, 103, 18, muted, 500, "right");
  ctx.fillStyle = border;
  ctx.fillRect(80, 148, 920, 1);
  rect(ctx, 80, 190, 240, 42, 12, soft);
  text(
    ctx,
    data.sample ? "가상 샘플 리포트" : "우리의 대화 리포트",
    200,
    218,
    20,
    accent,
    600,
    "center",
  );
  text(ctx, "우리 사이를 기록하다.", 80, 314, 57, ink, 650);
  text(ctx, "두 사람이 쌓아온 대화의 한 페이지", 82, 365, 25, muted);
  text(
    ctx,
    `${prettyDate(data.start)} — ${prettyDate(data.end)}`,
    82,
    410,
    22,
    muted,
  );

  rect(ctx, 80, 454, 920, 210, 28, surface);
  text(ctx, "주고받은 메시지", 116, 508, 25, muted, 500);
  text(ctx, `${number(data.total)}개`, 116, 613, 93, ink, 650);
  // Two quiet, offset speech forms express dialogue without showing any source text.
  rect(ctx, 810, 508, 96, 64, 20, soft);
  rect(ctx, 858, 549, 96, 64, 20, border);

  rect(ctx, 80, 688, 920, 300, 28, surface);
  text(ctx, "대화를 여는 첫마디", 116, 744, 27, ink, 600);
  text(
    ctx,
    `${data.sessionHours}시간 이상 공백 후, 새 대화를 시작한 비율`,
    116,
    782,
    21,
    muted,
  );
  text(ctx, data.names[0], 116, 834, 25, accent, 500, "left", 380);
  text(ctx, data.names[1], 964, 834, 25, second, 500, "right", 380);
  text(
    ctx,
    data.starterPercent ? `${number(data.starterPercent[0])}%` : "기록 없음",
    116,
    888,
    42,
    ink,
    600,
  );
  text(
    ctx,
    data.starterPercent ? `${number(data.starterPercent[1])}%` : "기록 없음",
    964,
    888,
    42,
    ink,
    600,
    "right",
  );
  rect(ctx, 116, 916, 848, 16, 8, data.starterPercent ? second : border);
  if (data.starterPercent && data.starterPercent[0] > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(116, 916, (848 * data.starterPercent[0]) / 100, 16);
    ctx.clip();
    rect(ctx, 116, 916, 848, 16, 8, accent);
    ctx.restore();
  }
  text(ctx, `A · ${number(data.starts[0])}회`, 116, 966, 20, muted);
  text(
    ctx,
    `B · ${number(data.starts[1])}회`,
    964,
    966,
    20,
    muted,
    400,
    "right",
  );

  rect(ctx, 80, 1012, 920, 146, 28, soft);
  text(ctx, "최장 연속 연락", 116, 1065, 27, ink, 600);
  text(ctx, "하루 한 번 이상 대화한 날이 이어진 기록", 116, 1110, 20, muted);
  text(
    ctx,
    `${number(data.longestStreak)}일`,
    964,
    1105,
    64,
    accent,
    600,
    "right",
  );
  text(
    ctx,
    data.limitedSample
      ? "기록이 적어 통계를 해석할 때 주의가 필요해요."
      : "우리의 대화는 숫자보다 더 많은 이야기를 담고 있어요.",
    540,
    1218,
    21,
    muted,
    400,
    "center",
  );
  ctx.fillStyle = border;
  ctx.fillRect(80, 1255, 920, 1);
  text(
    ctx,
    data.anonymous
      ? "익명 카드 · 대화 원문 제외"
      : "이름 포함 카드 · 대화 원문 제외",
    80,
    1298,
    18,
    muted,
  );
  text(
    ctx,
    data.sample
      ? "가상 데이터로 만든 체험용 카드"
      : "기록에 기반한 통계 · 감정 추측 없음",
    1000,
    1298,
    18,
    muted,
    400,
    "right",
  );
}

export function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("이미지를 만들지 못했어요. 다시 시도해 주세요.")),
      "image/png",
    ),
  );
}
