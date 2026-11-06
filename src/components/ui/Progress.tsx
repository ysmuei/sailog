import { LoaderCircle } from "lucide-react";
import { Button } from "./Button";
export function Progress({
  stage,
  progress,
  cancel,
}: {
  stage: string;
  progress: number;
  cancel: () => void;
}) {
  return (
    <div className="progress-panel" role="status" aria-live="polite">
      <LoaderCircle className="spin" size={24} aria-hidden="true" />
      <strong>{stage}</strong>
      <div
        role="progressbar"
        aria-label="파일 처리"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="progress-track"
      >
        <div
          style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }}
        />
      </div>
      <span className="text-sm text-muted">
        브라우저 안에서 안전하게 처리 중 · {progress}%
      </span>
      <Button variant="secondary" onClick={cancel}>
        업로드 취소
      </Button>
    </div>
  );
}
