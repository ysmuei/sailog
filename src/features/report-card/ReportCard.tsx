import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Download, ImageDown, LoaderCircle, ShieldCheck } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import type { Report } from "../../types/chat";
import { createReportCardData, reportCardFilename } from "./model";
import {
  CARD_METRICS,
  DEFAULT_METRICS,
  MAX_CARD_METRICS,
  cardMetric,
  type CardMetric,
} from "./metrics";
import {
  CARD_SIZE,
  canvasPng,
  cardPalette,
  drawReportCard,
  type CardStyle,
} from "./canvas";
import "./report-card.css";

type Props = {
  report: Report;
  sample: boolean;
  participantNames: [string, string];
  anonymous: boolean;
  disabled: boolean;
};
export function ReportCard({ disabled, ...props }: Props) {
  return (
    <Modal
      title="우리의 기록을 한 장에"
      description="선택한 기간의 통계 중 카드에 담고 싶은 항목을 골라보세요."
      className="report-card-dialog"
      trigger={
        <Button disabled={disabled}>
          <ImageDown size={16} aria-hidden="true" /> 리포트 카드 저장
        </Button>
      }
    >
      <CardEditor {...props} />
    </Modal>
  );
}
function CardEditor({
  report,
  sample,
  participantNames,
  anonymous,
}: Omit<Props, "disabled">) {
  const [includeNames, setIncludeNames] = useState(!anonymous),
    [style, setStyle] = useState<CardStyle>("rose");
  const [selected, setSelected] = useState<CardMetric[]>(DEFAULT_METRICS);
  const [ready, setReady] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null),
    mounted = useRef(false);
  const summaryId = useId();
  const [nameA, nameB] = participantNames;
  const data = useMemo(
    () =>
      createReportCardData(report, {
        sample,
        includeNames,
        participantNames: [nameA, nameB],
      }),
    [report, sample, includeNames, nameA, nameB],
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (cancelled || !canvas.current) return;
      try {
        drawReportCard(canvas.current, data, cardPalette(style), selected);
        setReady(true);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "카드를 만들지 못했어요. 다시 열어 주세요.",
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [data, style, selected]);
  function editing() {
    setReady(false);
    setError("");
    setStatus("");
  }
  async function save() {
    if (!canvas.current || !ready || saving) return;
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const blob = await canvasPng(canvas.current);
      if (!mounted.current) return;
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = reportCardFilename(data);
        link.click();
        setStatus(
          "PNG 다운로드를 시작했어요. 브라우저의 다운로드를 확인해 주세요.",
        );
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      if (mounted.current)
        setError("이미지를 저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      if (mounted.current) setSaving(false);
    }
  }
  return (
    <div className="report-card-layout">
      <figure className="report-card-preview">
        <canvas
          ref={canvas}
          width={CARD_SIZE.width}
          height={CARD_SIZE.height}
          role="img"
          aria-label="저장할 리포트 카드 미리보기"
          aria-describedby={summaryId}
        />
        <figcaption>PNG · 1080 × 1350</figcaption>
      </figure>
      <div className="report-card-controls">
        <div className="report-card-privacy">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>
            {includeNames ? "이름 포함 · 원문 제외" : "익명화 · 원문 제외"}
          </span>
        </div>
        <fieldset disabled={saving}>
          <legend>카드 색상</legend>
          <div className="report-card-styles">
            {(["rose", "lavender"] as const).map((value) => (
              <label
                key={value}
                className={`report-style ${style === value ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="card-style"
                  value={value}
                  checked={style === value}
                  onChange={() => {
                    editing();
                    setStyle(value);
                  }}
                />
                <i
                  className={`report-swatch swatch-${value}`}
                  aria-hidden="true"
                />
                {value === "rose" ? "로즈" : "라벤더"}
              </label>
            ))}
          </div>
          <label className="check-field report-names">
            <input
              name="include-names"
              type="checkbox"
              checked={includeNames}
              onChange={(e) => {
                editing();
                setIncludeNames(e.target.checked);
              }}
              aria-describedby="report-names-help"
            />{" "}
            참여자 이름 표시
          </label>
          <p id="report-names-help" className="report-card-help">
            선택하면 참여자 이름이 이미지에 포함돼요. 대화 원문과 원본 파일명은
            포함되지 않아요.
          </p>
        </fieldset>
        <fieldset className="report-card-metrics" disabled={saving}>
          <legend>카드에 담을 항목</legend>
          <p className="report-card-help">
            최소 1개, 최대 4개까지 선택할 수 있어요. ({selected.length}/4)
          </p>
          <div className="report-card-metric-options">
            {CARD_METRICS.map(({ id, label }) => (
              <label className="check-field" key={id}>
                <input
                  type="checkbox"
                  checked={selected.includes(id)}
                  disabled={
                    (selected.length === 1 && selected.includes(id)) ||
                    (selected.length === MAX_CARD_METRICS &&
                      !selected.includes(id))
                  }
                  onChange={(event) => {
                    const checked = event.target.checked;
                    editing();
                    setSelected((current) =>
                      checked
                        ? CARD_METRICS.map((metric) => metric.id).filter(
                            (metric) =>
                              metric === id || current.includes(metric),
                          )
                        : current.filter((metric) => metric !== id),
                    );
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <dl id={summaryId} className="report-card-summary">
          {selected.map((id) => {
            const metric = cardMetric(data, id);
            return (
              <div key={id}>
                <dt>
                  {metric.label}
                  {metric.detail && <small> {metric.detail}</small>}
                </dt>
                <dd>{metric.value}</dd>
              </div>
            );
          })}
        </dl>
        {sample && (
          <p className="report-card-sample">
            체험용 가상 데이터 표시가 카드에도 포함돼요.
          </p>
        )}
        <Button onClick={save} disabled={!ready || saving} className="w-full">
          {saving ? (
            <LoaderCircle size={16} className="spin" aria-hidden="true" />
          ) : (
            <Download size={16} aria-hidden="true" />
          )}
          {saving ? "이미지 준비 중…" : "PNG 이미지 저장"}
        </Button>
        <p role="status" aria-live="polite" className="report-card-status">
          {status || (!ready && !error ? "미리보기를 준비하고 있어요…" : "")}
        </p>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
