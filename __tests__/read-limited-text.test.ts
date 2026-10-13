/** @jest-environment node */
import { readLimitedText } from "@/lib/http/read-limited-text";

test("caps an undeclared streamed body by actual UTF-8 bytes", async () => {
  const within = new Request("http://localhost/", {
    method: "POST",
    body: "éé",
  });
  expect(within.headers.get("content-length")).toBeNull();
  expect(await readLimitedText(within, 4)).toBe("éé");

  const over = new Request("http://localhost/", {
    method: "POST",
    body: "éé",
  });
  expect(await readLimitedText(over, 3)).toBeNull();
});
