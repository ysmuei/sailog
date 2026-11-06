import { prettyDate } from "../../lib/date";
import { cardMetric, type CardMetric } from "./metrics";
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
  selected: CardMetric[],
) {
  canvas.width = CARD_SIZE.width;
  canvas.height = CARD_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error(
      "이 브라우저에서는 이미지를 만들 수 없어요. 다른 브라우저에서 다시 시도해 주세요.",
    );
  const { paper, surface, ink, muted, border, accent, soft } = palette;
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

  const gap = 18;
  const height = (704 - gap * (selected.length - 1)) / selected.length;
  selected.forEach((id, index) => {
    const item = cardMetric(data, id);
    const y = 454 + index * (height + gap);
    rect(
      ctx,
      80,
      y,
      920,
      height,
      28,
      index === selected.length - 1 ? soft : surface,
    );
    text(ctx, item.label, 116, y + 44, 25, muted, 500);
    text(
      ctx,
      item.value,
      116,
      y + height * 0.68,
      selected.length === 4 ? 42 : 52,
      ink,
      650,
      "left",
      840,
    );
    if (item.detail)
      text(ctx, item.detail, 116, y + height - 22, 20, muted, 400, "left", 840);
  });

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
