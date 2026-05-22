import { NextRequest, NextResponse } from "next/server";
import { getCrawlLogs } from "@/lib/crawler/index";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || undefined;
    const limit = Number(searchParams.get("limit") || "50");

    const logs = getCrawlLogs(source, limit);
    return NextResponse.json(logs);
  } catch (error) {
    console.error("获取爬虫日志失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取失败" },
      { status: 500 }
    );
  }
}
