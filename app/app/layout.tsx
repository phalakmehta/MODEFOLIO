import type { Metadata } from "next";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
