export type Platform = "百家号" | "今日头条" | "微信公众号" | "小红书" | "知乎";

export type RiskLevel = "低" | "中" | "高";
export type VerificationStatus = "已核验" | "未核验" | "疑似不准确";
export type PublishAdvice = "建议发布" | "建议修改后发布" | "暂不建议发布";

export type TriggerType =
  | "标题党"
  | "绝对化"
  | "政策误读"
  | "同质化"
  | "虚假数字"
  | "诱导行为"
  | "资质缺失"
  | "营销软文";

export interface Scores {
  differentiation: number;
  credibility: number;
  safety: number;
  advice: PublishAdvice;
}

export interface DetectedIssue {
  type: string;
  original: string;
  suggestion: string;
  severity: RiskLevel;
  position?: "标题" | "正文";
}

export interface DifferentiationResult {
  riskLevel: RiskLevel;
  coreObject: string;
  realIssue: string;
  commonAngles: string[];
  suggestedAngles: string[];
  summary: string;
}

export interface HomogeneityDimension {
  name: string;
  score: number;
  description: string;
}

export interface HomogeneityResult {
  dimensions: HomogeneityDimension[];
  issues: DetectedIssue[];
  summary: string;
}

export interface PlatformRuleViolation {
  ruleId: string;
  ruleName: string;
  description: string;
  riskLevel: RiskLevel;
  triggerType: TriggerType;
  original: string;
  context: string;
  position: "标题" | "正文";
  suggestion: string;
}

export interface PlatformRisk {
  platform: Platform;
  riskLevel: RiskLevel;
  safetyScore: number;
  topSensitiveIssues: string[];
  preferredTitleStyle: string;
  keepExpressions: string[];
  avoidExpressions: string[];
  issues: DetectedIssue[];
  ruleViolations: PlatformRuleViolation[];
  platformDescription: string;
}

export interface PolicyCitation {
  text: string;
  target: string;
  searchStatus: string;
  sources: string[];
  conclusion: string;
  rewriteSuggestion: string;
  needsVerification: boolean;
  status: VerificationStatus;
  riskDescription: string;
  suggestion: string;
  position?: "标题" | "正文";
}

export interface RewriteSuggestion {
  platform: Platform;
  recommendedTitle: string;
  titleReason: string;
  contentAdjustments: string[];
  removeOrWeaken: string[];
  recommendedContent?: string;
}

export interface RewrittenVersion {
  title: string;
  content: string;
  titleReason: string;
  contentReason: string;
}

export interface ActionItem {
  from: string;
  to: string;
  reason: string;
  position?: "标题" | "正文";
}

export interface AnalysisReport {
  scores: Scores;
  differentiation: DifferentiationResult;
  homogeneity: HomogeneityResult;
  platformRisks: PlatformRisk[];
  policyChecks: PolicyCitation[];
  rewrites: RewriteSuggestion[];
  rewrittenVersion: RewrittenVersion;
  actionList: ActionItem[];
}
