import { parseProgressInterval } from "@/lib/config/progress-interval";

test("progress cadence accepts bounded milliseconds and safely defaults", () => {
  expect(parseProgressInterval("250")).toBe(250);
  expect(parseProgressInterval("1000")).toBe(1000);
  expect(parseProgressInterval("10000")).toBe(10000);
  for (const value of [undefined, "", "0", "249", "10001", "fast", "1e3"]) {
    expect(parseProgressInterval(value)).toBe(1000);
  }
});
