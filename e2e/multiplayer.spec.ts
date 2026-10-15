import { expect, test, type Page } from "@playwright/test";

test.skip(
  !process.env.LIVE_E2E,
  "Set LIVE_E2E=1 with Pusher credentials to run live multiplayer checks",
);

test("two visitors share presence, progress, results and the next lobby", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const contexts = await Promise.all(
    ["Alice", "Bob"].map(async (name, index) => {
      const context = await browser.newContext();
      await context.addInitScript(
        (player) => {
          localStorage.setItem("typearena-player", JSON.stringify(player));
        },
        {
          id:
            index === 0
              ? "11111111-1111-4111-8111-111111111111"
              : "22222222-2222-4222-8222-222222222222",
          name,
        },
      );
      if (index === 1) {
        // A deliberately skewed device clock must still join the server's room.
        await context.addInitScript(() => {
          const originalNow = Date.now;
          Date.now = () => originalNow() + 90_000;
        });
      }
      return context;
    }),
  );
  try {
    const [alice, bob] = (await Promise.all(
      contexts.map(async (context) => {
        const page = await context.newPage();
        await page.goto("/");
        return page;
      }),
    )) as [Page, Page];
    await expect(alice.getByRole("cell", { name: "Bob" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(bob.getByRole("cell", { name: "Alice" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(alice.getByText("Server clock synced")).toBeVisible();
    await expect(bob.getByText("Server clock synced")).toBeVisible();
    // Join early enough to leave time for progress delivery and a reload.
    for (let attempt = 0; attempt < 2; attempt++) {
      await expect(alice.getByText("Race live")).toBeVisible({
        timeout: 35_000,
      });
      const seconds = Number(await alice.locator(".clock span").textContent());
      if (seconds >= 15) break;
      await expect(alice.getByText("Lobby open")).toBeVisible({
        timeout: 25_000,
      });
    }
    await expect(bob.getByText("Race live")).toBeVisible({ timeout: 10_000 });
    await expect(alice.locator("#typing")).toBeEnabled();
    const aliceSentence = await alice.locator(".passage").innerText();
    expect(await bob.locator(".passage").innerText()).toBe(aliceSentence);
    await alice.locator("#typing").pressSequentially(aliceSentence.slice(0, 5));
    await expect(bob.getByRole("row", { name: /Alice/ })).toContainText(
      "5 chars",
      { timeout: 10_000 },
    );
    await bob.reload();
    await expect(bob.getByRole("row", { name: /Alice/ })).toContainText(
      "5 chars",
      { timeout: 12_000 },
    );
    await bob.context().setOffline(true);
    await expect(bob.getByText("Offline", { exact: true })).toBeVisible();
    await bob.context().setOffline(false);
    await expect(bob.getByText("Connected", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(alice.getByText("Round results")).toBeVisible({
      timeout: 25_000,
    });
    await expect(bob.getByText("Round results")).toBeVisible();
    await expect(bob.getByRole("row", { name: /Alice/ })).toContainText("#1");
    await expect(alice.getByText("Lobby open")).toBeVisible({
      timeout: 10_000,
    });
    await expect(bob.getByText("Lobby open")).toBeVisible();
    await expect(alice.getByRole("cell", { name: "Bob" })).toBeVisible({
      timeout: 15_000,
    });
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});
