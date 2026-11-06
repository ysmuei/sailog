# SaiLog 작업 기준

- Vite + React + TypeScript SPA를 유지한다. Next.js로 변경하지 않는다.
- 개발 전 관련 설치 스킬의 SKILL.md와 필요한 참고 문서를 읽는다. 사용자 요구와 접근성·보안이 스킬 기본값보다 우선한다.
- 시각적 방향은 apple-design과 ui-ux-pro-max, 통일 규칙은 design-system, 스타일 구현은 ui-styling이 담당한다. 검증·성능 스킬이 디자인을 임의로 바꾸지 않게 한다.
- web-design-guidelines, vercel-react-best-practices의 React SPA 적용 부분, animation-performance를 품질 기준으로 사용한다.
- 디자인: 미니멀한 여백·시스템 폰트·Charcoal·Off-white·Soft Pink/Lavender/Blue. Apple 앱을 복제하지 않는다. 강한 네온·과도한 그림자·장식적 글래스 효과를 피한다.
- [디자인 시스템](docs/design-system.md)과 [스타일 토큰](src/styles/index.css)을 기준으로 공통 상태·테마·44px 터치·reduced-motion을 유지한다.
- 대화 원문은 Worker 메모리에서만 처리한다. 서버 전송·영구 저장·콘솔 출력·외부 분석 SDK·AI 호출을 도입하지 않는다. localStorage는 테마만 허용한다.
- 파서와 통계는 UI와 분리한다. 미확인 형식을 추측하지 않고 진단한다. 테스트에는 가상 데이터만 사용한다.
- 기본 세션은 6시간 이상 공백. 답장은 연속 발화 마지막 메시지부터 상대 첫 메시지까지이며 세션을 넘으면 제외한다. 날짜는 UTC+9로 처리한다.
- 샘플·관찰 통계·향후 AI 추정값을 명확히 구분한다. 가짜 호감도나 속마음을 표시하지 않는다.
- 변경에 맞춰 `npm run lint`, `npm run test`, `npm run build` 및 주요 UI 변경의 `npm run test:e2e`를 실행한다. Windows에서는 `npm.cmd`를 사용할 수 있다.
- 완료 보고에 실제 사용한 스킬·적용 내용·검증 결과·실제 검증하지 못한 범위를 기록한다.
