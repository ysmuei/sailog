import { useState } from "react";
import { ArrowRight, Check, FileCheck2, Info, ShieldCheck } from "lucide-react";
import type { AnalysisOptions, ChatInfo } from "../../types/chat";
import { number, prettyDate } from "../../lib/date";
import { Button } from "../../components/ui/Button";

export function Settings({
  info,
  busy,
  onAnalyze,
  onCancel,
}: {
  info: ChatInfo;
  busy: boolean;
  onAnalyze: (options: AnalysisOptions, anonymous: boolean) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState(""),
    [anonymous, setAnonymous] = useState(!info.sample);
  return (
    <section className="setup-screen">
      <div className="setup-intro">
        <span className="eyebrow">READY WHEN YOU ARE</span>
        <h1>우리의 기록이 준비됐어요.</h1>
        <p>두 사람과 분석할 기간을 확인해 주세요.</p>
      </div>
      <div className="panel setup-panel">
        <div className="file-success">
          <span className="mini-icon pink">
            <FileCheck2 size={22} aria-hidden="true" />
          </span>
          <div>
            <strong>
              {info.sample ? "가상 샘플 대화" : "대화 파일 읽기 완료"}
            </strong>
            <p>
              {number(info.messageCount)}개 메시지 · {info.participants.length}
              명 · {info.encoding}
            </p>
          </div>
          <Check size={19} aria-hidden="true" />
        </div>
        <p className="text-sm text-muted mb-6">
          {prettyDate(info.start)} — {prettyDate(info.end)}
        </p>
        {info.sample && (
          <div className="notice mb-6">
            <Info size={17} aria-hidden="true" /> 체험용으로 만든 가상 대화예요.
            실제 인물의 기록이 아니에요.
          </div>
        )}
        {info.participants.length > 2 && (
          <div className="notice mb-6">
            여러 명이 참여한 대화예요. 선택한 두 사람의 메시지만 분석하므로 실제
            1:1 대화와 결과가 다를 수 있어요.
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const participants: [string, string] = [
              String(data.get("a")),
              String(data.get("b")),
            ];
            const start = String(data.get("start")),
              end = String(data.get("end"));
            if (participants[0] === participants[1] || !participants[1]) {
              setError("서로 다른 두 참여자를 선택해 주세요.");
              return;
            }
            if (start > end) {
              setError("시작일이 종료일보다 늦어요. 기간을 확인해 주세요.");
              return;
            }
            setError("");
            onAnalyze(
              {
                participants,
                start,
                end,
                sessionHours: Number(data.get("hours")),
              },
              anonymous,
            );
          }}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="field">
              참여자 A
              <select name="a" defaultValue={info.participants[0]?.id}>
                {info.participants.map((p, i) => (
                  <option key={p.id} value={p.id}>
                    {anonymous ? `참여자 ${i + 1}` : p.name} ({number(p.count)}
                    개)
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              참여자 B
              <select name="b" defaultValue={info.participants[1]?.id || ""}>
                <option value="" disabled>
                  참여자 선택
                </option>
                {info.participants.map((p, i) => (
                  <option key={p.id} value={p.id}>
                    {anonymous ? `참여자 ${i + 1}` : p.name} ({number(p.count)}
                    개)
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              분석 시작일
              <input
                type="date"
                name="start"
                required
                min={info.start}
                max={info.end}
                defaultValue={info.start}
              />
            </label>
            <label className="field">
              분석 종료일
              <input
                type="date"
                name="end"
                required
                min={info.start}
                max={info.end}
                defaultValue={info.end}
              />
            </label>
          </div>
          <label className="field mt-4">
            새 대화로 구분할 공백
            <select name="hours" defaultValue="6">
              {[1, 3, 6, 12, 24].map((h) => (
                <option key={h} value={h}>
                  {h}시간 이상{h === 6 ? " (기본)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="check-field mt-4">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />{" "}
            참여자 이름을 가려서 확인하기
          </label>
          <p className="text-xs text-muted mt-2">
            이름 표시 설정은 대시보드에서도 변경할 수 있어요.
          </p>
          {error && (
            <p role="alert" className="error-message mt-4">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-7">
            <Button variant="secondary" onClick={onCancel}>
              다른 파일 선택
            </Button>
            <Button
              type="submit"
              disabled={busy || info.participants.length < 2}
              className="flex-1"
            >
              분석 시작하기 <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
          {info.participants.length < 2 && (
            <p role="alert" className="error-message mt-4">
              분석하려면 발신자가 두 명 이상인 대화가 필요해요.
            </p>
          )}
        </form>
        <div className="mt-5 text-xs text-muted flex items-center gap-2">
          <ShieldCheck size={14} aria-hidden="true" /> 원문은 브라우저
          메모리에만 있어요.
        </div>
        <details className="data-details mt-5">
          <summary>파싱 결과와 제외 내역</summary>
          <p className="text-sm mt-3">
            형식: {info.format} · 안내·시스템 메시지 {info.ignoredSystem}행 제외
          </p>
          {info.issues.length ? (
            <ul className="issue-list">
              {info.issues.map((issue) => (
                <li key={issue.reason}>
                  첫 위치 {issue.line}행 · {issue.reason} · {issue.count}행
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted mt-2">
              식별하지 못한 행이 없어요.
            </p>
          )}
          <p className="text-xs text-muted mt-3">
            TXT의 여러 줄 내용은 한 메시지로 합쳐져요. 식별 실패 행 수가 누락된
            메시지 수와 같지는 않아요. 원문을 출력하지 않습니다.
          </p>
        </details>
      </div>
    </section>
  );
}
