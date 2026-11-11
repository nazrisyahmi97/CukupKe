import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CukupKe — Monthly Savings & Finance Control",
  description:
    "Track monthly Safe-to-Spend, control expenses, manage recurring bills, calculate Malaysia loans, and plan savings goals.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f7f6f2] text-[#1f2421] selection:bg-[#d8f3dc] selection:text-[#1f2421]">
        {children}
      </body>
    </html>
  );
}
