import type { Metadata } from "next";
import "./globals.css";
import { startCrawlerScheduler } from "@/lib/crawler/scheduler";
import { ChatContextProvider } from "@/lib/chat-context";
import { ChatWidget } from "@/components/ChatWidget";

// 启动政策爬虫定时任务（服务端仅执行一次）
if (typeof window === "undefined") {
  startCrawlerScheduler();
}

export const metadata: Metadata = {
  title: "新媒智检 - 新媒体内容差异化与合规发布检测平台",
  description:
    "帮助新媒体创作者在文章发布前完成选题差异化分析、文章同质化诊断、平台合规预检、政策事实核验、多平台改写和内容评分报告。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        <ChatContextProvider>
          {children}
          <ChatWidget />
        </ChatContextProvider>
      </body>
    </html>
  );
}
