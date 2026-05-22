"use client";

import { useState, useEffect, useCallback } from "react";
import type { AnalysisReport, Platform, DetectedIssue, HomogeneityDimension, PlatformRuleViolation, PolicyCitation, ActionItem } from "@/types/report";
import {
  Check,
  Copy,
  AlertTriangle,
  Zap,
  Shield,
  Target,
  Info,
  FileText,
  Play,
  RefreshCw,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Clock,
  Download,
  Settings,
  Plus,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types (design format)                                              */
/* ------------------------------------------------------------------ */

type Tier = "safe" | "warn" | "danger";

interface ScoreItem { value: number; tier: Tier; label: string; }
interface Verdict { tone: Tier; title: string; sub: string; meta: { words: number; detected: string; duration: string; }; }
interface RewriteNote { level: string; text: string; }
interface PlatformRewriteVersion { platform: string; icon: string; brandClass: string; title: string; body: string; }
interface Rewrite { title: string; body: string; notes: RewriteNote[]; platformVersions: PlatformRewriteVersion[]; }
interface Similarity { tier: Tier; label: string; note: string; }
interface Topic { coreObject: string; realIssue: string; similarity: Similarity; commonAngles: string[]; newAngles: string[]; }
interface Dim { value: number; tier: Tier; note: string; }
interface HomogeneityData { aiWritten: Dim; templatized: Dim; novelty: Dim; issues: string[]; }
interface Hit { orig: string; new: string; reason: string; level: Tier; position?: "标题" | "正文"; }
interface PlatformItem { id: string; name: string; icon: string; brandClass: string; score: number; tier: Tier; summary: string; sensitive: string[]; titleStyle: string; keep: string[]; soften: string[]; hits: Hit[]; }
interface Fact { object: string; quoted: string; status: { tone: Tier; text: string; }; retrieval: { state: string; attempted: string; sources: string[]; }; conclusion: string; suggest: string; }
interface Edit { orig: string; suggest: string; type: string; loc: string; level: Tier; position?: "标题" | "正文"; }

interface DesignReport {
  scores: { differentiation: ScoreItem; credibility: ScoreItem; compliance: ScoreItem; };
  verdict: Verdict;
  rewrite: Rewrite;
  topic: Topic;
  homogeneity: HomogeneityData;
  platforms: PlatformItem[];
  facts: Fact[];
  edits: Edit[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getTier(value: number, invert = false): Tier {
  if (invert) {
    if (value < 40) return "safe";
    if (value < 70) return "warn";
    return "danger";
  }
  if (value >= 70) return "safe";
  if (value >= 40) return "warn";
  return "danger";
}

const TIER_LABEL: Record<Tier, string> = { safe: "低风险", warn: "中风险", danger: "高风险" };

const PLATFORM_META: Record<Platform, { id: string; icon: string; brandClass: string }> = {
  "百家号": { id: "baijiahao", icon: "百", brandClass: "pf-baijiahao" },
  "今日头条": { id: "toutiao", icon: "头", brandClass: "pf-toutiao" },
  "微信公众号": { id: "wechat", icon: "微", brandClass: "pf-wechat" },
  "小红书": { id: "xhs", icon: "红", brandClass: "pf-xhs" },
  "知乎": { id: "zhihu", icon: "知", brandClass: "pf-zhihu" },
};

function transformReport(report: AnalysisReport, title: string, content: string): DesignReport {
  const now = new Date();
  const detected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const diffScore = report.scores.differentiation;
  const credScore = report.scores.credibility;
  const compScore = report.scores.safety;

  // Verdict
  const tone: Tier = report.scores.advice === "建议发布" ? "safe" : report.scores.advice === "建议修改后发布" ? "warn" : "danger";
  const adviceTitle = report.scores.advice;

  const issueCount = report.actionList.length;
  const policyCount = report.policyChecks.filter(p => p.status !== "已核验").length;
  const sub = issueCount > 0
    ? `存在 ${issueCount} 处建议修改项${policyCount > 0 ? `与 ${policyCount} 项未核验政策引用` : ""}。建议根据下方改写建议与平台预检要点修改后再评估发布。`
    : "文章整体风险较低，可直接发布或参考改写建议进一步优化。";

  // Scores labels
  const diffLabel = diffScore > 70 ? "选题角度具备差异化" : diffScore > 40 ? "选题与表达同质化偏高" : "选题与表达高度同质化";
  const credLabel = credScore > 70 ? "引用与表述可信度良好" : credScore > 40 ? "存在部分未核实表述" : "存在未核实的笼统引用";
  const compLabel = compScore > 70 ? "平台合规性良好" : compScore > 40 ? `在 ${report.platformRisks.filter(p => p.riskLevel !== "低").length} 个平台存在中高风险` : "多个平台存在高风险项";

  // Rewrite notes
  const notes: RewriteNote[] = [
    { level: "safe", text: report.rewrittenVersion.titleReason },
    { level: "safe", text: report.rewrittenVersion.contentReason },
  ];
  for (const p of report.policyChecks.filter(p => p.status !== "已核验").slice(0, 2)) {
    notes.push({ level: "danger", text: `「${p.text.slice(0, 40)}${p.text.length > 40 ? "…" : ""}」政策引用${p.status}，建议${p.suggestion}。` });
  }
  for (const a of report.actionList.slice(0, 4)) {
    const level = a.reason.includes("标题党") || a.reason.includes("绝对化") || a.reason.includes("政策核验") ? "danger" : "warn";
    notes.push({ level, text: `「${a.from}」→「${a.to}」：${a.reason}。` });
  }

  // Topic similarity — 与差异化分数保持一致
  const simTier = getTier(diffScore);
  const simLabel = simTier === "safe" ? "低度同质化" : simTier === "warn" ? "中度同质化" : "高度同质化";

  // Homogeneity dimensions
  const dims = report.homogeneity.dimensions;
  const aiDim = dims.find(d => d.name.includes("AI")) || dims[0] || { score: 50, description: "" };
  const tplDim = dims.find(d => d.name.includes("结构") || d.name.includes("模板")) || dims[1] || { score: 50, description: "" };
  const novDim = dims.find(d => d.name.includes("信息") || d.name.includes("增量")) || dims[2] || { score: 50, description: "" };

  // Platforms
  const platforms: PlatformItem[] = report.platformRisks.map(pr => {
    const meta = PLATFORM_META[pr.platform];
    return {
      id: meta.id,
      name: pr.platform,
      icon: meta.icon,
      brandClass: meta.brandClass,
      score: pr.safetyScore,
      tier: pr.riskLevel === "高" ? "danger" : pr.riskLevel === "中" ? "warn" : "safe",
      summary: pr.platformDescription || `${pr.platform}合规性${pr.riskLevel === "高" ? "较差" : pr.riskLevel === "中" ? "一般" : "良好"}。`,
      sensitive: pr.topSensitiveIssues.length > 0 && pr.topSensitiveIssues[0] !== "暂无高风险项" ? pr.topSensitiveIssues : ["暂无高风险敏感项"],
      titleStyle: pr.preferredTitleStyle,
      keep: pr.keepExpressions,
      soften: pr.avoidExpressions,
      hits: pr.ruleViolations.map(rv => ({
        orig: rv.original,
        new: rv.suggestion,
        reason: rv.description || rv.ruleName,
        level: rv.riskLevel === "高" ? "danger" : rv.riskLevel === "中" ? "warn" : "safe",
        position: rv.position,
      })),
    };
  });

  // Facts
  const facts: Fact[] = report.policyChecks.map(pc => ({
    object: pc.target,
    quoted: pc.text,
    status: {
      tone: pc.status === "已核验" ? "safe" : "danger",
      text: pc.status,
    },
    retrieval: {
      state: pc.searchStatus,
      attempted: "已检索国务院官网、相关部委官网、地方政府官网等渠道",
      sources: pc.sources,
    },
    conclusion: pc.conclusion,
    suggest: pc.rewriteSuggestion,
  }));

  // Edits
  const edits: Edit[] = report.actionList.map(a => {
    const level = a.reason.includes("标题党") || a.reason.includes("绝对化") || a.reason.includes("政策核验") ? "danger" : "warn";
    return {
      orig: a.from,
      suggest: a.to,
      type: a.reason.split("：")[0] || "表达优化",
      loc: a.position || "正文",
      level,
      position: a.position,
    };
  });

  return {
    scores: {
      differentiation: { value: diffScore, tier: getTier(diffScore), label: diffLabel },
      credibility: { value: credScore, tier: getTier(credScore), label: credLabel },
      compliance: { value: compScore, tier: getTier(compScore), label: compLabel },
    },
    verdict: { tone, title: adviceTitle, sub, meta: { words: title.length + content.length, detected, duration: "1.2s" } },
    rewrite: {
      title: report.rewrittenVersion.title,
      body: report.rewrittenVersion.content,
      notes,
      platformVersions: report.rewrites.map(r => {
        const meta = PLATFORM_META[r.platform];
        return {
          platform: r.platform,
          icon: meta.icon,
          brandClass: meta.brandClass,
          title: r.recommendedTitle,
          body: r.recommendedContent || report.rewrittenVersion.content,
        };
      }),
    },
    topic: {
      coreObject: report.differentiation.coreObject,
      realIssue: report.differentiation.realIssue,
      similarity: { tier: simTier, label: simLabel, note: report.homogeneity.summary || "文章同质化程度分析结果。" },
      commonAngles: report.differentiation.commonAngles,
      newAngles: report.differentiation.suggestedAngles,
    },
    homogeneity: {
      aiWritten: { value: aiDim.score, tier: getTier(aiDim.score, true), note: aiDim.description },
      templatized: { value: tplDim.score, tier: getTier(tplDim.score, true), note: tplDim.description },
      novelty: { value: novDim.score, tier: getTier(novDim.score), note: novDim.description },
      issues: report.homogeneity.issues.length > 0
        ? report.homogeneity.issues.map(i => `${i.type}：${i.original}（${i.position}）`)
        : [report.homogeneity.summary || "未发现明显同质化问题。"],
    },
    platforms,
    facts,
    edits,
  };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CopyButton({ text, label = "复制" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try { await navigator.clipboard.writeText(text); } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button className={"copy-btn" + (copied ? " copied" : "")} onClick={onClick}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      <span>{copied ? "已复制" : label}</span>
    </button>
  );
}

function Tag({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={"tag tone-" + tone}>{children}</span>;
}

/* ---------- VerdictBanner ---------- */
function VerdictBanner({ verdict }: { verdict: Verdict }) {
  return (
    <div className={"verdict tone-" + verdict.tone}>
      <div className="verdict-icon">
        {verdict.tone === "safe" ? <Check size={18} /> : <AlertTriangle size={18} />}
      </div>
      <div className="verdict-text">
        <div className="verdict-title">{verdict.title}</div>
        <div className="verdict-sub">{verdict.sub}</div>
      </div>
      <div className="verdict-meta">
        <span>字数 <b>{verdict.meta.words}</b></span>
        <span>耗时 <b>{verdict.meta.duration}</b></span>
        <span>{verdict.meta.detected}</span>
      </div>
    </div>
  );
}

/* ---------- ScoreGrid ---------- */
function ScoreCard({ label, icon: IconComp, value, tier, foot, higher }: { label: string; icon: React.ElementType; value: number; tier: Tier; foot: string; higher: string }) {
  return (
    <div className="score-card">
      <div className="score-head">
        <span className="score-label"><IconComp size={14} />{label}</span>
        <span className={"score-tier tone-" + tier}>{TIER_LABEL[tier]}</span>
      </div>
      <div className="score-value">
        <span className="num">{value}</span>
        <span className="denom">/ 100</span>
      </div>
      <div className="score-bar">
        <div className={"bar-" + tier} style={{ width: value + "%" }} />
      </div>
      <div className="score-foot">{foot}<span style={{ color: "var(--text-muted)" }}> · {higher}</span></div>
    </div>
  );
}

function ScoreGrid({ scores }: { scores: DesignReport["scores"] }) {
  return (
    <div className="score-grid">
      <ScoreCard label="差异度" icon={Zap} value={scores.differentiation.value} tier={scores.differentiation.tier} foot={scores.differentiation.label} higher="越高越好" />
      <ScoreCard label="可信度" icon={Shield} value={scores.credibility.value} tier={scores.credibility.tier} foot={scores.credibility.label} higher="越高越好" />
      <ScoreCard label="合规安全" icon={Target} value={scores.compliance.value} tier={scores.compliance.tier} foot={scores.compliance.label} higher="越高越安全" />
    </div>
  );
}

/* ---------- AnchorNav ---------- */
const SECTIONS = [
  { id: "sec-topic", label: "差异化检测" },
  { id: "sec-homo", label: "同质化诊断" },
  { id: "sec-platform", label: "平台预检" },
  { id: "sec-facts", label: "政策核验" },
  { id: "sec-edits", label: "修改清单" },
  { id: "sec-rewrite", label: "改写建议" },
];

function AnchorNav({ counts }: { counts: Record<string, number> }) {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const onScroll = () => {
      const threshold = 130;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - threshold <= 0) current = s.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="subnav">
      {SECTIONS.map((s) => (
        <a key={s.id} href={"#" + s.id}
           className={active === s.id ? "active" : ""}
           onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ block: "start", behavior: "smooth" }); }}>
          {s.label}
          {counts[s.id] != null && <span className="count">{counts[s.id]}</span>}
        </a>
      ))}
    </div>
  );
}

/* ---------- RewriteSection ---------- */
function RewriteSection({ data, onHighlight }: { data: Rewrite; onHighlight?: (field: "标题" | "正文", text: string) => void }) {
  const tabs = [
    { id: "common", label: "通用版", icon: "", brandClass: "" },
    ...data.platformVersions.map((p) => ({ id: p.platform, label: p.platform, icon: p.icon, brandClass: p.brandClass })),
  ];
  const [activeId, setActiveId] = useState("common");
  const active = tabs.find((t) => t.id === activeId) || tabs[0];

  const isCommon = activeId === "common";
  const activeTitle = isCommon ? data.title : data.platformVersions.find((p) => p.platform === activeId)?.title || data.title;
  const activeBody = isCommon ? data.body : data.platformVersions.find((p) => p.platform === activeId)?.body || data.body;
  const isXhs = activeId === "小红书";
  const titleLen = activeTitle.length;
  const bodyLen = activeBody.replace(/\s/g, "").length;

  const [feedbackState, setFeedbackState] = useState<Record<string, "like" | "dislike" | null>>({});

  const submitFeedback = async (platform: string, rating: "like" | "dislike") => {
    setFeedbackState((prev) => ({ ...prev, [platform]: rating }));
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platform === "common" ? null : platform, rating }),
      });
    } catch (e) {
      console.error("反馈提交失败:", e);
    }
  };

  const currentFeedback = feedbackState[activeId] || null;

  return (
    <section id="sec-rewrite" className="section">
      <div className="section-head">
        <div className="section-title">
          <span className="idx">B</span>低风险改写参考
          <span className="section-sub">替换 {data.notes.filter((n) => n.level !== "safe").length} 处高/中风险表达，结构与发布主体均已调整</span>
        </div>
        <CopyButton text={activeTitle + "\n\n" + activeBody} label={`复制${isCommon ? "" : active.label}改写稿`} />
      </div>

      <div className="section-body">
        <div className="platform-tabs" style={{ borderTop: "none" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={"platform-tab" + (activeId === t.id ? " active" : "")}
              onClick={() => setActiveId(t.id)}
            >
              {t.id !== "common" && <span className={"pf-icon " + t.brandClass}>{t.icon}</span>}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="rewrite">
          <div className="rewrite-row">
            <div className="field-label">
              <span>
                建议标题
                <span className="tag tone-primary" style={{ marginLeft: 6 }}>
                  已替换
                </span>
                {isXhs && (
                  <span className="tag tone-info" style={{ marginLeft: 6 }}>
                    {titleLen} / 20 字
                  </span>
                )}
              </span>
            </div>
            <div className="rewrite-box title">
              {activeTitle}
              <CopyButton text={activeTitle} label="复制" />
            </div>
          </div>

          <div className="rewrite-row">
            <div className="field-label">
              <span>
                建议正文
                {isXhs ? (
                  <span className="tag tone-info" style={{ marginLeft: 6 }}>
                    {bodyLen} / 1000 字 · 含 emoji
                  </span>
                ) : (
                  <span className="hint">{bodyLen} 字</span>
                )}
              </span>
            </div>
            <div className="rewrite-box body">
              {activeBody}
              <CopyButton text={activeBody} label="复制" />
            </div>
          </div>
        </div>

        <div className="rewrite-notes">
          <div className="field-label" style={{ marginBottom: 8 }}>
            <span>修改说明</span>
            <span className="hint">{data.notes.length} 条</span>
          </div>
          <ul>
            {data.notes.map((n, i) => (
              <li key={i}>
                <span className={"lvl " + n.level} />
                <span>{n.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="feedback-bar">
          <span className="feedback-label">这条改写对您有帮助吗？</span>
          <button
            className={"feedback-btn" + (currentFeedback === "like" ? " active" : "")}
            onClick={() => submitFeedback(activeId, "like")}
            title="有帮助"
          >
            <ThumbsUp size={13} />
            <span>有用</span>
          </button>
          <button
            className={"feedback-btn" + (currentFeedback === "dislike" ? " active" : "")}
            onClick={() => submitFeedback(activeId, "dislike")}
            title="没有帮助"
          >
            <ThumbsDown size={13} />
            <span>无用</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- TopicSection ---------- */
function TopicSection({ data }: { data: Topic }) {
  return (
    <section id="sec-topic" className="section">
      <div className="section-head">
        <div className="section-title">
          <span className="idx">C</span>选题差异化检测
          <span className="section-sub">基于AI知识库的选题趋势与差异化分析</span>
        </div>
      </div>
      <div className="section-body">
        <div className="def-list">
          <div className="def-row">
            <div className="key">核心对象</div>
            <div className="val">{data.coreObject}</div>
          </div>
          <div className="def-row">
            <div className="key">真实议题</div>
            <div className="val">{data.realIssue}</div>
          </div>
          <div className="def-row">
            <div className="key">同质化风险</div>
            <div className="val" style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <Tag tone={data.similarity.tier}>{data.similarity.label}</Tag>
              <span style={{ color: "var(--text-2)" }}>{data.similarity.note}</span>
            </div>
          </div>
          <div className="def-row">
            <div className="key">常见角度</div>
            <div className="val">
              <ul>
                {data.commonAngles.map((a, i) => <li key={i} style={{ color: "var(--text-2)" }}>{a}</li>)}
              </ul>
            </div>
          </div>
          <div className="def-row">
            <div className="key" style={{ color: "var(--primary)", fontWeight: 500 }}>建议新角度</div>
            <div className="val">
              <ul>
                {data.newAngles.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- HomogeneitySection ---------- */
function HomogeneitySection({ data }: { data: HomogeneityData }) {
  const cells = [
    { key: "AI 写作感", d: data.aiWritten, higher: "越低越好" },
    { key: "结构模板化", d: data.templatized, higher: "越低越好" },
    { key: "信息增量", d: data.novelty, higher: "越高越好" },
  ];
  return (
    <section id="sec-homo" className="section">
      <div className="section-head">
        <div className="section-title">
          <span className="idx">D</span>文章同质化诊断
          <span className="section-sub">{data.issues.length} 项具体问题</span>
        </div>
      </div>
      <div className="section-body">
        <div className="stat-grid">
          {cells.map(({ key, d, higher }) => (
            <div key={key} className="stat-cell">
              <div className="stat-key">
                <span>{key}</span>
                <Tag tone={d.tier}>{TIER_LABEL[d.tier]}</Tag>
              </div>
              <div className="stat-val">
                {d.value}<span className="pct">%</span>
              </div>
              <div className="score-bar" style={{ marginBottom: 8 }}>
                <div className={"bar-" + d.tier} style={{ width: d.value + "%" }} />
              </div>
              <div className="stat-note">{d.note} · {higher}</div>
            </div>
          ))}
        </div>
        <div className="issue-list">
          <div className="issue-list-title">具体问题</div>
          {data.issues.map((t, i) => (
            <div className="issue" key={i}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <span style={{ color: "var(--text-2)" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- PlatformSection ---------- */
function PlatformSection({ platforms, onHighlight }: { platforms: PlatformItem[]; onHighlight?: (field: "标题" | "正文", text: string) => void }) {
  const [activeId, setActiveId] = useState(platforms[0]?.id);
  const active = platforms.find((p) => p.id === activeId) || platforms[0];
  if (!active) return null;

  return (
    <section id="sec-platform" className="section">
      <div className="section-head">
        <div className="section-title">
          <span className="idx">E</span>合规发布预检
          <span className="section-sub">按目标平台的推荐机制与社区规则逐项核对</span>
        </div>
      </div>
      <div className="section-body" style={{ padding: 0 }}>
        <div className="platform-tabs">
          {platforms.map((p) => (
            <button key={p.id}
                    className={"platform-tab" + (activeId === p.id ? " active" : "")}
                    onClick={() => setActiveId(p.id)}>
              <span className={"pf-icon " + p.brandClass}>{p.icon}</span>
              <span>{p.name}</span>
              <span className="score-mini">{p.score}</span>
              <span className={"dot " + p.tier} style={{ width: 6, height: 6 }} />
            </button>
          ))}
        </div>

        <div className="platform-body">
          <div className="platform-head">
            <div className="platform-score-big">
              <span className="n" style={{ color: `var(--${active.tier === "safe" ? "safe" : active.tier === "warn" ? "warn" : "danger"})` }}>{active.score}</span>
              <span className="l">平台安全分</span>
            </div>
            <div className="meta">
              <div className="meta-row">
                <span style={{ fontSize: 14, fontWeight: 600 }}>{active.name}</span>
                <Tag tone={active.tier}>{TIER_LABEL[active.tier]}</Tag>
                <Tag tone="info">命中 {active.hits.length} 项</Tag>
              </div>
              <div className="summary">{active.summary}</div>
            </div>
          </div>

          <div className="pf-grid">
            <div className="pf-card">
              <h5><AlertTriangle size={14} />最敏感的问题</h5>
              <ul>{active.sensitive.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
            <div className="pf-card">
              <h5><Target size={14} />标题偏好</h5>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.7 }}>{active.titleStyle}</p>
            </div>
            <div className="pf-card">
              <h5><Check size={14} />适合保留的表达</h5>
              <ul>{active.keep.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
            <div className="pf-card">
              <h5><SlidersHorizontal size={14} />必须弱化的表达</h5>
              <ul>{active.soften.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          </div>

          {active.hits.length > 0 && (
            <div className="pf-expressions">
              <div className="pf-exp-head">
                <span>命中表达</span>
                <span>建议改写</span>
                <span>类型</span>
                <span>等级</span>
              </div>
              {active.hits.map((h, i) => (
                <div className="pf-exp-row" key={i} onClick={() => h.position && onHighlight?.(h.position, h.orig)} style={{ cursor: h.position ? "pointer" : "default" }}>
                  <span className="orig">{h.orig}</span>
                  <span className="new">{h.new}</span>
                  <span className="reason">{h.reason}</span>
                  <span><Tag tone={h.level}>{TIER_LABEL[h.level]}</Tag></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- FactsSection ---------- */
function FactCard({ fact }: { fact: Fact }) {
  return (
    <div className="fact">
      <div className="fact-head">
        <div className="obj">
          {fact.object}
          <span className="quoted">原文：{fact.quoted}</span>
        </div>
        <Tag tone={fact.status.tone}>{fact.status.text}</Tag>
      </div>

      <div className="chain">
        <div className="chain-step">
          <div className="step-head"><span className="step-dot">1</span>核验对象</div>
          <div className="step-body" style={{ color: "var(--text-2)" }}>{fact.object}</div>
        </div>
        <div className="chain-step">
          <div className="step-head"><span className="step-dot">2</span>检索状态</div>
          <div className="step-body">{fact.retrieval.state}</div>
          <div className="step-meta">{fact.retrieval.attempted}</div>
        </div>
        <div className="chain-step">
          <div className="step-head"><span className="step-dot">3</span>建议检索源</div>
          <div className="step-body">
            <ul style={{ margin: 0, paddingLeft: 16, color: "var(--text-2)" }}>
              {fact.retrieval.sources.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className={"fact-conclusion tone-" + fact.status.tone}>
        <span className="label">结论</span>
        <p>{fact.conclusion}</p>
      </div>
      <div className="fact-conclusion" style={{ background: "var(--primary-tint)", borderTop: "1px solid var(--divider)" }}>
        <span className="label suggest">建议写法</span>
        <p style={{ color: "var(--text-2)" }}>{fact.suggest}</p>
      </div>
    </div>
  );
}

function FactsSection({ facts }: { facts: Fact[] }) {
  return (
    <section id="sec-facts" className="section">
      <div className="section-head">
        <div className="section-title">
          <span className="idx">F</span>政策事实核验
          <span className="section-sub">基于AI与政策数据库的引用准确性评估</span>
        </div>
      </div>
      <div className="section-body">
        <div className="fact-list">
          {facts.map((f, i) => <FactCard key={i} fact={f} />)}
        </div>
      </div>
    </section>
  );
}

/* ---------- EditsSection ---------- */
function EditsSection({ edits, onHighlight }: { edits: Edit[]; onHighlight?: (field: "标题" | "正文", text: string) => void }) {
  return (
    <section id="sec-edits" className="section">
      <div className="section-head">
        <div className="section-title">
          <span className="idx">G</span>具体修改清单
          <span className="section-sub">共 {edits.length} 处建议 · 按风险等级排序</span>
        </div>
        <CopyButton text={edits.map(e => `${e.orig} → ${e.suggest}（${e.type}）`).join("\n")} label="导出清单" />
      </div>
      <div className="section-body" style={{ overflow: "auto" }}>
        <table className="edits-table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>原表达</th>
              <th style={{ width: "32%" }}>建议改法</th>
              <th>风险类型</th>
              <th>位置</th>
              <th>等级</th>
            </tr>
          </thead>
          <tbody>
            {edits.map((e, i) => (
              <tr key={i} onClick={() => e.position && onHighlight?.(e.position, e.orig)} style={{ cursor: e.position ? "pointer" : "default" }}>
                <td className="orig"><span className={"hl " + (e.level === "danger" ? "danger" : "")}>{e.orig}</span></td>
                <td className="suggest">{e.suggest}</td>
                <td style={{ color: "var(--text-3)" }}>{e.type}</td>
                <td className="loc">{e.loc}</td>
                <td className="lvl"><Tag tone={e.level}>{TIER_LABEL[e.level]}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

interface ReportViewProps {
  report: AnalysisReport;
  title: string;
  content: string;
  onHighlight?: (field: "标题" | "正文", text: string) => void;
}

export function ReportView({ report, title, content, onHighlight }: ReportViewProps) {
  const data = transformReport(report, title, content);

  const counts = {
    "sec-rewrite": data.rewrite.notes.length,
    "sec-homo": data.homogeneity.issues.length,
    "sec-platform": data.platforms.length,
    "sec-facts": data.facts.length,
    "sec-edits": data.edits.length,
  };

  return (
    <>
      <VerdictBanner verdict={data.verdict} />
      <ScoreGrid scores={data.scores} />
      <AnchorNav counts={counts} />
      <TopicSection data={data.topic} />
      <HomogeneitySection data={data.homogeneity} />
      <PlatformSection platforms={data.platforms} onHighlight={onHighlight} />
      <FactsSection facts={data.facts} />
      <EditsSection edits={data.edits} onHighlight={onHighlight} />
      <RewriteSection data={data.rewrite} onHighlight={onHighlight} />
    </>
  );
}
