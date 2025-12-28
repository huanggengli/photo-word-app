import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "拍照学单词",
  description: "通过拍照识别物体学习英文单词",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

