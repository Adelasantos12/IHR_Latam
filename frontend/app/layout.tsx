import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IHR Compliance Dashboard",
  description: "Dashboard for monitoring IHR compliance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
