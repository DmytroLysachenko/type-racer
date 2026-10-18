import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { PracticeClient } from "@/components/PracticeClient";
import { parsePracticeMode } from "@/lib/game/practice";
import { siteOrigin } from "@/lib/site-url";

const origin = siteOrigin();
const practiceUrl = origin
  ? new URL("/practice", origin).toString()
  : undefined;

export const metadata: Metadata = {
  title: "Typing practice | TypeArena",
  description:
    "Practice typing at your own pace with timed and word-count tests. Review your speed, accuracy, and corrections on this device.",
  alternates: practiceUrl ? { canonical: practiceUrl } : undefined,
  openGraph: {
    title: "Typing practice | TypeArena",
    description:
      "Timed and word-count typing practice, with results saved on this device.",
    type: "website",
    url: practiceUrl,
    images: origin
      ? [
          {
            url: new URL("/share-image?view=practice", origin).toString(),
            width: 1200,
            height: 630,
            alt: "TypeArena personal typing practice",
          },
        ]
      : undefined,
  },
};

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string | string[];
    value?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const initialMode = parsePracticeMode(params);
  return (
    <div className="site-shell">
      <SiteHeader current="practice" />
      <main id="main-content" className="practice-page">
        <div className="intro practice-intro">
          <div>
            <p className="eyebrow">PERSONAL PRACTICE</p>
            <h1>Find your rhythm.</h1>
          </div>
          <p>
            Choose a length, type when you are ready, and review what changed.
            Your results stay on this device.
          </p>
        </div>
        <PracticeClient
          initialMode={initialMode}
          useSavedMode={params.mode === undefined}
        />
      </main>
      <footer className="site-footer">
        Practice is private to this browser. The live race is always one click
        away.
      </footer>
    </div>
  );
}
