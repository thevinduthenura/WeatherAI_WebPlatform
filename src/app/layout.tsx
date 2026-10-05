import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // safe-area-inset support (iPhone notch / home bar)
  themeColor: "#050807",
};

export const metadata: Metadata = {
  title: "AERO-AGRI // OS 26 - Mission Control Command Center",
  description:
    "Next-Gen Weather Air Temperature Forecasting Command Center with iOS 26 Liquid Glass UI. Benchmarking 6 Algorithmic Paradigms on 11 Years of Continuous Observations.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AERO-AGRI OS 26",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
