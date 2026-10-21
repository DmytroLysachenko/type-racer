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

async function advanceToResults(page: import("@playwright/test").Page) {
  const elapsed = (await page.evaluate(() => Date.now())) % 31_000;
  if (elapsed < 26_000) await page.clock.fastForward(26_500 - elapsed);
  await expect(page.getByTestId("round-phase")).toHaveAttribute(
    "data-phase",
    "results",
  );
}

test("guest can edit and keep a display name", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  const input = page.getByTestId("profile-name");
  await expect(input).toBeVisible();
  await input.fill("Portfolio Racer");
  await page.getByTestId("save-profile").click();
  await expect(page.getByTestId("profile-feedback")).toHaveText(
    "Name saved on this device.",
  );
  await page.reload();
  await expect(page.getByTestId("profile-name")).toHaveValue("Portfolio Racer");
});

test("a failed guest request explains the save failure without blaming the name", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("profile-name")).toBeVisible();
  await page.route("**/api/guest", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.getByTestId("profile-name").fill("Dimka");
  await page.getByTestId("save-profile").click();
  await expect(page.getByTestId("profile-feedback")).toHaveText(
    "Could not save the name right now. Please try again.",
  );
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
  await expect(page.getByTestId("round-phase")).toHaveAttribute(
    "data-phase",
    "lobby",
  );
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
  const input = page.getByTestId("race-input");
  await expect(input).toBeVisible();
  const sentence = await page.getByTestId("race-passage").innerText();
  await input.pressSequentially(sentence);
  await expect(page.getByTestId("race-result")).toBeVisible();
  await expect(page.getByTestId("personal-best")).toContainText(/\d+ WPM/);
  await advanceToResults(page);
  await page.clock.fastForward(6_000);
  await expect(input).toBeDisabled();
  await page.clock.fastForward(5_000);
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("race-passage")).not.toHaveText(sentence);
  await page.reload();
  await expect(page.getByTestId("personal-best")).toContainText(/\d+ WPM/);
  expect(browserErrors).toEqual([]);
});

test("backspace corrects a mistake and pasted text does not enter the race", async ({
  page,
}) => {
  await startAtPhase(page, 6_000);
  await page.goto("/");
  const input = page.getByTestId("race-input");
  await expect(input).toBeVisible();
  const first = (await page.getByTestId("race-passage").innerText())[0]!;
  await input.pressSequentially("~");
  await expect(input).toHaveValue("~");
  await input.press("Backspace");
  await input.pressSequentially(first);
  await expect(input).toHaveValue(first);
  await expect(page.getByTestId("stat-mistakes")).toContainText("1");
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
  await expect(page.getByTestId("race-input")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.emulateMedia({ colorScheme: "dark" });
  const darkResults = await new AxeBuilder({ page }).analyze();
  expect(darkResults.violations).toEqual([]);
  await advanceToResults(page);
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
  const input = page.getByTestId("race-input");
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
    .getByTestId("progress-fill")
    .evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(transition).toBe("0s");
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(input).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  const inputBounds = await input.boundingBox();
  expect(inputBounds).not.toBeNull();
  expect(inputBounds!.y + inputBounds!.height).toBeLessThanOrEqual(667);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});

test("theme choice persists and system choice follows the device", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const theme = page.getByRole("combobox", { name: "Theme" });
  await expect(theme).toHaveValue("system");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  await theme.selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(theme).toHaveValue("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await theme.selectOption("system");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    ),
  ).toBe("dark");
});

test("theme remains usable when preference storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const read = Storage.prototype.getItem;
    const write = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === "typearena-theme") throw new Error("Storage blocked");
      return read.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "typearena-theme") throw new Error("Storage blocked");
      return write.call(this, key, value);
    };
  });
  await page.goto("/");
  await page.getByRole("combobox", { name: "Theme" }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
