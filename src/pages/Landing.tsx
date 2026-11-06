import {
  ArrowDown,
  ArrowRight,
  ChartNoAxesCombined,
  Clock3,
  Fingerprint,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Upload } from "../components/upload/Upload";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";

function Preview() {
  return (
    <div
      className="hero-visual"
      aria-label="연락 패턴 미리보기: 가상 데이터를 사용한 일러스트레이션"
    >
      <div className="visual-orbit orbit-one" />
      <div className="visual-orbit orbit-two" />
      <div className="preview-note">
        <span className="tiny-dot" /> EVERY CONVERSATION TELLS A STORY
      </div>
      <div className="preview-chart">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">함께 쌓아온 대화</span>
          <span className="preview-badge">가상 예시</span>
        </div>
        <div className="preview-number">
          한마디가 모여,
          <br />
          <span>우리의 리듬으로.</span>
        </div>
        <svg
          viewBox="0 0 380 130"
          role="img"
          aria-label="두 사람의 대화량이 변화하는 예시 그래프"
        >
          <defs>
            <linearGradient id="preview-fill" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="var(--chart-a)" stopOpacity=".17" />
              <stop offset="1" stopColor="var(--chart-a)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 110C25 110 25 73 48 79S79 109 101 85 128 93 151 60 182 69 202 50 224 75 246 48 274 59 293 30 320 49 343 19 368 26 380 10V130H0Z"
            fill="url(#preview-fill)"
          />
          <path
            d="M0 110C25 110 25 73 48 79S79 109 101 85 128 93 151 60 182 69 202 50 224 75 246 48 274 59 293 30 320 49 343 19 368 26 380 10"
            fill="none"
            stroke="var(--chart-a)"
            strokeWidth="2.5"
          />
          <path
            d="M0 116C25 116 30 97 54 105S82 81 109 99 139 67 162 82 195 68 213 85 242 54 265 66 295 38 318 53 344 30 380 39"
            fill="none"
            stroke="var(--chart-b)"
            strokeWidth="2.5"
            strokeDasharray="5 4"
          />
        </svg>
        <div className="preview-axis">
          <span>처음의 인사</span>
          <span>오늘의 이야기</span>
        </div>
      </div>
      <div className="preview-mini mini-reply">
        <span className="mini-icon lavender">
          <Clock3 size={18} aria-hidden="true" />
        </span>
        <div>
          <span>서로에게 답하는 시간</span>
          <strong>대화의 속도를 발견해요</strong>
        </div>
      </div>
      <div className="preview-mini mini-chat">
        <span className="mini-icon pink">
          <MessageCircle size={18} aria-hidden="true" />
        </span>
        <div>
          <span>너와 나, 그리고 우리</span>
          <strong>숫자로 돌아보는 기록</strong>
        </div>
      </div>
      <span className="visual-caption">
        LITTLE MOMENTS. MEANINGFUL PATTERNS.
      </span>
    </div>
  );
}
export default function Landing({
  onFile,
  onSample,
}: {
  onFile: (file: File) => void;
  onSample: () => void;
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> READ BETWEEN THE LINES
          </div>
          <h1>
            우리 사이를
            <br />
            <span>기록하다.</span>
          </h1>
          <p className="hero-description">
            카카오톡 대화 속에 담긴
            <br className="sm:hidden" /> 우리의 연락 패턴과 관계 변화를
            알아보세요.
          </p>
          <div className="hero-caption">
            <span className="caption-line" /> 마음을 단정하지 않고, 기록을
            바라봅니다.
          </div>
          <a href="#upload" className="hero-anchor">
            우리의 기록 살펴보기 <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
        <Preview />
      </section>
      <div className="landing-workspace">
        <Upload onFile={onFile} onSample={onSample} />
        <section className="discover">
          <span className="eyebrow">A LITTLE MORE ABOUT US</span>
          <h2>
            익숙한 대화에서
            <br />
            새로운 발견을.
          </h2>
          <p className="text-muted leading-relaxed">
            스쳐 지나간 일상의 대화를
            <br />두 사람만의 패턴으로 읽어보세요.
          </p>
          <div className="discovery-items">
            {[
              {
                Icon: MessageCircle,
                title: "누가 먼저 말을 걸었을까요?",
                text: "대화의 시작과 선톡 비율",
                color: "pink",
              },
              {
                Icon: Clock3,
                title: "우리 대화의 속도는?",
                text: "답장 시간과 연락하는 시간대",
                color: "lavender",
              },
              {
                Icon: ChartNoAxesCombined,
                title: "시간이 흐르며 달라진 우리",
                text: "연락 빈도와 대화량의 변화",
                color: "blue",
              },
            ].map(({ Icon, title, text, color }) => (
              <div className="discovery-item" key={title}>
                <span className={`mini-icon ${color}`}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <ArrowRight
                  className="discovery-arrow"
                  size={16}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
      <section id="how-it-works" className="how-section">
        <div className="section-intro">
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>카카오톡 대화, 이렇게 가져오세요</h2>
          <p>PC 카카오톡에서 대화 파일을 저장한 뒤 SaiLog에 올려주세요.</p>
        </div>
        <div className="steps-grid">
          {[
            {
              n: "01",
              title: "채팅방 메뉴 열기",
              text: "PC 카카오톡에서 분석할 채팅방을 열고, 오른쪽 위의 메뉴를 클릭하세요.",
            },
            {
              n: "02",
              title: "대화 내용 저장하기",
              text: "대화 내용 메뉴에서 대화 내보내기를 선택하고, 텍스트 파일을 컴퓨터에 저장하세요.",
            },
            {
              n: "03",
              title: "SaiLog에서 분석하기",
              text: "저장한 파일을 SaiLog에 올린 뒤, 분석할 두 사람과 기간을 확인하고 분석을 시작하세요.",
            },
          ].map((step) => (
            <article key={step.n}>
              <span className="step-number">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <a className="hero-anchor" href="#upload">
          대화 파일 올리기 <ArrowRight size={16} aria-hidden="true" />
        </a>
      </section>
      <section id="privacy" className="privacy-section">
        <div className="privacy-emblem">
          <Fingerprint size={40} strokeWidth={1.2} aria-hidden="true" />
        </div>
        <span className="eyebrow">YOUR STORY STAYS YOURS</span>
        <h2>
          소중한 대화니까,
          <br />
          당신의 브라우저 안에서만.
        </h2>
        <p>
          파일 읽기부터 분석까지 모든 과정은 이 기기에서 이루어져요.
          <br className="hidden sm:block" /> 대화 내용을 서버에 보내거나
          저장하지 않습니다.
        </p>
        <div className="privacy-points">
          <span>
            <ShieldCheck size={16} aria-hidden="true" /> 서버 전송 없음
          </span>
          <span>
            <HeartHandshake size={16} aria-hidden="true" /> 회원가입 없음
          </span>
          <span>
            <Sparkles size={16} aria-hidden="true" /> AI 추측 없음
          </span>
        </div>
        <Modal
          title="데이터를 다루는 방식"
          description="SaiLog 1차 MVP의 개인정보 처리 안내"
          trigger={
            <Button variant="ghost">
              개인정보 처리 자세히 보기{" "}
              <ArrowRight size={14} aria-hidden="true" />
            </Button>
          }
        >
          <p>
            대화 원문은 Web Worker 메모리에서만 처리합니다. 새로고침·탭
            닫기·데이터 삭제 시 앱에서 더 이상 접근할 수 없어요. 원본 파일은
            기기에 그대로 남습니다.
          </p>
          <p>
            브라우저의 localStorage에는 화면 테마 설정만 저장합니다. 파일,
            메시지, 참여자, 분석 결과는 영구 저장하지 않아요. 분석 SDK나 외부 AI
            서비스를 사용하지 않습니다.
          </p>
          <p>
            기본 통계는 관찰된 연락 기록만 보여줍니다. 실제 호감이나 속마음을
            판단하지 않아요. 향후 AI 기능은 별도 동의와 전송 범위·보관 기간
            안내가 필요합니다.
          </p>
        </Modal>
      </section>
    </>
  );
}
