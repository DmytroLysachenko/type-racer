import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TypeArena | Live multiplayer typing races",
  description:
    "Join a live typing room, race the same passage for 20 seconds, and see the results together.",
  applicationName: "TypeArena",
  openGraph: {
    title: "TypeArena | Live multiplayer typing races",
    description: "Race the room in synchronized 20-second typing rounds.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
