"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import type { PlatformRisk } from "@/types/report";
import { ShieldAlert, BookOpen, AlertTriangle, CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";

interface RiskReportProps {
  risks: PlatformRisk[];
  onHighlight?: (field: "标题" | "正文", text: string) => void;
}

export function RiskReport({ risks, onHighlight }: RiskReportProps) {
  const [active, setActive] = useState<string>(risks[0]?.platform || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-slate-500" />
          合规发布预检
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="mb-4 flex-wrap h-auto">
            {risks.map((r) => (
              <TabsTrigger key={r.platform} value={r.platform}>
                {r.platform}
              </TabsTrigger>
            ))}
          </TabsList>

          {risks.map((r) => (
            <TabsContent key={r.platform} value={r.platform}>
              <div className="space-y-5">
                {/* 平台安全分 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      平台安全分
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {r.safetyScore}/100
                    </span>
                  </div>
                  <Progress
                    value={r.safetyScore}
                    max={100}
                    indicatorClassName={
                      r.safetyScore >= 60
                        ? "bg-green-500"
                        : r.safetyScore >= 30
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        r.riskLevel === "高"
                          ? "destructive"
                          : r.riskLevel === "中"
                          ? "warning"
                          : "success"
                      }
                    >
                      {r.riskLevel}风险
                    </Badge>
                  </div>
                </div>

                {/* 平台说明 */}
                <div className="rounded-md bg-blue-50 border border-blue-100 p-3 flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    {r.platformDescription}
                  </p>
                </div>

                {/* 最敏感的3类问题 */}
                <div>
                  <h4 className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    该平台最敏感的问题
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {r.topSensitiveIssues.map((issue) => (
                      <span
                        key={issue}
                        className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs text-orange-700 border border-orange-200"
                      >
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 平台偏好标题风格 */}
                <div>
                  <h4 className="text-xs font-medium text-slate-700 mb-1.5">
                    该平台偏好的标题风格
                  </h4>
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-md px-3 py-2">
                    {r.preferredTitleStyle}
                  </p>
                </div>

                {/* 适合保留 vs 必须弱化 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <ThumbsUp className="h-3 w-3 text-green-500" />
                      适合保留的表达
                    </h4>
                    <ul className="space-y-1">
                      {r.keepExpressions.map((expr, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-600 flex items-start gap-1.5"
                        >
                          <span className="mt-0.5 h-1 w-1 rounded-full bg-green-500 shrink-0" />
                          {expr}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <ThumbsDown className="h-3 w-3 text-red-500" />
                      必须弱化的表达
                    </h4>
                    <ul className="space-y-1">
                      {r.avoidExpressions.map((expr, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-600 flex items-start gap-1.5"
                        >
                          <span className="mt-0.5 h-1 w-1 rounded-full bg-red-500 shrink-0" />
                          {expr}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Separator />

                {/* 规则违规详情 */}
                {r.ruleViolations.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
                    <CheckCircle2 className="h-4 w-4" />
                    未检测到明显风险，内容符合该平台发布规范。
                  </div>
                ) : (
                  <div className="space-y-3">
                    {r.ruleViolations.map((rv, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          onHighlight?.(rv.position, rv.original)
                        }
                        className="cursor-pointer hover:bg-slate-100 transition-colors rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-800">
                            {rv.ruleName}
                          </span>
                          <Badge
                            variant={
                              rv.riskLevel === "高"
                                ? "destructive"
                                : rv.riskLevel === "中"
                                ? "warning"
                                : "success"
                            }
                          >
                            {rv.riskLevel}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                          {rv.description}
                        </p>

                        <Separator />

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500 shrink-0">
                              {rv.position}
                            </span>
                          </div>
                          <p className="text-sm text-slate-800 bg-white border border-slate-200 rounded-md px-3 py-2 leading-relaxed">
                            {rv.context.split(rv.original).map((part, i, arr) => (
                              <span key={i}>
                                {part}
                                {i < arr.length - 1 && (
                                  <span className="bg-red-50 text-red-700 px-1 rounded font-semibold">
                                    {rv.original}
                                  </span>
                                )}
                              </span>
                            ))}
                          </p>
                        </div>

                        <p className="text-xs text-slate-700">
                          <span className="font-medium">建议：</span>
                          {rv.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
