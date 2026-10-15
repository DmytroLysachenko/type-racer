import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function startAtPhase(
  page: import("@playwright/test").Page,
  offsetMs: number,
) {
  const serverNow = Math.floor(Date.now() / 31_000) * 31_000 + offsetMs;
  await page.clock.install({ time: new Date(serverNow) });
  await page.route("**/api/time", (route) =>
    route.fulfill({
      json: { now: serverNow },
      headers: { "cache-control": "no-store" },
    }),
  );
}

test("guest can edit and keep a display name", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  const input = page.getByTestId("profile-name");
  await expect(input).toBeVisible();
  await input.fill("Portfolio Racer");
  await page.getByTestId("save-profile").click();
  await expect(page.getByText("Name saved on this device.")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("profile-name")).toHaveValue("Portfolio Racer");
});

test("an unsaved profile edit survives the next shared round", async ({
  page,
}) => {
  await startAtPhase(page, 6_000);
  await page.goto("/");
  const name = page.getByTestId("profile-name");
  await expect(name).toBeVisible();
  await name.fill("Still editing");
  await page.clock.fastForward(26_000);
  await expect(page.getByText("Lobby open")).toBeVisible();
  await expect(name).toHaveValue("Still editing");
});

test("completing a race saves a personal best and joins the next round", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  await startAtPhase(page, 6_000);
  await page.goto("/");
  const input = page.locator("#typing");
  await expect(input).toBeVisible();
  const sentence = await page.locator(".passage").innerText();
  await input.pressSequentially(sentence);
  await expect(page.getByText("Finished this round")).toBeVisible();
  await expect(page.getByText(/Personal best on this device:/)).toBeVisible();
  await page.clock.fastForward(20_000);
  await expect(page.getByText("Round results")).toBeVisible();
  await page.clock.fastForward(6_000);
  await expect(input).toBeDisabled();
  await page.clock.fastForward(5_000);
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue("");
  await expect(page.locator(".passage")).not.toHaveText(sentence);
  await page.reload();
  await expect(page.getByText(/Personal best on this device:/)).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("backspace corrects a mistake and pasted text does not enter the race", async ({
  page,
}) => {
  await startAtPhase(page, 6_000);
  await page.goto("/");
  const input = page.locator("#typing");
  await expect(input).toBeVisible();
  const first = (await page.locator(".passage").innerText())[0]!;
  await input.pressSequentially("~");
  await expect(input).toHaveValue("~");
  await input.press("Backspace");
  await input.pressSequentially(first);
  await expect(input).toHaveValue(first);
  await expect(
    page.getByText("Mistakes").locator("..").locator("strong"),
  ).toHaveText("1");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => navigator.clipboard.writeText("pasted words"));
  await input.press("ControlOrMeta+V");
  await expect(input).toHaveValue(first);
  const width = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(width).toBeLessThanOrEqual(0);
});

test("home page has no automated accessibility violations", async ({
  page,
}) => {
  await startAtPhase(page, 6_000);
  await page.goto("/");
  await expect(page.locator("#typing")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.emulateMedia({ colorScheme: "dark" });
  const darkResults = await new AxeBuilder({ page }).analyze();
  expect(darkResults.violations).toEqual([]);
  await page.clock.fastForward(20_000);
  await expect(page.getByText("Round results")).toBeVisible();
  const resultScreen = await new AxeBuilder({ page }).analyze();
  expect(resultScreen.violations).toEqual([]);
});

test("small landscape view and reduced motion keep race controls usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startAtPhase(page, 6_000);
  await page.goto("/");
  const input = page.locator("#typing");
  await expect(input).toBeEnabled();
  await input.pressSequentially("a");
  await expect(input).toHaveValue("a");
  const horizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(0);
  const transition = await page
    .locator(".progress-track span")
    .evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(transition).toBe("0s");
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(input).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});
