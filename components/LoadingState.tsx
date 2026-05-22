"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

const ANALYZE_STEPS = [
  "解析文章结构与正文段落",
  "基于AI知识库的选题趋势分析",
  "基于语义模型的内容原创性评估",
  "按平台规则匹配敏感表达",
  "政策引用准确性AI核验",
  "生成低风险改写与修改清单",
];

const TOPIC_STEPS = [
  "理解新闻描述与核心关键词",
  "分析目标平台的内容偏好",
  "匹配风格方向与受众心理",
  "生成差异化切入角度",
  "评估选题的爆点与可行性",
  "输出完整选题方案",
];

interface LoadingStateProps {
  variant?: "analyze" | "topic";
}

export function LoadingState({ variant = "analyze" }: LoadingStateProps) {
  const steps = variant === "topic" ? TOPIC_STEPS : ANALYZE_STEPS;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let i = 0;
    const timeouts: NodeJS.Timeout[] = [];
    const tick = () => {
      i += 1;
      setProgress(i);
      if (i < steps.length) {
        const id = setTimeout(tick, 380 + Math.random() * 240);
        timeouts.push(id);
      }
    };
    const id = setTimeout(tick, 320);
    timeouts.push(id);
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [steps.length]);

  const title = variant === "topic" ? "正在生成选题灵感" : "正在生成检测报告";
  const subtitle =
    variant === "topic"
      ? "正在分析新闻角度、平台偏好与风格适配性，预计 6–10 秒。"
      : "正在分析标题风险、同质化程度与平台合规性，预计 6–10 秒。";

  return (
    <div className="loading-state">
      <div className="loading-header">
        <div className="loading-spinner" />
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="loading-steps">
        {steps.map((s, i) => {
          const state = i < progress ? "done" : i === progress ? "active" : "pending";
          return (
            <div key={i} className={"loading-step " + state}>
              <div className="indicator">
                {state === "done" && <Check size={9} strokeWidth={2} color="#fff" />}
              </div>
              <span className="step-name">{s}</span>
              <span className="step-time">
                {state === "done" ? "已完成" : state === "active" ? "进行中…" : "等待中"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
