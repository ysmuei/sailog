import { lazy, Suspense, useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import Landing from "../pages/Landing";
import { Header } from "../components/layout/Header";
import { Progress } from "../components/ui/Progress";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Settings } from "../features/dashboard/Settings";
import { useAnalysis } from "../hooks/useAnalysis";

const Dashboard = lazy(() => import("../features/dashboard/Dashboard"));
function initialDark() {
  try {
    const saved = localStorage.getItem("sailog-theme-v1");
    if (saved) return saved === "dark";
  } catch {
    /* Theme storage is optional. */
  }
  return matchMedia("(prefers-color-scheme: dark)").matches;
}
export default function App() {
  const analysis = useAnalysis();
  const [dark, setDark] = useState(initialDark);
  const [home, setHome] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#19191d" : "#faf9f7");
    try {
      localStorage.setItem("sailog-theme-v1", dark ? "dark" : "light");
    } catch {
      /* No data persistence is required. */
    }
  }, [dark]);
  const dashboard = !!analysis.report && !home;
  return (
    <>
      <a href="#main" className="skip-link">
        본문으로 건너뛰기
      </a>
      <div className="app-shell">
        <Header
          dashboard={dashboard}
          dark={dark}
          toggleTheme={() => setDark(!dark)}
          goHome={() => {
            setHome(true);
            window.scrollTo({ top: 0 });
            history.replaceState(null, "", location.pathname);
          }}
        />
        <main id="main">
          {analysis.error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={20} aria-hidden="true" />
              <span>{analysis.error}</span>
              <Button
                variant="ghost"
                className="icon-button"
                onClick={analysis.clearError}
                aria-label="오류 알림 닫기"
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>
          )}
          {analysis.busy && !analysis.report ? (
            <Progress
              stage={analysis.stage}
              progress={analysis.progress}
              cancel={analysis.reset}
            />
          ) : dashboard && analysis.info && analysis.report ? (
            <Suspense
              fallback={
                <div role="status" className="dashboard-skeleton">
                  <div />
                  <div />
                  <div />
                  <p>대시보드를 준비하고 있어요…</p>
                </div>
              }
            >
              <Dashboard
                info={analysis.info}
                report={analysis.report}
                busy={analysis.busy}
                anonymous={anonymous}
                setAnonymous={setAnonymous}
                onAnalyze={analysis.run}
                onDelete={() => {
                  analysis.reset();
                  history.replaceState(null, "", location.pathname);
                }}
              />
            </Suspense>
          ) : analysis.info && !home ? (
            <Settings
              info={analysis.info}
              busy={analysis.busy}
              onAnalyze={(options, hideNames) => {
                setAnonymous(hideNames);
                analysis.run(options);
                window.scrollTo({ top: 0 });
                location.hash = "overview";
              }}
              onCancel={analysis.reset}
            />
          ) : (
            <>
              {analysis.info && (
                <div className="resume-banner">
                  <p>읽어온 기록이 메모리에 남아 있어요.</p>
                  <Button variant="secondary" onClick={() => setHome(false)}>
                    {analysis.report
                      ? "대시보드로 돌아가기"
                      : "분석 설정으로 돌아가기"}
                  </Button>
                  <Modal
                    title="읽어온 데이터를 삭제할까요?"
                    description="브라우저 메모리의 대화와 통계를 제거해요. 기기의 원본 파일은 그대로 남아요."
                    trigger={<Button variant="ghost">데이터 삭제</Button>}
                  >
                    <Button variant="danger" onClick={analysis.reset}>
                      데이터 삭제하기
                    </Button>
                  </Modal>
                </div>
              )}
              <Landing
                onFile={(file) => {
                  setHome(false);
                  analysis.load(file);
                  window.scrollTo({ top: 0 });
                }}
                onSample={() => {
                  setHome(false);
                  analysis.load();
                  window.scrollTo({ top: 0 });
                }}
              />
            </>
          )}
        </main>
        <footer className="site-footer">
          <a
            className="footer-brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setHome(true);
              window.scrollTo({ top: 0 });
            }}
          >
            SaiLog<span className="brand-dot">.</span>
          </a>
          <span>기록과 기록 사이, 우리를 발견하다.</span>
          <span>READ BETWEEN THE LINES</span>
        </footer>
      </div>
    </>
  );
}
