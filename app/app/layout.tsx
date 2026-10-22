import type { Metadata } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TranslationProvider } from "./TranslationContext";

export const metadata: Metadata = {
  title: "Modelfolio — Understand AI Models, Don\u2019t Just Compare Specs",
  description:
    "A plain-language guide to AI models. Understand what specs actually mean, where benchmarks mislead, and which model fits your task \u2014 without needing a PhD in machine learning.",
  openGraph: {
    title: "Modelfolio — Understand AI Models",
    description:
      "Plain-language explanations, honest benchmark analysis, and practical recommendations for choosing the right AI model.",
    type: "website",
  },
};

/* The stylesheet used to pull these with an @import, which Next strips from the
   compiled CSS — so every face silently fell back (Shrikhand and Leckerli One to
   `cursive`, i.e. Comic Sans on Windows) and the design never actually rendered.
   next/font self-hosts them, so there is no third-party request and no swap. */
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Numbers only — prices, token counts, ids — so the columns line up.
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <TranslationProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </TranslationProvider>
      </body>
    </html>
  );
}
