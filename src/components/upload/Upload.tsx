import { useRef, useState } from "react";
import { ArrowUpRight, FileText, LockKeyhole, UploadCloud } from "lucide-react";
import { Button } from "../ui/Button";
export function Upload({
  onFile,
  onSample,
}: {
  onFile: (file: File) => void;
  onSample: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dropError, setDropError] = useState("");
  const depth = useRef(0);
  return (
    <section aria-label="대화 파일 업로드" className="upload-card" id="upload">
      <div
        className={`drop-zone ${dragging ? "dragging" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          depth.current++;
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          if (--depth.current <= 0) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          depth.current = 0;
          setDragging(false);
          setDropError("");
          if (e.dataTransfer.files.length === 1)
            onFile(e.dataTransfer.files[0]);
          else if (e.dataTransfer.files.length > 1)
            setDropError("파일은 한 번에 하나씩 선택해 주세요.");
        }}
      >
        <div className="upload-icon">
          <UploadCloud size={25} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h2>두 사람의 이야기를 가져오세요</h2>
        <p>카카오톡 대화 파일을 여기에 놓아주세요.</p>
        <input
          ref={input}
          type="file"
          className="sr-only"
          tabIndex={-1}
          accept=".txt,.csv,.zip"
          aria-label="카카오톡 대화 파일"
          onChange={(e) => {
            setDropError("");
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
        <Button onClick={() => input.current?.click()}>
          <FileText size={16} aria-hidden="true" /> 대화 파일 선택{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Button>
        <span className="file-hint">TXT, CSV, ZIP · 최대 20 MB</span>
      </div>
      {dropError && (
        <p role="alert" className="error-message mt-3">
          {dropError}
        </p>
      )}
      <div className="upload-foot">
        <LockKeyhole size={14} aria-hidden="true" />
        <span>대화 파일은 서버로 전송되지 않아요.</span>
      </div>
      <div className="sample-action">
        <span>먼저 둘러보고 싶다면</span>
        <button onClick={onSample}>
          샘플로 체험하기 <ArrowUpRight size={14} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
