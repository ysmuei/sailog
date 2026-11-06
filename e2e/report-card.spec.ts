import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

test("report card exports a real anonymous PNG and reflects selected statistics", async ({
  page,
  baseURL,
}) => {
  const external: string[] = [],
    writes: string[] = [],
    errors: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith("http") && !request.url().startsWith(baseURL!))
      external.push(request.url());
    if (["POST", "PUT", "PATCH"].includes(request.method()))
      writes.push(request.method());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  // Capture only the synthetic card's drawing commands, never a real conversation.
  await page.addInitScript(() => {
    const state = globalThis as typeof globalThis & { __cardTexts: string[] };
    state.__cardTexts = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (
      text,
      x,
      y,
      maxWidth,
    ) {
      state.__cardTexts.push(text);
      if (maxWidth === undefined) original.call(this, text, x, y);
      else original.call(this, text, x, y, maxWidth);
    };
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: /샘플로 체험하기/ }).click();
  await page.getByRole("button", { name: /분석 시작하기/ }).click();
  await expect(
    page.getByRole("heading", { name: "서연과 도윤의 대화 기록." }),
  ).toBeVisible();
  await expect(page.getByText("답장 시간 중앙값", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("combobox", { name: "기간", exact: true })
    .selectOption("30");
  await expect(page.getByText("전체 30일 중의 기록")).toBeVisible();
  const total = await page
    .locator(".metric-card")
    .first()
    .locator("strong")
    .innerText();
  await page
    .getByRole("button", { name: "리포트 카드 저장", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("checkbox", { name: "참여자 이름 표시" }),
  ).toBeChecked();
  await expect(
    dialog.getByRole("button", { name: "PNG 이미지 저장" }),
  ).toBeEnabled();
  await page.evaluate(() => {
    (globalThis as typeof globalThis & { __cardTexts: string[] }).__cardTexts =
      [];
  });
  await dialog.getByRole("checkbox", { name: "참여자 이름 표시" }).uncheck();
  await expect(dialog.locator("dl")).toContainText(total);
  await expect(
    dialog.getByRole("button", { name: "PNG 이미지 저장" }),
  ).toBeEnabled();
  await expect(dialog).toHaveCSS("opacity", "1");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const labels = await page.evaluate(
    () =>
      (globalThis as typeof globalThis & { __cardTexts: string[] }).__cardTexts,
  );
  expect(labels.some((label) => label.includes("참여자 A"))).toBe(true);
  expect(labels.some((label) => label.includes("참여자 B"))).toBe(true);
  expect(labels).toContain("가상 샘플 리포트");
  expect(labels).not.toContain("서연");
  expect(labels).not.toContain("도윤");
  expect(labels).not.toContain("오늘 하루 어땠어?");
  await page.evaluate(() => {
    (globalThis as typeof globalThis & { __cardTexts: string[] }).__cardTexts =
      [];
  });
  await dialog
    .getByRole("checkbox", { name: "메시지 수", exact: true })
    .uncheck();
  await dialog.getByRole("checkbox", { name: "평균 답장 시간" }).check();
  await expect(
    dialog.getByRole("button", { name: "PNG 이미지 저장" }),
  ).toBeEnabled();
  const selectedLabels = await page.evaluate(
    () =>
      (globalThis as typeof globalThis & { __cardTexts: string[] }).__cardTexts,
  );
  expect(selectedLabels).toContain("평균 답장 시간");
  expect(selectedLabels).not.toContain("주고받은 메시지");
  const downloadReady = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "PNG 이미지 저장" }).click();
  const download = await downloadReady;
  expect(download.suggestedFilename()).toBe(
    "sailog-report-20261031-sample.png",
  );
  await download.saveAs("test-results/sailog-report-sample.png");
  const png = await readFile((await download.path())!);
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(png.readUInt32BE(16)).toBe(1080);
  expect(png.readUInt32BE(20)).toBe(1350);
  await expect(dialog.getByRole("status")).toContainText("다운로드를 시작");
  await dialog.screenshot({ path: "test-results/report-card-desktop.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "대화 패턴", exact: true }).click();
  await expect(page.getByText("답장 시간 중앙값", { exact: true })).toHaveCount(
    0,
  );
  const summaryReady = page.waitForEvent("download");
  await page.getByRole("button", { name: "통계 저장", exact: true }).click();
  const summary = await readFile((await (await summaryReady).path())!, "utf8");
  expect(summary).not.toContain("medianReply");
  expect(summary).not.toContain("서연");
  expect(external).toEqual([]);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test("card controls work on mobile and dark mode, reset to anonymity, and handle export failure", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: /샘플로 체험하기/ }).click();
  await page.getByRole("button", { name: /분석 시작하기/ }).click();
  await page.getByRole("button", { name: "다크 모드로 전환" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/dashboard-three-metrics-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "리포트 카드 저장", exact: true })
    .click();
  const dialog = page.getByRole("dialog"),
    save = dialog.getByRole("button", { name: "PNG 이미지 저장" });
  await expect(save).toBeEnabled();
  const rose = await dialog
    .locator("canvas")
    .evaluate((el) => (el as HTMLCanvasElement).toDataURL());
  await dialog.getByRole("radio", { name: "라벤더" }).check();
  await expect(save).toBeEnabled();
  const lavender = await dialog
    .locator("canvas")
    .evaluate((el) => (el as HTMLCanvasElement).toDataURL());
  expect(lavender).not.toBe(rose);
  expect(
    await dialog
      .locator("canvas")
      .evaluate((el) => [
        ...(el as HTMLCanvasElement).getContext("2d")!.getImageData(0, 0, 1, 1)
          .data,
      ]),
  ).toEqual([250, 249, 247, 255]);
  await dialog.getByRole("checkbox", { name: "참여자 이름 표시" }).uncheck();
  await expect(save).toBeEnabled();
  await expect(dialog.locator("dl")).toContainText("참여자 A");
  await expect(dialog.locator("dl")).toContainText("참여자 B");
  await dialog
    .getByRole("checkbox", { name: "메시지 수", exact: true })
    .uncheck();
  await dialog.getByRole("checkbox", { name: "평균 답장 시간" }).check();
  await dialog.getByRole("checkbox", { name: "대화를 나눈 날" }).check();
  await expect(save).toBeEnabled();
  await expect(dialog.locator("dl")).toContainText("평균 답장 시간");
  await expect(dialog.locator("dl")).toContainText("대화를 나눈 날");
  await expect(dialog.locator("dl")).not.toContainText("주고받은 메시지");
  await expect(
    dialog.getByRole("checkbox", { name: "가장 활발한 시간대" }),
  ).toBeDisabled();
  await dialog.screenshot({ path: "test-results/report-card-mobile-dark.png" });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "리포트 카드 저장", exact: true })
    .click();
  await expect(
    dialog.getByRole("checkbox", { name: "참여자 이름 표시" }),
  ).toBeChecked();
  await expect(dialog.getByRole("radio", { name: "로즈" })).toBeChecked();
  await expect(save).toBeEnabled();
  await dialog.locator("canvas").evaluate((el) => {
    (el as HTMLCanvasElement).toBlob = (callback) => callback(null);
  });
  await save.click();
  await expect(dialog.getByRole("alert")).toContainText("다시 시도");
  await expect(save).toBeEnabled();
});
