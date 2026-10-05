import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AERO-AGRI // OS 26 - Mission Control Command Center",
  description:
    "Next-Gen Weather Air Temperature Forecasting Command Center with iOS 26 Liquid Glass UI. Benchmarking 6 Algorithmic Paradigms on 11 Years of Continuous Observations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
