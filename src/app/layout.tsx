import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WolfPlanner | Cyber-Daily Hub",
  description: "Next-gen private daily planner for high-performance multi-company tracking.",
};

export const viewport: Viewport = {
  themeColor: "#05060b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body style={{ minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}

