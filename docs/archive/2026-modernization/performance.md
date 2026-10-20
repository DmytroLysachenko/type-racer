# Performance measurement — 2026-10-15

> Historical record. For current guidance, see the [product roadmap](../../roadmap.md).

## Method and limits

Production build ran locally on Node 24.18.0 and pnpm 11.11.0. A Playwright headless Chromium browser loaded `next start` on localhost:3200 in five new contexts at 1365×768, without CPU or network throttling. Navigation and resource timing came from `performance.getEntriesByType`. This is a smoke baseline for this machine, not a field Core Web Vitals assessment. Cache/server warmup made the first response slower. The pre-change workspace already contained uncommitted UI changes and no prior browser trace, so a controlled before/after comparison is unavailable.

| Metric                          | Five local samples / value       |
| ------------------------------- | -------------------------------- |
| Response end                    | 59, 5, 5, 4, 4 ms                |
| DOMContentLoaded                | 82, 36, 23, 21, 49 ms            |
| First Contentful Paint          | 124, 60, 56, 60, 60 ms           |
| JavaScript transferred per load | 168,747 bytes                    |
| JavaScript decoded per load     | 552,980 bytes                    |
| Resource count                  | 17                               |
| Built static directory          | 920 KiB (`du -sh` rounded)       |
| Built JS chunk files            | 665,574 bytes before compression |

Localhost results have no network latency and do not represent mobile hardware. LCP and CLS were not captured with a reliable observer and INP requires real interactions; no claim is made for them. [web.dev's measurement guide](https://web.dev/articles/vitals-measurement-getting-started) notes that lab TBT is a proxy for INP and that field CLS can include shifts after initial load.

## Changes during this audit

Theme initialization adds a small fixed inline script and one select; saved-history validation adds work only when history is read. The bounded IME append path added 168 transferred JavaScript bytes versus the intermediate theme build under the same local method (168,579 → 168,747). FCP medians were 60 ms in both runs. This is too small and noisy to claim a user-visible change. No typing-engine or bundle optimization was made. The existing code maps every passage character on each input and maintains a 250 ms round tick plus a 250 ms race tick while running. Passages are short; the first step toward optimization is a scripted rapid-input and long-passage trace on midrange hardware. If that demonstrates jank, reduce unnecessary clock-driven React updates and isolate the character display before considering memoization, workers, or a custom renderer.

## After the approved practice phase

The same local production-server and five-context method was repeated after adding `/practice`, original passages, and versioned rooms. These are route-load comparisons, not evidence of an optimization.

| Metric                               | Live race `/`              | Practice `/practice`       |
| ------------------------------------ | -------------------------- | -------------------------- |
| Response end, five samples           | 97, 13, 7, 16, 8 ms        | 106, 28, 15, 25, 23 ms     |
| DOMContentLoaded, five samples       | 141, 42, 84, 54, 39 ms     | 201, 53, 42, 104, 54 ms    |
| First Contentful Paint, five samples | 232, 124, 124, 128, 108 ms | 224, 136, 132, 144, 144 ms |
| JavaScript transferred per load      | 170,291 bytes              | 179,554 bytes              |
| JavaScript decoded per load          | 556,542 bytes              | 580,334 bytes              |
| Resource count                       | 19–20                      | 15                         |

The earlier live-race sample transferred 168,747 JavaScript bytes and had a 60 ms median FCP; the new live-race sample transferred 1,544 bytes more and had a 124 ms median FCP. The paint difference is material in this tiny local sample but cannot be attributed confidently to the added code without controlled throttled repetitions. The build's static directory is now 952 KiB and its JavaScript chunks total 692,928 bytes before compression. `/practice` is server-rendered per request to read its mode query, while typing calculations remain client-side.

### October 15 build check

After the word-aligned passage window, storage alert, and hydration-safe theme control were added, the production build was measured again with five fresh Chromium contexts per route at 1365×768. Each context waited one second after load so delayed route chunks were counted. These samples ran later on the same development machine and have different warmup/load conditions from the table above.

| Metric                               | Live race `/`              | Practice `/practice`       |
| ------------------------------------ | -------------------------- | -------------------------- |
| Response end, five samples           | 32, 9, 15, 24, 9 ms        | 53, 32, 58, 58, 53 ms      |
| DOMContentLoaded, five samples       | 280, 199, 77, 194, 186 ms  | 109, 92, 245, 121, 126 ms  |
| First Contentful Paint, five samples | 336, 252, 256, 236, 212 ms | 300, 256, 300, 288, 324 ms |
| JavaScript transferred per load      | 167,990 bytes              | 177,192 bytes              |
| JavaScript decoded per load          | 557,474 bytes              | 581,916 bytes              |
| Resource count after one second      | 19                         | 15                         |

Final JavaScript transfer is 2,301 bytes lower on `/` and 2,362 bytes lower on `/practice` than the preceding build, but this is a build comparison, not a measured interaction-speed gain. Final FCP medians are 252 ms and 300 ms; their rise alongside lower transfer size shows why these small, unthrottled localhost runs cannot establish causality. The final static directory is 968 KiB and its JavaScript chunks total 708,734 bytes before compression. No field LCP, CLS, or INP data exists.

The later enlarged-text reflow fix changed CSS only. A subsequent production build passed and retained the same 968 KiB static-directory size and 708,734 JavaScript chunk bytes; route paint timings were not remeasured after that fix.

### Exploratory typing-input sample

A separate production-server Chromium run sent 150 sequential `a` key events into the 30-second practice input at zero scripted delay. A capture-phase `input` listener recorded time to the next `requestAnimationFrame`; this is an event-to-frame proxy, not paint time or INP. All 150 characters remained in the controlled input. At normal CPU speed the median/p95/maximum were 6.7/14.2/22.3 ms; with Chrome's 4× CPU throttling they were 23.4/32.0/79.5 ms. Each condition was run once, so this is a risk probe rather than a stable performance comparison. It does not justify adding a custom renderer or worker now. Repeated throttled runs and real-device interaction traces remain the next gate.

## Later architecture and Unicode phase

The race page now server-renders its introduction, header, and footer, while `RaceClient` owns live state. Both routes use grapheme-aware character rules. A production build with `SITE_URL` set was measured with the same five-context, one-second-wait method:

| Metric                               | Live race `/`              | Practice `/practice`       |
| ------------------------------------ | -------------------------- | -------------------------- |
| Response end, five samples           | 76, 18, 12, 20, 15 ms      | 49, 35, 42, 30, 31 ms      |
| DOMContentLoaded, five samples       | 219, 74, 58, 155, 61 ms    | 201, 69, 70, 64, 68 ms     |
| First Contentful Paint, five samples | 244, 164, 164, 212, 164 ms | 240, 204, 232, 172, 180 ms |
| JavaScript transferred per load      | 167,980 bytes              | 177,556 bytes              |
| JavaScript decoded per load          | 557,087 bytes              | 582,468 bytes              |

The static-shell split changed transferred JavaScript on `/` by only −10 bytes versus the preceding build. Its lower local FCP median (164 ms versus 252 ms) may reflect server warmup or machine load; it is not attributed to the split. The practice bundle grew by 364 transferred bytes with Unicode handling. In another single 150-key probe, the 4× CPU p95 was 41.5 ms, versus 32.0 ms in the earlier probe. A further change reduced practice's display tick from 100 ms to 250 ms and kept the passage segmentation stable between renders; a third single-run 4× CPU p95 was 50.2 ms. All three runs retained 150/150 characters. These noisy, unpaired probes show no demonstrated latency improvement. The lower timer frequency reduces scheduled React updates from ten to four per second while monotonic input/deadline timing stays unchanged.

## Repeatable throttled probe — 2026-10-17

`pnpm measure:performance http://localhost:3200 3` now runs against a production build in fresh 390×844 Chromium contexts, with 4× CPU throttling, 150 ms network latency and 1.6 Mb/s download. It samples both public routes three times and sends 100 rapid characters to the 120-second practice test. The script reports LCP, CLS with shift sources, transferred script bytes, a long-task blocking proxy, CDP heap usage, and input-event-to-next-frame p95. The blocking proxy is **not** Lighthouse TBT; the input proxy is **not** paint time or field INP. No typed content or names are transmitted by the probe.

| Local metric, median of three      | Race `/` | Practice `/practice?mode=timed&value=120` |
| ---------------------------------- | -------: | ----------------------------------------: |
| LCP                                | 2,300 ms |                                    644 ms |
| CLS                                |   0.0096 |                                    0.0023 |
| Transferred script bytes           |  168,925 |                                   181,959 |
| Long-task blocking proxy           |   198 ms |                                    239 ms |
| CDP used JS heap after interaction |  3.92 MB |                                   5.24 MB |
| Input-event-to-next-frame p95      |        — |                                   23.1 ms |
| Characters retained                |        — |                       100/100 in all runs |

The same local probe exposed two deterministic layout shifts under these conditions. Before the race shell reserved viewport space, the race route's three-run median CLS was 0.1105: the footer moved when client state arrived. With `.race-page` reserving space, its median was 0.0096. After adding focused practice controls, a 390-pixel layout wrapped the practice clock before the font settled and then unwrapped it; median CLS was 0.1178. A stable compact clock/heading layout reduced it to 0.0023. These are local before/after layout measurements under the same probe settings, not claims about real-user Core Web Vitals. LCP varied with local server warmup and should not be interpreted as an optimization result.

## Next measurement gate

Repeat the probe on representative physical devices and include a full 20-second race with live Pusher when credentials are available. Collect field LCP, CLS and INP only through a privacy-reviewed opt-in path that excludes passage input and names. Compare medians and upper percentiles before claiming a speed improvement.

This gate is still open; see [the current backlog](improvements.md#open-verification-and-maintenance). The local samples above do not establish a field performance improvement.
