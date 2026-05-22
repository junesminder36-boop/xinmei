import { NextRequest, NextResponse } from "next/server";
import { searchPolicies, seedPolicies } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json({ error: "缺少查询参数 q" }, { status: 400 });
    }

    // 首次查询时自动填充种子数据
    seedPolicies();

    const results = searchPolicies(q, 10);
    return NextResponse.json(results);
  } catch (error) {
    console.error("政策搜索 API 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器内部错误" },
      { status: 500 }
    );
  }
}
