import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope, JetBrains_Mono } from "next/font/google";
import Motion from "@/components/Motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import JasminDock from "@/components/JasminDock";
import LiveInterview from "@/components/LiveInterview";
import SiteChrome from "@/components/SiteChrome";
import "./globals.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const jet = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jet" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://gasanbuildsai.vercel.app"),
  title: { default: "Gasan builds AI", template: "%s · Gasan builds AI" },
  description:
    "Autonomous agents, real-time voice and video AI, platforms and games. Ten products built and shipped by Gasan, presented by Jasmin, his AI Chief of Staff.",
  // The card LinkedIn, WhatsApp and Telegram show when the portfolio is shared.
  openGraph: {
    type: "website",
    siteName: "Gasan builds AI",
    title: "Gasan builds AI that does the work",
    description: "Ten AI products shipped end to end: agents, voice and video AI, platforms and games. Interview Jasmin, his AI Chief of Staff.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Gasan builds AI: ten projects and Jasmin, AI Chief of Staff" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#07080b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${manrope.variable} ${jet.variable}`}>
      <head>
        {/* Marks JS as available before paint, so reveal animations start hidden only when they can run. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="grain">
        <Motion />
        <SiteChrome><Nav /></SiteChrome>
        {children}
        <SiteChrome>
          <Footer />
          <JasminDock />
          <LiveInterview />
        </SiteChrome>
      </body>
    </html>
  );
}
