import { chromium } from "@playwright/test";

const origin = process.argv[2] ?? "http://localhost:3200";
const runs = Number(process.argv[3] ?? 5);
if (
  !/^https?:\/\//.test(origin) ||
  !Number.isInteger(runs) ||
  runs < 1 ||
  runs > 20
) {
  throw new Error(
    "Usage: pnpm measure:performance [http://localhost:3200] [1-20 runs]",
  );
}

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[
    Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))
  ];
}

const browser = await chromium.launch({ headless: true });
const results = {
  origin,
  runs,
  method: "Chromium 4x CPU, 150ms RTT, 1.6Mbps, fresh contexts",
  pages: {},
};

try {
  for (const route of ["/", "/practice?mode=timed&value=120"]) {
    const samples = [];
    for (let run = 0; run < runs; run++) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: 200_000,
        uploadThroughput: 100_000,
      });
      await page.addInitScript(() => {
        window.__typearenaPerf = {
          lcp: 0,
          cls: 0,
          shifts: [],
          longTasks: [],
          inputFrames: [],
        };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            window.__typearenaPerf.lcp = entry.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            if (!entry.hadRecentInput) {
              window.__typearenaPerf.cls += entry.value;
              window.__typearenaPerf.shifts.push({
                atMs: entry.startTime,
                value: entry.value,
                sources: entry.sources.map((source) => {
                  const node = source.node;
                  if (!(node instanceof Element)) return "unknown";
                  return `${node.localName}${[...node.classList]
                    .slice(0, 3)
                    .map((name) => `.${name}`)
                    .join("")}`;
                }),
              });
            }
        }).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            window.__typearenaPerf.longTasks.push(entry.duration);
        }).observe({ type: "longtask", buffered: true });
      });
      await page.goto(new URL(route, origin).toString(), { waitUntil: "load" });
      await page.waitForTimeout(1000);
      if (route.startsWith("/practice")) {
        await page.evaluate(() => {
          const input = document.querySelector('[data-testid="race-input"]');
          input.addEventListener(
            "input",
            () => {
              const start = performance.now();
              requestAnimationFrame(() =>
                window.__typearenaPerf.inputFrames.push(
                  performance.now() - start,
                ),
              );
            },
            { capture: true },
          );
        });
        await page.getByTestId("race-input").pressSequentially("a".repeat(100));
        await page.waitForTimeout(100);
      }
      const sample = await page.evaluate(() => ({
        lcpMs: window.__typearenaPerf.lcp,
        cls: window.__typearenaPerf.cls,
        shifts: window.__typearenaPerf.shifts,
        blockingProxyMs: window.__typearenaPerf.longTasks.reduce(
          (total, duration) => total + Math.max(0, duration - 50),
          0,
        ),
        jsBytes: performance
          .getEntriesByType("resource")
          .filter((entry) => entry.initiatorType === "script")
          .reduce((total, entry) => total + entry.encodedBodySize, 0),
        inputP95Ms: window.__typearenaPerf.inputFrames.length
          ? [...window.__typearenaPerf.inputFrames].sort((a, b) => a - b)[
              Math.floor((window.__typearenaPerf.inputFrames.length - 1) * 0.95)
            ]
          : null,
        retainedCharacters:
          document.querySelector('[data-testid="race-input"]')?.value.length ??
          null,
      }));
      const heap = await cdp.send("Runtime.getHeapUsage");
      samples.push({ ...sample, usedHeapBytes: heap.usedSize });
      await context.close();
    }
    results.pages[route] = {
      samples,
      medianLcpMs: percentile(
        samples.map((item) => item.lcpMs),
        0.5,
      ),
      medianCls: percentile(
        samples.map((item) => item.cls),
        0.5,
      ),
      medianJsBytes: percentile(
        samples.map((item) => item.jsBytes),
        0.5,
      ),
      medianBlockingProxyMs: percentile(
        samples.map((item) => item.blockingProxyMs),
        0.5,
      ),
      medianUsedHeapBytes: percentile(
        samples.map((item) => item.usedHeapBytes),
        0.5,
      ),
      medianInputP95Ms: route.startsWith("/practice")
        ? percentile(
            samples.map((item) => item.inputP95Ms),
            0.5,
          )
        : null,
    };
  }
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
} finally {
  await browser.close();
}
