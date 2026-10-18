import { RaceClient } from "@/components/RaceClient";
import { SiteHeader } from "@/components/SiteHeader";

export default function Page() {
  return (
    <div className="site-shell">
      <SiteHeader current="race" />
      <main id="main-content" className="race-page">
        <div className="intro">
          <div>
            <p className="eyebrow">THE LIVE TYPING TRACK</p>
            <h1>Same text. Same clock.</h1>
          </div>
          <p>
            Join any round. Type for 20 seconds. See where you finish alongside
            everyone else.
          </p>
        </div>
        <RaceClient />
      </main>
      <footer className="site-footer">
        Everyone sees the same round. Your race history stays on this device.
      </footer>
    </div>
  );
}
