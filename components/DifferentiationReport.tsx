"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DifferentiationResult } from "@/types/report";
import { Lightbulb, ListChecks, TrendingUp } from "lucide-react";

interface DifferentiationReportProps {
  result: DifferentiationResult;
}

export function DifferentiationReport({ result }: DifferentiationReportProps) {
  const badgeVariant =
    result.riskLevel === "高"
      ? "destructive"
      : result.riskLevel === "中"
      ? "warning"
      : "success";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-slate-500" />
          选题差异化检测
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">同质化风险：</span>
          <Badge variant={badgeVariant}>{result.riskLevel}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
            <p className="text-xs text-slate-500">核心对象</p>
            <p className="text-sm font-medium text-slate-800">{result.coreObject}</p>
          </div>
          <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
            <p className="text-xs text-slate-500">真实议题</p>
            <p className="text-sm font-medium text-slate-800">{result.realIssue}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-slate-400" />
            常见角度
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.commonAngles.map((angle) => (
              <span
                key={angle}
                className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600 border border-slate-200"
              >
                {angle}
              </span>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            建议新角度
          </h4>
          <ul className="space-y-2">
            {result.suggestedAngles.map((angle) => (
              <li
                key={angle}
                className="flex items-start gap-2 text-sm text-slate-600"
              >
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                {angle}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500 bg-slate-50 rounded-md p-3">
          {result.summary}
        </p>
      </CardContent>
    </Card>
  );
}
