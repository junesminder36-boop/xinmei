"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { HomogeneityResult, HomogeneityDimension } from "@/types/report";
import { BarChart3 } from "lucide-react";

interface HomogeneityReportProps {
  result: HomogeneityResult;
  onHighlight?: (field: "标题" | "正文", text: string) => void;
}

function DimensionCard({ dim }: { dim: HomogeneityDimension }) {
  const color = dim.score >= 70 ? "bg-green-500" : dim.score >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{dim.name}</span>
        <span className="text-sm font-bold text-slate-900">{dim.score}</span>
      </div>
      <Progress value={dim.score} max={100} indicatorClassName={color} />
      <p className="text-xs text-slate-500">{dim.description}</p>
    </div>
  );
}

export function HomogeneityReport({ result, onHighlight }: HomogeneityReportProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-slate-500" />
          文章同质化诊断
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {result.dimensions.map((dim) => (
            <DimensionCard key={dim.name} dim={dim} />
          ))}
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">
            具体问题
          </h4>
          {result.issues.length === 0 ? (
            <p className="text-sm text-slate-500">未发现明显的同质化表达。</p>
          ) : (
            <div className="space-y-3">
              {result.issues.map((issue, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    onHighlight?.(issue.position || "正文", issue.original)
                  }
                  className="cursor-pointer hover:bg-slate-100 transition-colors rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      {issue.type} · {issue.position}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        issue.severity === "高"
                          ? "text-red-600"
                          : issue.severity === "中"
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {issue.severity}风险
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="bg-red-50 text-red-700 px-1 rounded font-medium">
                      {issue.original}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    建议改为：{issue.suggestion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 bg-slate-50 rounded-md p-3">
          {result.summary}
        </p>
      </CardContent>
    </Card>
  );
}
