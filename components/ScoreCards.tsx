"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { Scores } from "@/types/report";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface ScoreCardsProps {
  scores: Scores;
}

function getScoreColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreTextColor(score: number) {
  if (score >= 80) return "text-green-700";
  if (score >= 50) return "text-orange-700";
  return "text-red-700";
}

export function ScoreCards({ scores }: ScoreCardsProps) {
  const items = [
    {
      label: "差异度分",
      value: scores.differentiation,
      desc: "内容独特性与差异化程度，越高越好",
    },
    {
      label: "可信度分",
      value: scores.credibility,
      desc: "表述准确性与可验证程度，越高越好",
    },
    {
      label: "合规安全分",
      value: scores.safety,
      desc: "平台合规与发布安全程度，越高越安全",
    },
  ];

  const adviceConfig = {
    "建议发布": {
      variant: "success" as const,
      icon: CheckCircle,
      color: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    "建议修改后发布": {
      variant: "warning" as const,
      icon: AlertTriangle,
      color: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    "暂不建议发布": {
      variant: "destructive" as const,
      icon: XCircle,
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
    },
  };

  const config = adviceConfig[scores.advice];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-500">{item.label}</span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </div>
                  <span
                    className={`text-2xl font-bold ${getScoreTextColor(
                      item.value
                    )}`}
                  >
                    {item.value}
                  </span>
                </div>
                <Progress
                  value={item.value}
                  max={100}
                  indicatorClassName={getScoreColor(item.value)}
                />
                <p className="text-[10px] text-slate-400">
                  {item.label === "合规安全分"
                    ? item.value >= 80
                      ? "发布风险较低，基本合规"
                      : item.value >= 50
                      ? "存在一定合规风险，建议优化"
                      : "合规风险较高，需大幅修改"
                    : item.value >= 80
                    ? "表现优秀"
                    : item.value >= 50
                    ? "中等水平，有提升空间"
                    : "需要重点改进"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert
        variant={config.variant}
        className={`${config.bg} ${config.border}`}
      >
        <Icon className={`h-5 w-5 ${config.color} mr-2`} />
        <AlertTitle className={config.color}>总判断：{scores.advice}</AlertTitle>
        <AlertDescription className={config.color}>
          {scores.advice === "建议发布"
            ? "内容质量良好，可在选定平台正常发布。"
            : scores.advice === "建议修改后发布"
            ? "内容存在一定风险，建议按修改清单优化后再发布。"
            : "内容风险较高，建议大幅修改或暂缓发布。"}
        </AlertDescription>
      </Alert>
    </div>
  );
}
