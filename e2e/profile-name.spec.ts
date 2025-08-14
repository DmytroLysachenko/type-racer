import { test, expect } from "@playwright/test";

test("user can change and persist profile name", async ({ page }) => {
  await page.goto("/");

  // Change the name
  const nameInput = page.getByTestId("profile-name");
  await expect(nameInput).toBeVisible();
  await nameInput.fill("");
  await nameInput.type("UserName");
  await page.getByTestId("save-profile").click();

  // Reload and confirm persistence
  await page.reload();
  await expect(page.getByTestId("profile-name")).toHaveValue(/UserName$/);
});

test("score table reflects '(you)' next to my name after local progress", async ({
  page,
}) => {
  await page.goto("/");

  // Ensure we have a name saved
  await page.getByTestId("profile-name").fill("UserName");
  await page.getByTestId("save-profile").click();

  // Fire the local echo event in the page context to simulate progress
  await page.evaluate(() => {
    const detail = {
      playerId:
        JSON.parse(localStorage.getItem("typing-race:player") || "{}").id ||
        "me",
      name: "UserName",
      roundId: 1,
      typed: "hello",
      wpm: 60,
      accuracy: 0.9,
    };
    window.dispatchEvent(
      new CustomEvent("typearena:local-progress", { detail })
    );
  });

  // Expect the scoreboard to show "UserName (you)" somewhere
  await expect(page.getByText(/UserName \(you\)/)).toBeVisible();
});
