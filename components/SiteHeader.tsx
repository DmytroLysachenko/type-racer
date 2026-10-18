import Link from "next/link";
import { ThemePicker } from "@/components/ThemePicker";

export function SiteHeader({ current }: { current: "race" | "practice" }) {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="TypeArena home">
        <span className="brand-mark" aria-hidden="true">
          {"///"}
        </span>
        <span>TYPEARENA</span>
      </Link>
      <div className="header-actions">
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/" aria-current={current === "race" ? "page" : undefined}>
            Live race
          </Link>
          <Link
            href="/practice"
            aria-current={current === "practice" ? "page" : undefined}
          >
            Practice
          </Link>
        </nav>
        <ThemePicker />
      </div>
    </header>
  );
}
