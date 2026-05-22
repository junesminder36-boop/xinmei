"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { PolicyCitation } from "@/types/report";
import { Scale, Search, FileCheck, AlertTriangle } from "lucide-react";

interface PolicyCheckProps {
  checks: PolicyCitation[];
  onHighlight?: (field: "标题" | "正文", text: string) => void;
}

export function PolicyCheck({ checks, onHighlight }: PolicyCheckProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-4 w-4 text-slate-500" />
          政策事实核验
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checks.length === 0 ? (
          <p className="text-sm text-slate-500">未检测到政策引用内容。</p>
        ) : (
          <div className="space-y-5">
            {checks.map((check, idx) => (
              <div
                key={idx}
                onClick={() =>
                  onHighlight?.(check.position || "正文", check.text)
                }
                className="cursor-pointer hover:bg-slate-100 transition-colors rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
              >
                {/* 核验对象 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">
                    核验对象：{check.target}
                  </span>
                  <Badge
                    variant={
                      check.status === "已核验"
                        ? "success"
                        : check.status === "未核验"
                        ? "warning"
                        : "destructive"
                    }
                  >
                    {check.status}
                  </Badge>
                </div>

                {/* 引用原文 */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">
                    引用原文
                  </span>
                  <p className="text-sm text-slate-800 bg-white border border-slate-200 rounded-md px-3 py-2">
                    {check.text}
                  </p>
                </div>

                <Separator />

                {/* 检索状态 */}
                <div className="flex items-start gap-2">
                  <Search className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-700">
                      检索状态
                    </p>
                    <p className="text-xs text-slate-600">
                      {check.searchStatus}
                    </p>
                  </div>
                </div>

                {/* 建议检索源 */}
                <div className="flex items-start gap-2">
                  <FileCheck className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-700">
                      建议检索源
                    </p>
                    <ul className="space-y-0.5">
                      {check.sources.map((src, i) => (
                        <li key={i} className="text-xs text-slate-600">
                          {src}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 结论 */}
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-700">结论</p>
                    <p className="text-xs text-slate-600">{check.conclusion}</p>
                  </div>
                </div>

                {/* 建议写法 */}
                <div className="rounded-md bg-white border border-slate-200 p-3 space-y-1">
                  <p className="text-xs font-medium text-slate-700">
                    建议写法
                  </p>
                  <p className="text-sm text-slate-800 font-medium">
                    {check.rewriteSuggestion}
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  <span className="font-medium">风险说明：</span>
                  {check.riskDescription}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
