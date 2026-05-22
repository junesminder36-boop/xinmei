import { NextRequest, NextResponse } from "next/server";
import { saveFeedback } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, platform, rating, comment } = body as {
      reportId?: number;
      platform?: string;
      rating: "like" | "dislike";
      comment?: string;
    };

    if (!rating || !["like", "dislike"].includes(rating)) {
      return NextResponse.json({ error: "rating 必须是 like 或 dislike" }, { status: 400 });
    }

    const entry = saveFeedback(reportId || null, platform || null, rating, comment);
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Feedback API 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器内部错误" },
      { status: 500 }
    );
  }
}
