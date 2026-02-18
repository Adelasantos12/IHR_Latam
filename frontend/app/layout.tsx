import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./ui/Sidebar";
import clsx from "clsx";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IHR Compliance Dashboard",
  description: "Monitor and analyze International Health Regulations compliance across the Americas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased bg-gray-50 text-gray-900">
      <body className={clsx("min-h-screen flex", inter.className)}>
        <Sidebar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
            {children}
        </main>
      </body>
    </html>
  );
}
