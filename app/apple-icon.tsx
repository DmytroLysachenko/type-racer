import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 32,
        backgroundColor: "#172d39",
        color: "#a9c5ff",
        fontSize: 108,
        fontWeight: 800,
        letterSpacing: -20,
        paddingRight: 25,
        fontFamily: "sans-serif",
      }}
    >
      {"///"}
    </div>,
    size,
  );
}
