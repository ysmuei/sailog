import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { SeriesPoint } from "../../types/chat";
import { prettyDate } from "../../lib/date";
import { Button } from "../ui/Button";
export function Heatmap({ data }: { data: SeriesPoint[] }) {
  const [offset, setOffset] = useState(0),
    [selected, setSelected] = useState<SeriesPoint | null>(null);
  const end = Math.max(1, data.length - offset * 112),
    start = Math.max(0, end - 112),
    visible = data.slice(start, end);
  const max = Math.max(1, ...visible.map((d) => d.total));
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>대화가 쌓인 날들</h2>
          <p>날짜를 선택해 대화량을 확인하세요 · 112일씩 표시</p>
        </div>
        <div className="flex">
          <Button
            variant="ghost"
            className="icon-button"
            aria-label="이전 112일"
            disabled={start === 0}
            onClick={() => {
              setOffset(offset + 1);
              setSelected(null);
            }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            className="icon-button"
            aria-label="다음 112일"
            disabled={offset === 0}
            onClick={() => {
              setOffset(offset - 1);
              setSelected(null);
            }}
          >
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="heatmap">
        {visible.map((day) => (
          <button
            key={day.label}
            className={`heat-cell heat-${day.total ? Math.min(4, Math.ceil((day.total / max) * 4)) : 0}`}
            title={`${day.label}: ${day.total}개`}
            aria-label={`${prettyDate(day.label)}, 메시지 ${day.total}개`}
            onClick={() => setSelected(day)}
          />
        ))}
      </div>
      <div className="heatmap-caption">
        <span>
          {visible[0]?.label} — {visible.at(-1)?.label}
        </span>
        <span>
          적음 <i className="heat-0" />
          <i className="heat-2" />
          <i className="heat-4" /> 많음
        </span>
      </div>
      <p className="text-sm text-muted mt-4" aria-live="polite">
        {selected
          ? `${prettyDate(selected.label)} · 참여자 A ${selected.a}개 / 참여자 B ${selected.b}개`
          : "빈 칸은 대화가 없었던 날이에요."}
      </p>
    </section>
  );
}
