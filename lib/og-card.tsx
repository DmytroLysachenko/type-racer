import { ImageResponse } from "next/og";

const SIZE = { width: 1200, height: 630 };

export function createOgCard(view: "race" | "practice") {
  const practice = view === "practice";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#edf1f2",
        color: "#172b35",
        padding: "62px 72px 48px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ color: "#2455af", fontSize: 38, fontWeight: 800 }}>
          {"///"}
        </span>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4 }}>
          TYPEARENA
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span
          style={{
            color: "#2455af",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 5,
          }}
        >
          {practice ? "PERSONAL PRACTICE" : "LIVE TYPING RACES"}
        </span>
        <span style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.07 }}>
          {practice ? "Find your rhythm." : "Same text. Same clock."}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          paddingTop: 24,
          borderTop: "2px solid #cbd6da",
          color: "#526570",
          fontSize: 23,
        }}
      >
        <span>
          {practice
            ? "A focused space to improve at your own pace."
            : "A focused race in every shared round."}
        </span>
        <span>{practice ? "15–120 SECOND TESTS" : "20 SECOND ROUNDS"}</span>
      </div>
    </div>,
    {
      ...SIZE,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
