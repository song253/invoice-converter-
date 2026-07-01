import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { CloudflareAnalytics } from "@/components/CloudflareAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "송장변환기 | 주문 엑셀 → 택배사 양식",
  description:
    "어떤 쇼핑몰 주문 엑셀이든 롯데택배 업로드 양식으로 빠르게 변환합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <CloudflareAnalytics />
      </body>
    </html>
  );
}
