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
  title: {
    default: "MVP Builder – 원클릭 MVP 생성 플랫폼",
    template: "%s | MVP Builder",
  },
  description:
    "개발 지식 없이도 1분 만에 나만의 MVP 웹앱을 만들어보세요. 템플릿을 고르고 버튼 하나만 누르면 됩니다.",
  keywords: ["MVP", "노코드", "비개발자", "앱 생성", "SaaS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
