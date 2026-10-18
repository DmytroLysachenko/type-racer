import { siteOrigin } from "@/lib/site-url";

test("accepts a configured deployment origin", () => {
  expect(siteOrigin("https://typearena.example/")?.toString()).toBe(
    "https://typearena.example/",
  );
});

test("rejects missing, malformed, or non-origin URLs", () => {
  for (const value of [
    "",
    "typearena.example",
    "javascript:alert(1)",
    "https://user:pass@typearena.example/",
    "https://typearena.example/path",
    "https://typearena.example/?x=1",
  ]) {
    expect(siteOrigin(value)).toBeNull();
  }
});
