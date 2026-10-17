import "./globals.css";
import type { Metadata } from "next";
import { Archivo, Oswald } from "next/font/google";
import { StorageNotice } from "@/components/StorageNotice";

const bodyFont = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});
const displayFont = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("typearena-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}',
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <StorageNotice />
        {children}
      </body>
    </html>
  );
}
