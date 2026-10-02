import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

// Fonturile sunt descarcate la build si servite de aplicatie (fara cereri catre Google din browser)
const sans = Source_Sans_3({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin", "latin-ext"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "UniProject Hub",
  description: "Student project management platform: projects, teams, milestones, evaluations and chat in one place.",
  openGraph: {
    title: "UniProject Hub",
    description: "Student projects, from proposal to evaluation: milestones, tasks, teams, rubric evaluations and PDF reports.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
