# SaiLog 디자인 원칙

## 우선순위

사용자 요구사항과 접근성·보안 → apple-design + ui-ux-pro-max → design-system → ui-styling → 검증·성능 스킬 순서로 판단한다. Apple 화면을 복제하지 않는다. Vite + React + TypeScript SPA를 유지한다.

ui-ux-pro-max의 최초 자동 추천은 소비자 소셜 제품을 게임 스타일로 분류했으므로 적용하지 않았다. 명시적 style 검색 `minimalism accessible personal analytics`에서 확인한 Minimalism & Swiss Style의 여백·정보 계층·가독성만 적용했다. 각진 모서리·단일 색상은 브랜드 요구에 맞춰 둥근 모서리·핑크/라벤더/블루로 조정했다. apple-design의 재료 표현 권고보다 사용자의 불필요한 글래스모피즘 금지와 성능을 우선해 불투명 표면을 사용한다. React 스킬의 Next.js 예시는 React.lazy로 대체하고 SSR/RSC 규칙은 제외했다.

## 토큰

[스타일 소스](../src/styles/index.css)의 원시(색상), 의미(배경/표면/강조/텍스트), 컴포넌트(버튼/카드/입력) 세 계층을 사용한다. 테마는 의미 토큰만 변경한다. 외부 웹폰트 없이 시스템 폰트, 4/8px 기반 간격, 12px 컨트롤/20px 카드 모서리, 수치의 tabular-nums를 사용한다.

버튼은 기본·호버·누름·포커스·비활성 상태를 제공한다. 기본 터치 높이는 44px. 그래프의 A는 실선, B는 점선이며 수치 표를 제공한다. 히트맵은 키보드로 날짜를 선택할 수 있고 이름·날짜·수치를 읽을 수 있다. 모바일 입력 글자 크기는 16px이다.

## 움직임

누름은 100ms transform, 화면 등장 180ms opacity, 모달 220ms opacity. 차트는 집계 데이터 갱신 시 Recharts 내부 애니메이션을 사용하지 않고 화면 전환만 짧게 페이드한다. 로딩 회전은 transform만 사용한다. reduced-motion에서는 모든 애니메이션과 부드러운 스크롤을 제거한다. 레이아웃 속성·블러 애니메이션·transition:all·상시 will-change는 사용하지 않는다. 실제 중급 모바일 기기 프레임 프로파일링은 별도로 필요하다.

## 적용한 설치 스킬과 참고 문서

- apple-design: SKILL.md의 응답성, 절제, 타이포그래피, 사용자 통제, reduced-motion.
- ui-ux-pro-max: SKILL.md, 로컬 검색 styles.csv의 Minimalism & Swiss Style. 의미 있는 라벨·반응형·그래프 수치 대안.
- design-system: token-architecture.md, component-specs.md, tailwind-integration.md. 세 계층 토큰과 일관된 상태.
- ui-styling: shadcn-accessibility.md, shadcn-theming.md, tailwind-responsive.md, tailwind-customization.md. Tailwind v4, Radix Dialog, 테마와 모바일 구간.
- web-design-guidelines: 2026-11-06에 공식 command.md를 읽고 키보드, 포커스, 오류·빈 상태, 터치, 표, 테마를 점검.
- vercel-react-best-practices: bundle-dynamic-imports.md, rerender-derived-state-no-effect.md. Dashboard lazy loading, 데이터 파싱/통계를 Worker로 분리, 불필요한 파생 상태 배제.
- animation-performance: SKILL.md의 합성 속성·CSS 드라이버·React 프레임별 상태 변경 방지 원칙.

prototype, pick-ui-library, review-animations, break-ui는 추가 호출하지 않았다.

## 리포트 카드

리포트는 정돈된 큰 수치와 넉넉한 여백, 따뜻한 종이색 바탕으로 대화의 기록을 한 장에 담는다. 메시지 수를 가장 크게, 선톡 비율은 두 사람의 막대와 수치로, 연속 연락일은 하단의 짧은 강조 영역으로 표현한다. 차트 장식이나 실제 메시지 말풍선을 복제하지 않는다. 샘플 여부와 세션 기준을 카드 안에서도 읽을 수 있게 한다.

`--report-*` 컴포넌트 토큰은 기존 원시 색상 토큰에서 연결하며, 앱 테마와 독립적인 밝은 로즈·라벤더 팔레트를 제공한다. 미리보기와 다운로드에는 같은 Canvas를 사용한다. 이미지 생성은 집계 데이터의 허용 목록만 받고 대시보드 DOM을 캡처하지 않는다. 기본 익명, 별도 이름 표시 선택, 닫으면 익명으로 재설정한다. Canvas 접근성 이름과 별도의 읽을 수 있는 통계 목록을 제공한다.

이번 변경에서는 apple-design의 미리보기·사용자 통제·타이포그래피, ui-ux-pro-max의 모달 포커스·반응형 원칙, design-system의 토큰 계층, ui-styling의 Canvas 구성·Radix 접근성 참고 문서를 적용했다. web-design-guidelines로 모달·폼·다운로드 오류·대비를 검증하며, React 성능 지침에 따라 집계 파생값을 메모화하고 추가 이미지 라이브러리 없이 구현했다. animation-performance에 맞춰 기존 opacity 모달 전환과 transform 로딩 표시만 재사용한다. Canvas 색상 변경은 정적인 다시 그리기이며 프레임별 React 상태 변경이나 추가 모션이 없다.
