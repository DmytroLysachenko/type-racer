import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TypeArena — Realtime Typing Battles",
  description: "A realtime typing competition powered by Next.js 15.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
