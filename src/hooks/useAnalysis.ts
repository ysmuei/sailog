import { useEffect, useRef, useState } from "react";
import type { AnalysisOptions, ChatInfo, Report } from "../types/chat";
import { validateFile } from "../features/chat-parser/file-validation";

export function useAnalysis() {
  const worker = useRef<Worker | null>(null),
    requestId = useRef(0);
  const [info, setInfo] = useState<ChatInfo | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => () => worker.current?.terminate(), []);
  function ensureWorker() {
    if (worker.current) return worker.current;
    const w = new Worker(
      new URL("../workers/analysis.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.current = w;
    w.onmessage = ({ data }) => {
      if (data.id !== requestId.current) return;
      if (data.type === "progress") {
        setProgress(data.progress);
        setStage(data.stage);
      }
      if (data.type === "info") {
        setInfo(data.info);
        setBusy(false);
        setProgress(100);
      }
      if (data.type === "report") {
        setReport(data.report);
        setBusy(false);
      }
      if (data.type === "error") {
        setError(data.error);
        setBusy(false);
      }
    };
    w.onerror = () => {
      setError(
        "분석 작업이 중단되었어요. 파일 크기를 확인한 뒤 다시 시도해 주세요.",
      );
      setBusy(false);
      w.terminate();
      worker.current = null;
    };
    return w;
  }
  function reset() {
    worker.current?.terminate();
    worker.current = null;
    requestId.current++;
    setInfo(null);
    setReport(null);
    setBusy(false);
    setProgress(0);
    setError("");
    setStage("");
  }
  function load(file?: File) {
    if (file) {
      try {
        validateFile(file);
      } catch (e) {
        setError((e as Error).message);
        return;
      }
    }
    reset();
    setBusy(true);
    setStage("대화 기록을 준비하고 있어요…");
    ensureWorker().postMessage({
      id: ++requestId.current,
      action: file ? "file" : "sample",
      file,
    });
  }
  function run(options: AnalysisOptions) {
    setBusy(true);
    setError("");
    setStage("두 사람의 연락 패턴을 분석하고 있어요…");
    ensureWorker().postMessage({
      id: ++requestId.current,
      action: "analyze",
      options,
    });
  }
  return {
    info,
    report,
    busy,
    progress,
    stage,
    error,
    load,
    run,
    reset,
    clearError: () => setError(""),
  };
}
