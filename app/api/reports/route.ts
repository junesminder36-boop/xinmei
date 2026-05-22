import { NextRequest, NextResponse } from "next/server";
import { getReports, saveReport } from "@/lib/db";
import type { Platform } from "@/types/report";

export async function GET() {
  try {
    const reports = getReports(50);
    return NextResponse.json(reports);
  } catch (error) {
    console.error("获取历史记录失败:", error);
    return NextResponse.json(
      { error: "获取历史记录失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, platforms, report } = body as {
      title: string;
      content: string;
      platforms: Platform[];
      report: object;
    };

    if (!title || !content || !report) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const saved = saveReport(title, content, platforms || [], report as Parameters<typeof saveReport>[3]);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("保存报告失败:", error);
    return NextResponse.json(
      { error: "保存报告失败" },
      { status: 500 }
    );
  }
}
