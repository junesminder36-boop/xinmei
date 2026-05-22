"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { RewriteSuggestion } from "@/types/report";
import { Pencil } from "lucide-react";

interface PlatformRewriteProps {
  suggestions: RewriteSuggestion[];
}

export function PlatformRewrite({ suggestions }: PlatformRewriteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Pencil className="h-4 w-4 text-slate-500" />
          多平台安全改写
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {suggestions.map((s) => (
          <div key={s.platform} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">
                {s.platform}
              </span>
              <span className="text-xs text-slate-400">版</span>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">推荐标题</p>
              <p className="text-sm font-medium text-slate-900">
                {s.recommendedTitle}
              </p>
            </div>

            {s.recommendedContent && (
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 max-h-60 overflow-y-auto">
                <p className="text-xs text-slate-500 mb-1">推荐正文</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">
                  {s.recommendedContent}
                </p>
              </div>
            )}

            <p className="text-xs text-slate-600">
              <span className="font-medium">修改理由：</span>
              {s.titleReason}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-700 mb-1.5">
                  正文调整建议
                </p>
                <ul className="space-y-1">
                  {s.contentAdjustments.map((adj, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="mt-0.5 h-1 w-1 rounded-full bg-blue-500 shrink-0" />
                      {adj}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700 mb-1.5">
                  需删除或弱化
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {s.removeOrWeaken.map((w, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-700 line-through"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Separator />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
