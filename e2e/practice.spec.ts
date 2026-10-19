import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { practiceText } from "@/lib/game/practice";

test("timed practice finishes, saves its mode, and restarts", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/practice?mode=timed&value=15");
  await expect(
    page.getByRole("heading", { name: "Find your rhythm." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "15s" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const input = page.getByTestId("race-input");
  await input.pressSequentially("x");
  await page.clock.fastForward(15_000);
  await expect(page.getByTestId("practice-result")).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("typearena-history-v2") ?? "null"),
    ),
  ).toMatchObject({
    version: 2,
    records: [{ mode: { kind: "timed", seconds: 15 }, contentVersion: "v2" }],
  });
  await page.getByRole("button", { name: "Try another passage" }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(page.getByTestId("practice-result")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(/Best for this mode:/)).toBeVisible();
});

test("word-count practice finishes and keeps its own result", async ({
  page,
}) => {
  await page.goto("/practice?mode=words&value=25");
  const passage = practiceText({ kind: "words", count: 25 }, 0);
  await page.getByTestId("race-input").pressSequentially(passage);
  await expect(page.getByTestId("practice-result")).toBeVisible();
  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("typearena-history-v2") ?? "null"),
  );
  expect(history.records[0].mode).toEqual({ kind: "words", count: 25 });
  await page.getByRole("link", { name: "Live race" }).click();
  await expect(
    page.getByRole("heading", { name: "Same text. Same clock." }),
  ).toBeVisible();
  await expect(page.getByTestId("personal-best")).toContainText(
    "Complete a race to set your personal best.",
  );
});

test("practice remembers the chosen mode and can delete device results", async ({
  page,
}) => {
  await page.goto("/practice");
  await page.getByRole("button", { name: "50", exact: true }).click();
  await page.goto("/practice");
  await expect(
    page.getByRole("button", { name: "50", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() =>
    localStorage.setItem(
      "typearena-history-v1",
      JSON.stringify([
        {
          id: "older",
          finishedAt: 100,
          sentence: "abc",
          metrics: {
            correctChars: 3,
            totalChars: 3,
            totalTypedChars: 3,
            mistakes: 0,
            correctedErrors: 0,
            uncorrectedErrors: 0,
            accuracy: 1,
            rawWpm: 36,
            wpm: 36,
            cpm: 180,
            elapsedMs: 1000,
          },
        },
      ]),
    ),
  );
  await page.getByText("Manage results on this device").click();
  await page.getByRole("button", { name: "Delete saved results" }).click();
  await page.getByRole("button", { name: "Confirm deletion" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Results removed from this device.",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("typearena-history-v1")),
  ).toBeNull();
});

test("repeated errors offer a passage retry without losing the result", async ({
  page,
}) => {
  await page.goto("/practice");
  await page.getByText("More ways to practice").click();
  await page.getByRole("button", { name: "Short thoughts" }).click();
  const passage = await page.getByTestId("practice-passage").textContent();
  expect(passage).toBeTruthy();
  const input = page.getByTestId("race-input");
  await input.pressSequentially("x");
  await input.press("Backspace");
  await input.pressSequentially("x");
  await input.press("Backspace");
  await input.pressSequentially(passage!);
  await expect(page.getByTestId("practice-result")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry a missed character" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry a missed character" }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
});

test("a storage refusal keeps the result visible and explains it was not saved", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "typearena-history-v2") throw new Error("Storage blocked");
      return original.call(this, key, value);
    };
  });
  await page.goto("/practice?mode=timed&value=15");
  await page.getByTestId("race-input").pressSequentially("x");
  await page.clock.fastForward(15_000);
  await expect(page.getByTestId("practice-result")).toBeVisible();
  const alert = page.locator(".storage-notice");
  await expect(alert).toContainText("could not be saved");
  await alert.getByRole("button", { name: "Dismiss" }).click();
  await expect(alert).toHaveCount(0);
});

test("practice modes and theme remain usable on a small screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/practice");
  await page.getByRole("button", { name: "60s" }).click();
  await expect(page).toHaveURL(/mode=timed&value=60/);
  await expect(page.getByTestId("race-input")).toBeVisible();
  const inputBounds = await page.getByTestId("race-input").boundingBox();
  expect(inputBounds).not.toBeNull();
  expect(inputBounds!.y + inputBounds!.height).toBeLessThanOrEqual(667);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("both routes reflow at 320 pixels with enlarged text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const route of ["/", "/practice"]) {
    await page.goto(route);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    const navigation = await page
      .getByRole("link", { name: "Practice" })
      .boundingBox();
    expect(navigation).not.toBeNull();
    expect(navigation!.x + navigation!.width).toBeLessThanOrEqual(320);
  }
});

test("practice controls can be reached and changed with only the keyboard", async ({
  page,
}) => {
  await page.goto("/practice");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  const sixty = page.getByRole("button", { name: "60s" });
  for (let step = 0; step < 16; step++) {
    if (await sixty.evaluate((button) => button === document.activeElement))
      break;
    await page.keyboard.press("Tab");
  }
  await expect(sixty).toBeFocused();
  await page.keyboard.press("Space");
  await expect(sixty).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/mode=timed&value=60/);
  for (let step = 0; step < 16; step++) {
    if (
      await page
        .getByTestId("race-input")
        .evaluate((input) => input === document.activeElement)
    )
      break;
    await page.keyboard.press("Tab");
  }
  await expect(page.getByTestId("race-input")).toBeFocused();
  await page.keyboard.type("a");
  await expect(page.getByTestId("race-input")).toHaveValue("a");
});

test("focused practice and private custom text are usable", async ({
  page,
}) => {
  await page.goto("/practice");
  await page.getByText("More ways to practice").click();
  await page.getByRole("button", { name: "Numbers" }).click();
  await expect(page).toHaveURL(/mode=numbers/);
  await expect(page.getByTestId("practice-passage")).toContainText(/\d/);
  await page.getByRole("button", { name: "Your text" }).click();
  await expect(
    page.getByRole("textbox", { name: "Text to practice" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Text to practice" })
    .fill("A calm custom line.");
  await page.getByRole("button", { name: "Start custom test" }).click();
  await page.getByTestId("race-input").pressSequentially("A calm custom line.");
  await expect(page.getByTestId("practice-result")).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("typearena-history-v2")),
  ).toBeNull();
});
