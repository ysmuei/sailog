import { expect, test } from "@playwright/test";

test("이용 방법에서 내보내기 안내와 업로드로 이동할 수 있다", async ({ page }) => {
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("link", { name: "이용 방법" }).click();
    const guide = page.locator("#how-it-works");
    await expect(guide.getByRole("heading", { name: "카카오톡 대화, 이렇게 가져오세요" })).toBeVisible();
    await expect(guide).toContainText("오른쪽 위의 메뉴");
    await expect(guide).toContainText("대화 내보내기");
    await expect(guide).toContainText("컴퓨터에 저장");
    await guide.getByRole("link", { name: "대화 파일 올리기" }).click();
    await expect(page).toHaveURL(/#upload$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
