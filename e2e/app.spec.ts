import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import JSZip from "jszip";

test("sample flow, all dashboard tabs, filters, theme, deletion and local-only privacy", async ({
  page,
  baseURL,
}) => {
  const external: string[] = [],
    errors: string[] = [],
    writes: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH"].includes(request.method()))
      writes.push(request.method());
    if (
      !request.url().startsWith(baseURL!) &&
      !request.url().startsWith("data:")
    )
      external.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "우리 사이를 기록하다." }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: /샘플로 체험하기/ }).click();
  await expect(
    page.getByRole("heading", { name: "우리의 기록이 준비됐어요." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /분석 시작하기/ }).click();
  await expect(
    page.getByRole("heading", { name: "서연과 도윤의 대화 기록." }),
  ).toBeVisible();
  await expect(
    page.getByText("체험용 가상 데이터", { exact: true }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "이름 가리기" }).check();
  await expect(
    page.getByRole("heading", { name: "두 사람의 대화 기록." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "SaiLog 홈" }).click();
  await page.getByRole("button", { name: "대시보드로 돌아가기" }).click();
  await expect(
    page.getByRole("heading", { name: "두 사람의 대화 기록." }),
  ).toBeVisible();
  await expect(page.locator(".dashboard-content")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "test-results/dashboard-desktop-light.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("combobox", { name: "기간", exact: true })
    .selectOption("30");
  await expect(page.getByText("전체 30일 중의 기록")).toBeVisible();
  for (const name of ["연락 분석", "대화 패턴", "관계 변화"]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
  await page.getByRole("button", { name: "다크 모드로 전환" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".dashboard-content")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "test-results/dashboard-desktop-dark.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "분석 기준", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "분석 데이터 삭제", exact: true })
    .click();
  await page
    .getByRole("button", { name: "데이터 삭제하기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "우리 사이를 기록하다." }),
  ).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
    "sailog-theme-v1",
  ]);
  expect(external).toEqual([]);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test("synthetic TXT upload and actionable unsupported-file error", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("지원하지 않는 형식"),
  });
  await expect(page.getByRole("alert")).toContainText(
    "지원하는 카카오톡 대화를 찾지 못했어요",
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "synthetic.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "--------------- 2026년 10월 1일 목요일 ---------------\n[A] [오전 9:00] 안녕\n[B] [오전 9:01] 반가워",
    ),
  });
  await page.getByRole("button", { name: /분석 시작하기/ }).click();
  await expect(
    page.getByText("내 기기에서 분석한 데이터", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("주고받은 메시지", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("2개", { exact: true }).first()).toBeVisible();
});

test("PC two-digit-year export reaches the dashboard with Korea dates", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("input[type=file]").setInputFiles({
    name: "synthetic-short-year.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "가상 참여자 님과 카카오톡 대화\n저장한 날짜 : 2026-11-06 11:30:00\n\n--------------- 25년 12월 31일 ---------------\n[가상 A] [오후 11:59] 가상 내용\n--------------- 26년 1월 1일 ---------------\n[가상 B] [오전 12:01] 가상 답장",
    ),
  });
  await expect(
    page.getByRole("heading", { name: "우리의 기록이 준비됐어요." }),
  ).toBeVisible();
  await expect(page.locator("input[name=start]")).toHaveValue("2025-12-31");
  await expect(page.locator("input[name=end]")).toHaveValue("2026-01-01");
  await page.getByRole("button", { name: /분석 시작하기/ }).click();
  await expect(page.getByText("2개", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "파싱 내역" }).click();
  await expect(page.getByRole("dialog")).toContainText("pc-short-year-txt");
});

test("mobile layouts and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/landing-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: /샘플로 체험하기/ }).click();
  await page
    .getByRole("checkbox", { name: "참여자 이름을 가려서 확인하기" })
    .check();
  await page.getByRole("button", { name: /분석 시작하기/ }).click();
  await expect(
    page.getByRole("heading", { name: "두 사람의 대화 기록." }),
  ).toBeVisible();
  for (const name of ["종합 대시보드", "연락 분석", "대화 패턴", "관계 변화"]) {
    await page.getByRole("link", { name, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/dashboard-${name}.png`,
      fullPage: true,
    });
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("CSV and ZIP uploads are parsed inside the real worker", async ({
  page,
}) => {
  const csv =
    'Date,User,Message\n2026-10-01 09:00,A,"안녕, 친구"\n2026-10-01 09:01,B,반가워';
  const zip = await new JSZip()
    .file("chat.csv", csv)
    .file("photo.jpg", new Uint8Array([1, 2, 3]))
    .generateAsync({ type: "nodebuffer" });
  for (const upload of [
    { name: "chat.csv", mimeType: "text/csv", buffer: Buffer.from(csv) },
    { name: "chat.zip", mimeType: "application/zip", buffer: zip },
  ]) {
    await page.goto("/");
    await page.locator("input[type=file]").setInputFiles(upload);
    await expect(
      page.getByText("2개 메시지", { exact: false }).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: /분석 시작하기/ }).click();
    await expect(page.getByText("2개", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "파싱 내역" }).click();
    await expect(page.getByRole("dialog")).toContainText("csv");
  }
});

test("cancellation terminates the pending worker and allows a fresh analysis", async ({
  page,
}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/*analysis.worker*", async (route) => {
    await gate;
    await route.continue().catch(() => {});
  });
  await page.goto("/");
  await page.getByRole("button", { name: /샘플로 체험하기/ }).click();
  await page.getByRole("button", { name: "업로드 취소" }).click();
  await expect(
    page.getByRole("heading", { name: "우리 사이를 기록하다." }),
  ).toBeVisible();
  release();
  await page.unroute("**/*analysis.worker*");
  await page.getByRole("button", { name: /샘플로 체험하기/ }).click();
  await expect(
    page.getByRole("heading", { name: "우리의 기록이 준비됐어요." }),
  ).toBeVisible();
});
