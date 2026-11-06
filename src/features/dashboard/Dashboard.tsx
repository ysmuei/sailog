import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Download,
  Info,
  MessageCircle,
  MessagesSquare,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { ChartPanel } from "../../components/charts/ChartPanel";
import { Heatmap } from "../../components/charts/Heatmap";
import { ReportCard } from "../report-card/ReportCard";
import { duration, number, prettyDate, shiftDay } from "../../lib/date";
import type { AnalysisOptions, ChatInfo, Report } from "../../types/chat";

const tabs = [
  { key: "overview", label: "종합 대시보드", Icon: Activity },
  { key: "contact", label: "연락 분석", Icon: CalendarDays },
  { key: "patterns", label: "대화 패턴", Icon: MessagesSquare },
  { key: "changes", label: "관계 변화", Icon: Users },
] as const;
type Tab = (typeof tabs)[number]["key"];
const readTab = (): Tab =>
  tabs.find((t) => `#${t.key}` === location.hash)?.key || "overview";

function Split({
  a,
  b,
  names,
  label,
}: {
  a: number;
  b: number;
  names: [string, string];
  label: string;
}) {
  const percent = a + b ? (a / (a + b)) * 100 : 0;
  return (
    <div className="split">
      <div className="split-labels">
        <span>
          <i className="dot-a" /> A · {names[0]}
        </span>
        <span>
          B · {names[1]} <i className="dot-b" />
        </span>
      </div>
      <div className="split-values">
        <strong>
          {number(a)}
          <small>{label}</small>
        </strong>
        <strong>
          {number(b)}
          <small>{label}</small>
        </strong>
      </div>
      <div
        className="split-track"
        role="img"
        aria-label={`A ${number(percent)}%, B ${number(a + b ? 100 - percent : 0)}%`}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="split-percent">
        <span>{number(percent)}%</span>
        <span>{number(a + b ? 100 - percent : 0)}%</span>
      </div>
    </div>
  );
}
function Metric({
  label,
  value,
  detail,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  Icon: typeof MessageCircle;
  tone: string;
}) {
  return (
    <article className="metric-card">
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}>
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
function Compare({
  report,
  names,
}: {
  report: Report;
  names: [string, string];
}) {
  const [a, b] = report.people;
  const rows = [
    ["메시지 수", `${number(a.messages)}개`, `${number(b.messages)}개`],
    ["선톡 횟수", `${a.starts}회`, `${b.starts}회`],
    ["평균 답장 시간", duration(a.averageReply), duration(b.averageReply)],
    ["답장 표본 수", `${a.replies}회`, `${b.replies}회`],
    [
      "평균 텍스트 길이",
      `${number(a.textMessages ? a.characters / a.textMessages : 0)}자`,
      `${number(b.textMessages ? b.characters / b.textMessages : 0)}자`,
    ],
    [
      "짧은 답변 (10자 이하)",
      `${a.short}개 (${number(a.textMessages ? (a.short / a.textMessages) * 100 : 0)}%)`,
      `${b.short}개 (${number(b.textMessages ? (b.short / b.textMessages) * 100 : 0)}%)`,
    ],
    [
      "긴 답변 (50자 이상)",
      `${a.long}개 (${number(a.textMessages ? (a.long / a.textMessages) * 100 : 0)}%)`,
      `${b.long}개 (${number(b.textMessages ? (b.long / b.textMessages) * 100 : 0)}%)`,
    ],
  ];
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>두 사람의 대화 습관</h2>
          <p>같은 기준으로 나란히 살펴봐요</p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="compare-table">
          <caption className="sr-only">참여자별 통계 비교</caption>
          <thead>
            <tr>
              <th scope="col">분석 항목</th>
              <th scope="col">A · {names[0]}</th>
              <th scope="col">B · {names[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                <th scope="row">{row[0]}</th>
                <td>{row[1]}</td>
                <td>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted mt-4">
        길이는 공백을 포함한 텍스트 글자 수예요. 미디어·삭제 메시지는 길이와
        짧은/긴 답변 비율의 계산에서 제외합니다.
      </p>
    </section>
  );
}
function Method({ hours }: { hours: number }) {
  return (
    <Modal
      title="숫자를 읽는 기준"
      description="통계는 관찰된 기록이며 마음이나 호감을 의미하지 않아요."
      trigger={
        <Button variant="ghost">
          <Info size={15} aria-hidden="true" /> 분석 기준
        </Button>
      }
    >
      <div className="method-list">
        <p>
          <strong>선톡</strong>
          {hours}시간 이상 공백이 생기면 새 세션으로 구분해요. 첫 메시지를 보낸
          사람이 그 세션의 선톡자로 계산됩니다. 기간의 첫 메시지도 새
          세션이에요.
        </p>
        <p>
          <strong>답장 시간</strong>같은 사람이 연속해서 보낸 메시지를 한 발화
          묶음으로 보고, 마지막 메시지부터 상대방의 첫 메시지까지 계산해요.{" "}
          {hours}시간 이상 공백은 답장 표본에서 제외합니다. 같은 분에 오간
          메시지는 0초일 수 있어요.
        </p>
        <p>
          <strong>대화 지속 시간</strong>세션 첫 메시지부터 마지막 메시지까지의
          시간이에요. 한 메시지만 있으면 0초입니다.
        </p>
        <p>
          <strong>해석의 한계</strong>수면 시간·자정 넘김·업무·장기 공백은
          별도로 보정하지 않아요. 한국 시간(UTC+9)으로 집계합니다. 실제
          열람·입력 시간과 다를 수 있어요.
        </p>
        <p>
          <strong>연락 변화</strong>선택한 종료일을 기준으로 최근 30일과 그 이전
          30일을 비교해요. 이전 기간이 0개이거나 60일이 확보되지 않으면 증감률을
          계산하지 않습니다.
        </p>
      </div>
    </Modal>
  );
}

export default function Dashboard({
  info,
  report,
  busy,
  onAnalyze,
  onDelete,
  anonymous,
  setAnonymous,
}: {
  info: ChatInfo;
  report: Report;
  busy: boolean;
  onAnalyze: (options: AnalysisOptions) => void;
  onDelete: () => void;
  anonymous: boolean;
  setAnonymous: (value: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>(readTab);
  const [granularity, setGranularity] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
  const [filterError, setFilterError] = useState("");
  const [preset, setPreset] = useState("all");
  useEffect(() => {
    const changed = () => setTab(readTab());
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  const names: [string, string] = report.options.participants.map((id, i) =>
    anonymous
      ? `참여자 ${i === 0 ? "A" : "B"}`
      : info.participants.find((p) => p.id === id)!.name,
  ) as [string, string];
  const [a, b] = report.people;
  const change = report.recent.change;
  const timeline = report[granularity];
  function exportSummary() {
    const safe = {
      service: "SaiLog",
      sample: info.sample,
      kind: report.kind,
      period: { start: report.options.start, end: report.options.end },
      sessionHours: report.options.sessionHours,
      total: report.total,
      activeDays: report.activeDays,
      people: report.people.map((p, i) => ({ ...p, id: i === 0 ? "A" : "B" })),
      recent: report.recent,
      warnings: report.warnings,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(safe, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "sailog-summary.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="dashboard">
      <div className="dashboard-topline">
        <div className="breadcrumb">
          우리의 기록 <ChevronRight size={13} aria-hidden="true" />{" "}
          <span>{tabs.find((t) => t.key === tab)?.label}</span>
        </div>
        <div className={`dataset-badge ${info.sample ? "is-sample" : ""}`}>
          <span />
          {info.sample ? "체험용 가상 데이터" : "내 기기에서 분석한 데이터"}
        </div>
      </div>
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">OUR CONVERSATION, AT A GLANCE</span>
          <h1>
            {anonymous ? "두 사람" : names.join("과 ")}의 대화 기록
            <span className="brand-dot">.</span>
          </h1>
          <p>
            {prettyDate(report.options.start)} —{" "}
            {prettyDate(report.options.end)}{" "}
            <span>· {number(report.calendarDays)}일의 기록</span>
          </p>
        </div>
        <div className="dashboard-actions">
          <ReportCard
            report={report}
            sample={info.sample}
            anonymous={anonymous}
            participantNames={
              report.options.participants.map(
                (id) => info.participants.find((p) => p.id === id)!.name,
              ) as [string, string]
            }
            disabled={busy || !report.total}
          />
          <Button variant="secondary" onClick={exportSummary}>
            <Download size={16} aria-hidden="true" /> 통계 저장
          </Button>
          <Modal
            title="분석 데이터를 삭제할까요?"
            description="대화 원문과 통계가 브라우저 메모리에서 제거돼요. 기기의 원본 파일은 그대로 남아요."
            trigger={
              <Button
                variant="ghost"
                className="icon-button"
                aria-label="분석 데이터 삭제"
              >
                <Trash2 size={18} aria-hidden="true" />
              </Button>
            }
          >
            <p className="text-sm text-muted">
              다시 분석하려면 파일을 선택하거나 샘플 체험을 시작해 주세요.
            </p>
            <Button variant="danger" onClick={onDelete}>
              데이터 삭제하기
            </Button>
          </Modal>
        </div>
      </div>
      <nav className="dashboard-tabs" aria-label="분석 화면">
        {tabs.map(({ key, label, Icon }) => (
          <a
            key={key}
            href={`#${key}`}
            aria-current={tab === key ? "page" : undefined}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>
      <section
        className="filter-panel"
        aria-label="전체 그래프와 통계 기간 필터"
      >
        <form
          key={`${report.options.start}-${report.options.end}-${report.options.participants.join("-")}-${report.options.sessionHours}`}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const start = String(data.get("start")),
              end = String(data.get("end")),
              participants: [string, string] = [
                String(data.get("a")),
                String(data.get("b")),
              ];
            if (start > end) {
              setFilterError("시작일과 종료일을 확인해 주세요.");
              return;
            }
            if (participants[0] === participants[1]) {
              setFilterError("서로 다른 참여자 두 명을 선택해 주세요.");
              return;
            }
            setFilterError("");
            onAnalyze({
              start,
              end,
              participants,
              sessionHours: Number(data.get("hours")),
            });
          }}
        >
          <div className="filter-main">
            <label className="field">
              기간
              <select
                value={preset}
                onChange={(e) => {
                  const value = e.target.value;
                  setPreset(value);
                  if (value !== "custom")
                    onAnalyze({
                      ...report.options,
                      start:
                        value === "all"
                          ? info.start
                          : [
                              info.start,
                              shiftDay(info.end, -(Number(value) - 1)),
                            ]
                              .sort()
                              .at(-1)!,
                      end: info.end,
                    });
                }}
              >
                <option value="all">전체 기간</option>
                <option value="90">최근 90일</option>
                <option value="30">최근 30일</option>
                <option value="custom">직접 선택</option>
              </select>
            </label>
            <label className="field">
              시작일
              <input
                type="date"
                name="start"
                min={info.start}
                max={info.end}
                defaultValue={report.options.start}
                required
                onChange={() => setPreset("custom")}
              />
            </label>
            <span className="date-dash" aria-hidden="true">
              —
            </span>
            <label className="field">
              종료일
              <input
                type="date"
                name="end"
                min={info.start}
                max={info.end}
                defaultValue={report.options.end}
                required
                onChange={() => setPreset("custom")}
              />
            </label>
            <Button variant="secondary" type="submit" disabled={busy}>
              적용 <ArrowRight size={15} aria-hidden="true" />
            </Button>
            <label className="check-field anonymize">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />{" "}
              이름 가리기
            </label>
          </div>
          <details className="advanced-filter">
            <summary>참여자 · 세션 기준 변경</summary>
            <div className="grid sm:grid-cols-3 gap-4 mt-3">
              <label className="field">
                참여자 A
                <select name="a" defaultValue={report.options.participants[0]}>
                  {info.participants.map((p, i) => (
                    <option key={p.id} value={p.id}>
                      {anonymous ? `참여자 ${i + 1}` : p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                참여자 B
                <select name="b" defaultValue={report.options.participants[1]}>
                  {info.participants.map((p, i) => (
                    <option key={p.id} value={p.id}>
                      {anonymous ? `참여자 ${i + 1}` : p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                세션 분리
                <select name="hours" defaultValue={report.options.sessionHours}>
                  {[1, 3, 6, 12, 24].map((h) => (
                    <option key={h} value={h}>
                      {h}시간 이상 공백
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-xs text-muted mt-3">
              변경 후 적용을 눌러 주세요. 모든 통계·그래프에 같은 기준이
              적용됩니다.
            </p>
          </details>
          {filterError && (
            <p role="alert" className="error-message mt-3">
              {filterError}
            </p>
          )}
        </form>
      </section>
      {busy && (
        <div className="analysis-status" role="status">
          분석 기준을 적용하고 있어요…
        </div>
      )}
      {info.participants.length > 2 && (
        <div className="notice mb-5">
          <Info size={16} aria-hidden="true" /> 여러 명이 참여한 대화에서 선택한
          두 사람의 메시지만 집계한 결과예요.
        </div>
      )}
      {report.warnings.map((w) => (
        <div className="notice mb-4" key={w}>
          <Info size={16} aria-hidden="true" />
          {w}
        </div>
      ))}
      {!report.total ? (
        <section className="panel empty-state">
          <MessageCircle size={32} aria-hidden="true" />
          <h2>이 기간에는 대화가 없어요.</h2>
          <p>다른 기간이나 참여자를 선택해 주세요.</p>
        </section>
      ) : (
        <div className="dashboard-content" key={tab}>
          <div className="metrics-grid">
            <Metric
              label="주고받은 메시지"
              value={`${number(report.total)}개`}
              detail={`A ${number(a.messages)} · B ${number(b.messages)}`}
              Icon={MessageCircle}
              tone="pink"
            />
            <Metric
              label="함께 대화한 날"
              value={`${number(report.activeDays)}일`}
              detail={`전체 ${report.calendarDays}일 중의 기록`}
              Icon={CalendarDays}
              tone="blue"
            />
            <Metric
              label="평균 답장 시간"
              value={duration(report.averageReply)}
              detail={`${number(a.replies + b.replies)}번의 답장 기준`}
              Icon={Clock3}
              tone="lavender"
            />
          </div>
          {tab === "overview" && (
            <>
              <div className="section-row">
                <h2>우리가 나눈 대화의 리듬</h2>
                <Method hours={report.options.sessionHours} />
              </div>
              <div className="dashboard-grid">
                <ChartPanel
                  title="일상의 대화가 쌓이는 시간"
                  subtitle="날짜별 메시지 수 · 선택한 기간의 전체 기록"
                  data={report.daily}
                  names={names}
                />
                <section className="panel starts-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>대화의 첫마디</h2>
                      <p>
                        {report.options.sessionHours}시간 공백 이후, 먼저 건넨
                        인사
                      </p>
                    </div>
                    <span className="mini-icon pink">
                      <MessagesSquare size={19} aria-hidden="true" />
                    </span>
                  </div>
                  <Split a={a.starts} b={b.starts} names={names} label="회" />
                  <p className="soft-note">
                    총 {report.sessions}번의 대화 시작.
                    <br />
                    작은 인사들이 우리의 대화를 만들었어요.
                  </p>
                </section>
              </div>
              <div className="quick-stats">
                <article>
                  <span className="mini-icon blue">
                    <Clock3 size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <p>가장 활발한 시간</p>
                    <strong>
                      {report.peakHour}시 — {report.peakHour! + 1}시
                    </strong>
                    <span>한국 시간 기준</span>
                  </div>
                </article>
                <article>
                  <span className="mini-icon lavender">
                    <CalendarDays size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <p>가장 오래 이어진 연락</p>
                    <strong>{report.longestStreak}일 연속</strong>
                    <span>하루 1개 이상의 메시지</span>
                  </div>
                </article>
                <article>
                  <span className="mini-icon pink">
                    {change !== null && change < 0 ? (
                      <ArrowDownRight size={20} aria-hidden="true" />
                    ) : (
                      <ArrowUpRight size={20} aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <p>최근 30일 연락량 변화</p>
                    <strong>
                      {change === null
                        ? "비교할 기록 부족"
                        : `${change > 0 ? "+" : ""}${number(change)}%`}
                    </strong>
                    <span>그 이전 30일 대비</span>
                  </div>
                </article>
              </div>
              <section className="insight-banner">
                <div className="insight-icon">
                  <ShieldCheck size={23} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div>
                  <h2>숫자는 대화의 한 조각이에요.</h2>
                  <p>
                    연락 패턴에는 각자의 일상과 상황이 담겨 있어요. 이 기록을
                    서로를 이해하는 작은 계기로 삼아보세요.
                  </p>
                </div>
                <a href="#patterns" aria-label="대화 패턴 살펴보기">
                  <ArrowRight size={20} aria-hidden="true" />
                </a>
              </section>
            </>
          )}
          {tab === "contact" && (
            <>
              <div className="section-row">
                <h2>연락이 오가는 시간</h2>
                <Method hours={report.options.sessionHours} />
              </div>
              <ChartPanel
                title="연락 빈도"
                subtitle="메시지 수 · 빈 날짜도 0으로 표시해요"
                data={timeline}
                names={names}
              >
                <label className="sr-only" htmlFor="granularity">
                  집계 단위
                </label>
                <select
                  id="granularity"
                  className="compact-select"
                  value={granularity}
                  onChange={(e) =>
                    setGranularity(e.target.value as typeof granularity)
                  }
                >
                  <option value="daily">일별</option>
                  <option value="weekly">주별</option>
                  <option value="monthly">월별</option>
                </select>
              </ChartPanel>
              <div className="two-columns">
                <ChartPanel
                  title="시간대별 활동"
                  subtitle="한국 시간 0시부터 23시까지"
                  data={report.hourly}
                  names={names}
                  type="bar"
                />
                <ChartPanel
                  title="요일별 활동"
                  subtitle="선택한 기간의 요일별 전체 메시지"
                  data={report.weekdays}
                  names={names}
                  type="bar"
                />
              </div>
              <Heatmap
                key={`${report.options.start}-${report.options.end}`}
                data={report.daily}
              />
              <div className="quick-stats">
                <article>
                  <div>
                    <p>가장 활발했던 날</p>
                    <strong>{report.peakDay?.label}</strong>
                    <span>{number(report.peakDay?.total || 0)}개의 메시지</span>
                  </div>
                </article>
                <article>
                  <div>
                    <p>최장 연속 연락</p>
                    <strong>{report.longestStreak}일</strong>
                    <span>선택한 기간 안에서</span>
                  </div>
                </article>
                <article>
                  <div>
                    <p>가장 긴 무연락 기간</p>
                    <strong>{report.longestGap}일</strong>
                    <span>기간의 시작·끝 공백 포함</span>
                  </div>
                </article>
              </div>
            </>
          )}
          {tab === "patterns" && (
            <>
              <div className="section-row">
                <h2>두 사람만의 대화 방식</h2>
                <Method hours={report.options.sessionHours} />
              </div>
              <div className="two-columns">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>누가 먼저 연락했을까요?</h2>
                      <p>새 세션의 첫 메시지를 보낸 사람</p>
                    </div>
                  </div>
                  <Split a={a.starts} b={b.starts} names={names} label="회" />
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>대화가 이어지는 시간</h2>
                      <p>세션의 첫 메시지부터 마지막 메시지까지</p>
                    </div>
                  </div>
                  <strong className="large-stat">
                    {duration(report.averageSession)}
                  </strong>
                  <p className="text-sm text-muted mt-4">
                    {report.sessions}개 세션의 평균 · 한 메시지 세션은 0초
                  </p>
                </section>
              </div>
              <ChartPanel
                title="답장 속도 분포"
                subtitle={`${report.options.sessionHours}시간 미만의 답장만 포함 · 경계값은 앞 구간에 포함`}
                data={["1분 이하", "1~5분", "5~30분", "30분 초과"].map(
                  (label, i) => ({
                    label,
                    a: a.replies ? (a.distribution[i] / a.replies) * 100 : null,
                    b: b.replies ? (b.distribution[i] / b.replies) * 100 : null,
                  }),
                )}
                names={names}
                unit="%"
                type="bar"
              />
              <Compare report={report} names={names} />
              <div className="notice">
                <Info size={17} aria-hidden="true" /> 같은 사람이 연속해서 보낸
                메시지는 답장 계산에서 한 발화 묶음이에요. 수면·장기 공백의
                영향은 분석 기준에서 확인해 주세요.
              </div>
            </>
          )}
          {tab === "changes" && (
            <>
              <div className="section-row">
                <h2>시간이 지나며 달라진 기록</h2>
                <Method hours={report.options.sessionHours} />
              </div>
              <section className="panel period-comparison">
                <div>
                  <span className="eyebrow">THE LAST 60 DAYS</span>
                  <h2>최근 한 달, 우리의 대화는</h2>
                  <p>선택한 종료일 {report.options.end} 기준</p>
                </div>
                <div>
                  <span>이전 30일</span>
                  <strong>
                    {report.recent.complete
                      ? number(report.recent.previous)
                      : "기록 부족"}
                    <small>{report.recent.complete ? "개" : ""}</small>
                  </strong>
                </div>
                <ArrowRight size={22} aria-hidden="true" />
                <div>
                  <span>최근 30일</span>
                  <strong>
                    {number(report.recent.current)}
                    <small>개</small>
                  </strong>
                </div>
                <span className="change-badge">
                  {change === null
                    ? "증감률 계산 불가"
                    : `${change > 0 ? "+" : ""}${number(change)}%`}
                </span>
              </section>
              <ChartPanel
                title="월별 연락량 변화"
                subtitle="월의 일부만 선택하면 그 기간만 집계해요"
                data={report.monthly}
                names={names}
              />
              <div className="two-columns">
                <ChartPanel
                  title="선톡 비율의 변화"
                  subtitle="월별 새 세션을 시작한 비율"
                  data={report.monthly.map((m) => ({
                    label: m.label,
                    a:
                      m.startsA + m.startsB
                        ? (m.startsA / (m.startsA + m.startsB)) * 100
                        : null,
                    b:
                      m.startsA + m.startsB
                        ? (m.startsB / (m.startsA + m.startsB)) * 100
                        : null,
                  }))}
                  names={names}
                  unit="%"
                />
                <ChartPanel
                  title="평균 답장 시간의 변화"
                  subtitle="표본이 없는 달은 연결하지 않아요"
                  data={report.monthly.map((m) => ({
                    label: m.label,
                    a: m.replyA === null ? null : m.replyA / 60,
                    b: m.replyB === null ? null : m.replyB / 60,
                  }))}
                  names={names}
                  unit="분"
                />
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>대화의 길이 변화</h2>
                    <p>
                      월별 텍스트 길이와 세션 지속 시간 · 가장 활발했던 달:{" "}
                      {
                        [...report.monthly].sort((x, y) => y.total - x.total)[0]
                          ?.label
                      }
                    </p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <caption className="sr-only">월별 대화 길이 변화</caption>
                    <thead>
                      <tr>
                        <th scope="col">월</th>
                        <th scope="col">메시지 수</th>
                        <th scope="col">평균 텍스트 길이</th>
                        <th scope="col">평균 대화 지속 시간</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.monthly.map((m) => (
                        <tr key={m.label}>
                          <th scope="row">{m.label}</th>
                          <td>{number(m.total)}개</td>
                          <td>{number(m.averageLength)}자</td>
                          <td>{duration(m.averageSession)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <div className="notice">
                <Info size={17} aria-hidden="true" /> 이 화면은 통계적 변화만
                보여줘요. 관심·호감·관계 유형을 판단하거나 예측하지 않습니다.
              </div>
            </>
          )}
        </div>
      )}
      <div className="dashboard-bottom">
        <span>
          <ShieldCheck size={14} aria-hidden="true" /> 모든 분석은 이
          브라우저에서만 처리돼요.
        </span>
        <Modal
          title="파일 읽기 결과"
          description="원문을 노출하지 않는 파싱 진단입니다."
          trigger={
            <Button variant="ghost">
              파싱 내역 <ChevronRight size={14} aria-hidden="true" />
            </Button>
          }
        >
          <p>
            메시지 {number(info.messageCount)}개 · {info.format} ·{" "}
            {info.encoding}
          </p>
          <p>안내·시스템 메시지 {number(info.ignoredSystem)}행 제외</p>
          {info.issues.length ? (
            <ul className="issue-list">
              {info.issues.map((i) => (
                <li key={i.reason}>
                  첫 {i.line}행 · {i.reason} · {i.count}행
                </li>
              ))}
            </ul>
          ) : (
            <p>식별하지 못한 행이 없어요.</p>
          )}
          <p className="text-sm text-muted">
            메시지별 시작 행과 형식 정보는 정규화 데이터에 보관해요. 식별하지
            못한 행 수가 누락 메시지 수와 같지는 않습니다.
          </p>
        </Modal>
      </div>
    </div>
  );
}
