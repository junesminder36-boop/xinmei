import { NextRequest, NextResponse } from "next/server";
import { runCrawler } from "@/lib/crawler/index";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const source = body.source || "all";

    const summary = await runCrawler(source);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("爬虫触发失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "触发失败" },
      { status: 500 }
    );
  }
}
