import type { AnalysisReport, DifferentiationResult, Platform } from "@/types/report";
import { analyze as ruleBasedAnalyze } from "./analyzer";

export async function analyzeWithAI(
  title: string,
  content: string,
  platforms: Platform[]
): Promise<AnalysisReport> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, platforms }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.warn("AI 分析失败，降级到规则引擎:", error.error || response.statusText);
      return ruleBasedAnalyze(title, content, platforms);
    }

    const report: AnalysisReport = await response.json();
    return report;
  } catch (error) {
    console.warn("AI 分析请求异常，降级到规则引擎:", error);
    return ruleBasedAnalyze(title, content, platforms);
  }
}

export async function deepDifferentiate(
  title: string,
  content: string,
  platforms: Platform[]
): Promise<DifferentiationResult | null> {
  try {
    const response = await fetch("/api/differentiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, platforms }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.warn("深度差异化分析失败:", error.error || response.statusText);
      return null;
    }

    const result: DifferentiationResult = await response.json();
    return result;
  } catch (error) {
    console.warn("深度差异化分析请求异常:", error);
    return null;
  }
}
