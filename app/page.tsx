"use client";

import { useState, useRef, useEffect } from "react";
import { InputPanel } from "@/components/InputPanel";
import { ReportView } from "@/components/ReportView";
import { LoadingState } from "@/components/LoadingState";
import { HistoryPanel } from "@/components/HistoryPanel";
import { TopicInspirationPanel } from "@/components/TopicInspirationPanel";
import { TopicInspirationView } from "@/components/TopicInspirationView";
import { analyzeWithAI, deepDifferentiate } from "@/lib/ai-analyzer";
import { generateTopicIdeasWithAI } from "@/lib/ai-topic";
import type { Platform, AnalysisReport } from "@/types/report";
import type { SavedReport } from "@/lib/db";
import type { TopicIdea, TopicStyle } from "@/types/topic";
import { useChatContext } from "@/lib/chat-context";
import { Clock, Download, Settings, X, UserRound, LayoutDashboard, Sparkles } from "lucide-react";

export default function Home() {
  const { setContext } = useChatContext();

  // 登录状态校验
  useEffect(() => {
    const auth = localStorage.getItem("xinmei_auth");
    if (!auth) {
      window.location.href = "/login";
      return;
    }
    try {
      const { expiry } = JSON.parse(auth);
      if (Date.now() > expiry) {
        localStorage.removeItem("xinmei_auth");
        window.location.href = "/login";
      }
    } catch {
      localStorage.removeItem("xinmei_auth");
      window.location.href = "/login";
    }
  }, []);

  // 模式切换
  const [mode, setMode] = useState<"analyze" | "inspiration">("analyze");

  // 文章智检状态
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [density, setDensity] = useState<"compact" | "default" | "comfy">("default");
  const [defaultMode, setDefaultMode] = useState<"analyze" | "inspiration">("analyze");
  const [assistantGuide, setAssistantGuide] = useState(true);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  // 选题灵感状态
  const [newsDesc, setNewsDesc] = useState("");
  const [topicPlatforms, setTopicPlatforms] = useState<Platform[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<TopicStyle>("深度解读");
  const [topicLoading, setTopicLoading] = useState(false);
  const [topicIdeas, setTopicIdeas] = useState<TopicIdea[] | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setReport(null);
    try {
      const [result, diff] = await Promise.all([
        analyzeWithAI(title, content, selectedPlatforms),
        deepDifferentiate(title, content, selectedPlatforms),
      ]);
      if (diff) {
        result.differentiation = diff;
      }
      setReport(result);
      // 自动保存报告
      saveReportToDb(title, content, selectedPlatforms, result);
    } finally {
      setLoading(false);
    }
  };

  const saveReportToDb = async (
    t: string,
    c: string,
    platforms: Platform[],
    r: AnalysisReport | Record<string, unknown>,
    type?: string
  ) => {
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, content: c, platforms, report: r, type }),
      });
    } catch (e) {
      console.error("自动保存失败:", e);
    }
  };

  const handleSelectHistory = (saved: SavedReport) => {
    if (saved.type === "topic") {
      alert("选题灵感暂不支持从历史记录恢复，请重新生成。");
      setHistoryOpen(false);
      return;
    }
    setTitle(saved.title);
    setContent(saved.content);
    setSelectedPlatforms(saved.platforms);
    setReport(saved.report);
    setHistoryOpen(false);
  };

  const handleCopyRewritten = () => {
    if (!report) return;
    const text = `${report.rewrittenVersion.title}\n\n${report.rewrittenVersion.content}`;
    navigator.clipboard.writeText(text);
  };

  const handleExportReport = () => {
    if (!report) return;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = `xinmei-report-${timestamp}`;

    // JSON export
    const jsonBlob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement("a");
    jsonLink.href = jsonUrl;
    jsonLink.download = `${filename}.json`;
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);

    // Markdown export
    const md = generateMarkdownReport(title, content, selectedPlatforms, report);
    const mdBlob = new Blob([md], { type: "text/markdown" });
    const mdUrl = URL.createObjectURL(mdBlob);
    const mdLink = document.createElement("a");
    mdLink.href = mdUrl;
    mdLink.download = `${filename}.md`;
    mdLink.click();
    URL.revokeObjectURL(mdUrl);
  };

  function generateMarkdownReport(
    t: string,
    c: string,
    platforms: Platform[],
    r: AnalysisReport
  ): string {
    return `# 新媒智检报告

> 生成时间：${new Date().toLocaleString("zh-CN")}

## 原文

**标题：** ${t}

**正文：**

${c}

**目标平台：** ${platforms.join("、")}

---

## 综合评分

| 维度 | 分数 | 建议 |
|------|------|------|
| 差异化 | ${r.scores.differentiation} | ${r.scores.advice} |
| 可信度 | ${r.scores.credibility} | |
| 合规安全 | ${r.scores.safety} | |

## 选题差异化检测

- **核心对象：** ${r.differentiation.coreObject}
- **真实议题：** ${r.differentiation.realIssue}
- **风险等级：** ${r.differentiation.riskLevel}

### 常见角度
${r.differentiation.commonAngles.map((a) => `- ${a}`).join("\n")}

### 建议新角度
${r.differentiation.suggestedAngles.map((a) => `- ${a}`).join("\n")}

> ${r.differentiation.summary}

## 同质化诊断

${r.homogeneity.dimensions.map((d) => `- **${d.name}**：${d.score}% — ${d.description}`).join("\n")}

## 平台预检

${r.platformRisks
  .map(
    (p) => `### ${p.platform}
- 安全分：${p.safetyScore}
- 风险等级：${p.riskLevel}
- 敏感问题：${p.topSensitiveIssues.join("、") || "无"}
`
  )
  .join("\n")}

## 政策核验

${r.policyChecks
  .map(
    (pc) => `- **${pc.target}**（${pc.status}）
  - 原文：${pc.text}
  - 结论：${pc.conclusion}
  - 建议：${pc.rewriteSuggestion}
`
  )
  .join("\n")}

## 修改清单

| 原文 | 建议改法 | 原因 | 位置 |
|------|----------|------|------|
${r.actionList
  .map(
    (a) =>
      `| ${a.from} | ${a.to} | ${a.reason} | ${a.position || "正文"} |`
  )
  .join("\n")}

## 通用改写稿

**标题：** ${r.rewrittenVersion.title}

**正文：**

${r.rewrittenVersion.content}

## 各平台改写

${r.rewrites
  .map(
    (rw) => `### ${rw.platform}
**标题：** ${rw.recommendedTitle}

${rw.recommendedContent || r.rewrittenVersion.content}
`
  )
  .join("\n")}
`;
  }

  const handleHighlight = (field: "标题" | "正文", text: string) => {
    const ref = field === "标题" ? titleRef : contentRef;
    const el = ref.current;
    if (!el) return;
    const value = el.value;
    const index = value.indexOf(text);
    if (index === -1) return;
    el.focus();
    el.setSelectionRange(index, index + text.length);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleGenerateTopics = async () => {
    setTopicLoading(true);
    setTopicIdeas(null);
    const ideas = await generateTopicIdeasWithAI(newsDesc, topicPlatforms, selectedStyle);
    setTopicIdeas(ideas);
    setTopicLoading(false);

    // 自动保存选题灵感到历史记录
    if (ideas && ideas.length > 0) {
      const dummyReport = {
        scores: {
          differentiation: 0,
          credibility: 0,
          safety: 0,
          titleScore: 0,
          deAIfication: 0,
          advice: "选题灵感",
        },
        differentiation: {
          riskLevel: "safe",
          coreObject: newsDesc,
          realIssue: "",
          commonAngles: [],
          suggestedAngles: ideas.map((i) => i.title),
          summary: `基于「${newsDesc}」生成 ${ideas.length} 个选题角度`,
        },
        homogeneity: { dimensions: [], issues: [], summary: "" },
        platformRisks: [],
        policyChecks: [],
        rewrites: [],
        rewrittenVersion: {
          title: ideas[0]?.title || "",
          content: ideas.map((i) => i.title).join("\n"),
          titleReason: "",
          contentReason: "",
        },
        actionList: [],
        titleScore: { total: 0, dimensions: [] },
        deAIfication: { score: 0, markers: [], suggestions: [] },
        dateCompliance: { hasVagueDate: false, issues: [], suggestion: "" },
        privacyCompliance: { hasPrivacyRisk: false, issues: [], suggestion: "" },
        placementRatio: { ratio: 0, keywords: [], suggestion: "" },
        structureMatch: [],
      };
      saveReportToDb(
        ideas[0]?.title || "选题灵感",
        newsDesc,
        topicPlatforms,
        dummyReport as unknown as AnalysisReport,
        "topic"
      );
    }
  };

  // 同步页面状态到 AI 助手上下文
  useEffect(() => {
    setContext({
      mode,
      title: title || undefined,
      content: content || undefined,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : topicPlatforms.length > 0 ? topicPlatforms : undefined,
      newsDesc: newsDesc || undefined,
      selectedStyle: selectedStyle || undefined,
      topicIdeas: topicIdeas || undefined,
      report: report || undefined,
    });
  }, [
    mode,
    title,
    content,
    selectedPlatforms,
    newsDesc,
    topicPlatforms,
    selectedStyle,
    topicIdeas,
    report,
    setContext,
  ]);

  const handleUseAsDraft = (topicTitle: string, opening: string) => {
    setTitle(topicTitle);
    setContent(opening + "\n\n");
    setMode("analyze");
    setReport(null);
  };

  useEffect(() => {
    const savedDensity = localStorage.getItem("xinmei-density") as typeof density | null;
    const savedMode = localStorage.getItem("xinmei-default-mode") as typeof defaultMode | null;
    const savedGuide = localStorage.getItem("xinmei-assistant-guide");
    if (savedDensity === "compact" || savedDensity === "default" || savedDensity === "comfy") {
      setDensity(savedDensity);
    }
    if (savedMode === "analyze" || savedMode === "inspiration") {
      setDefaultMode(savedMode);
      setMode(savedMode);
    }
    if (savedGuide === "off") {
      setAssistantGuide(false);
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("density-compact", density === "compact");
    document.body.classList.toggle("density-comfy", density === "comfy");
    localStorage.setItem("xinmei-density", density);
  }, [density]);

  useEffect(() => {
    document.body.classList.toggle("hide-assistant-guide", !assistantGuide);
    localStorage.setItem("xinmei-assistant-guide", assistantGuide ? "on" : "off");
  }, [assistantGuide]);

  const handleDefaultModeChange = (nextMode: "analyze" | "inspiration") => {
    setDefaultMode(nextMode);
    setMode(nextMode);
    localStorage.setItem("xinmei-default-mode", nextMode);
  };

  const hasReport = !!report && !loading;

  const runExample = async () => {
    const exampleTitle = "重磅！教师减负终于来了，国家亲自出手，全体教师必看！";
    const exampleContent = `近日，国家相关部门发布重磅文件，明确将大力推进教师减负工作。据悉，新政策一旦落地，全国千万教师都将受益。

业内人士表示，这一改革力度前所未有。未来非教学任务将被严格限制，迎检、填表、各类无关会议都会大幅减少。某地教师反映，过去一周要应付十几项检查，现在终于可以安心备课了。

专家表示，给教师减负就是给教育减负，给孩子减负。我们要让教师把全部精力放在课堂上，这才是教育的本质。相信不久的将来，老师们就能告别被迫加班、996的日子。

广大教师朋友们，这次国家是真的下定决心了，大家可以期待！如果你身边有当老师的朋友，一定要转发给他们。`;
    const examplePlatforms: Platform[] = ["百家号", "今日头条", "微信公众号", "小红书", "知乎"];
    setTitle(exampleTitle);
    setContent(exampleContent);
    if (selectedPlatforms.length === 0) {
      setSelectedPlatforms(examplePlatforms);
    }
    setLoading(true);
    setReport(null);
    try {
      const [result, diff] = await Promise.all([
        analyzeWithAI(exampleTitle, exampleContent, selectedPlatforms.length > 0 ? selectedPlatforms : examplePlatforms),
        deepDifferentiate(exampleTitle, exampleContent, selectedPlatforms.length > 0 ? selectedPlatforms : examplePlatforms),
      ]);
      if (diff) {
        result.differentiation = diff;
      }
      setReport(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* TopNav */}
      <header className="topnav">
        <div className="brand">
          <div className="logo">智</div>
          <div>
            <span className="brand-name">新媒智检</span>
            <span className="brand-sub hidden sm:inline">新媒体内容差异化与合规发布检测平台</span>
          </div>
        </div>
        <div className="spacer" />
        <div className="nav-actions">
          <button className="nav-btn inline-flex" onClick={() => setHistoryOpen(true)}>
            <Clock size={14} />
            <span className="hidden sm:inline">历史记录</span>
          </button>
          <button className="nav-btn inline-flex" onClick={handleExportReport} disabled={!hasReport}>
            <Download size={14} />
            <span className="hidden sm:inline">导出报告</span>
          </button>
          <button className="nav-btn" onClick={() => setSettingsOpen(true)} aria-label="打开设置">
            <Settings size={14} />
          </button>
          <a className="nav-avatar" href="/login" title="登录">编</a>
        </div>
      </header>

      {settingsOpen && (
        <div className="settings-overlay" role="dialog" aria-modal="true" aria-label="系统设置">
          <div className="settings-panel">
            <div className="settings-header">
              <div>
                <div className="settings-title">系统设置</div>
                <div className="settings-subtitle">调整工作台偏好与账户入口</div>
              </div>
              <button className="settings-close" onClick={() => setSettingsOpen(false)} aria-label="关闭设置">
                <X size={16} />
              </button>
            </div>

            <div className="settings-section">
              <div className="settings-section-head">
                <LayoutDashboard size={15} />
                <span>界面密度</span>
              </div>
              <div className="settings-segment">
                <button className={density === "compact" ? "active" : ""} onClick={() => setDensity("compact")}>紧凑</button>
                <button className={density === "default" ? "active" : ""} onClick={() => setDensity("default")}>标准</button>
                <button className={density === "comfy" ? "active" : ""} onClick={() => setDensity("comfy")}>舒展</button>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-head">
                <Sparkles size={15} />
                <span>默认工作模式</span>
              </div>
              <div className="settings-segment">
                <button className={defaultMode === "analyze" ? "active" : ""} onClick={() => handleDefaultModeChange("analyze")}>文章智检</button>
                <button className={defaultMode === "inspiration" ? "active" : ""} onClick={() => handleDefaultModeChange("inspiration")}>选题灵感</button>
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-row-title">AI 助手点击提示</div>
                <div className="settings-row-desc">控制右下角“点击”引导是否展示</div>
              </div>
              <button
                className={`settings-toggle ${assistantGuide ? "active" : ""}`}
                onClick={() => setAssistantGuide((value) => !value)}
                aria-pressed={assistantGuide}
              >
                <span />
              </button>
            </div>

            <button
              type="button"
              className="settings-login-card"
              onClick={() => {
                localStorage.removeItem("xinmei_auth");
                window.location.href = "/login";
              }}
            >
              <div className="settings-login-icon">
                <UserRound size={18} />
              </div>
              <div>
                <div className="settings-row-title">退出登录</div>
                <div className="settings-row-desc">清除登录状态并返回登录页</div>
              </div>
            </button>
          </div>
        </div>
      )}

      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={handleSelectHistory}
      />

      {/* Workspace */}
      <div className="workspace">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-tabs">
            <button
              className={mode === "analyze" ? "active" : ""}
              onClick={() => setMode("analyze")}
            >
              文章智检
            </button>
            <button
              className={mode === "inspiration" ? "active" : ""}
              onClick={() => setMode("inspiration")}
            >
              选题灵感
            </button>
          </div>
          {mode === "analyze" ? (
            <InputPanel
              title={title}
              content={content}
              selectedPlatforms={selectedPlatforms}
              onTitleChange={setTitle}
              onContentChange={setContent}
              onPlatformsChange={setSelectedPlatforms}
              onAnalyze={handleAnalyze}
              loading={loading}
              hasReport={hasReport}
              onReset={() => setReport(null)}
              onCopyRewritten={hasReport ? handleCopyRewritten : undefined}
              titleRef={titleRef}
              contentRef={contentRef}
            />
          ) : (
            <TopicInspirationPanel
              newsDesc={newsDesc}
              selectedPlatforms={topicPlatforms}
              selectedStyle={selectedStyle}
              onNewsDescChange={setNewsDesc}
              onPlatformsChange={setTopicPlatforms}
              onStyleChange={setSelectedStyle}
              onGenerate={handleGenerateTopics}
              loading={topicLoading}
            />
          )}
        </aside>

        {/* Content */}
        <main className="content">
          <div className="content-inner">
            {mode === "analyze" ? (
              <>
                {!report && !loading && (
                  <div className="empty">
                    <div className="empty-icon">
                      <FileTextIcon size={26} />
                    </div>
                    <h2>准备检测您的文章</h2>
                    <p>在左侧填写标题与正文，选择目标平台后点击「开始检测」，将获得差异化、可信度与合规性的完整报告。</p>
                    <button className="btn btn-secondary" onClick={runExample}>
                      <PlayIcon size={13} />
                      使用示例文章试运行
                    </button>
                    <div className="empty-steps">
                      <div className="empty-step">
                        <div className="n">1</div>
                        <div className="t">粘贴文章</div>
                        <div className="d">支持标题 + 正文，建议正文 200 字以上以获得更稳定的结果。</div>
                      </div>
                      <div className="empty-step">
                        <div className="n">2</div>
                        <div className="t">勾选目标平台</div>
                        <div className="d">不同平台的推荐机制不同，建议至少勾选最终发布平台。</div>
                      </div>
                      <div className="empty-step">
                        <div className="n">3</div>
                        <div className="t">查看报告并改写</div>
                        <div className="d">报告含可直接复制的低风险改写稿与按平台的修改建议。</div>
                      </div>
                    </div>
                  </div>
                )}

                {loading && <LoadingState variant="analyze" />}

                {report && !loading && (
                  <ReportView
                    report={report}
                    title={title}
                    content={content}
                    onHighlight={handleHighlight}
                  />
                )}
              </>
            ) : (
              <>
                {!topicIdeas && !topicLoading && (
                  <div className="empty">
                    <div className="empty-icon">
                      <LightbulbIcon size={26} />
                    </div>
                    <h2>输入新闻描述，生成可发布的选题角度</h2>
                    <p>在左侧粘贴热点事件、新闻描述或关键词，选择目标平台和风格方向，AI 将为你生成 5-8 个差异化的选题角度。</p>
                    <div className="empty-steps">
                      <div className="empty-step">
                        <div className="n">1</div>
                        <div className="t">输入新闻或关键词</div>
                        <div className="d">粘贴新闻描述、热点事件或关键词，建议 10 字以上。</div>
                      </div>
                      <div className="empty-step">
                        <div className="n">2</div>
                        <div className="t">选择平台与风格</div>
                        <div className="d">不同平台受众差异大，风格决定切入角度。</div>
                      </div>
                      <div className="empty-step">
                        <div className="n">3</div>
                        <div className="t">获取选题并检测</div>
                        <div className="d">生成多角度选题后，可直接转为草稿进入文章智检。</div>
                      </div>
                    </div>
                  </div>
                )}

                {topicLoading && <LoadingState variant="topic" />}

                {topicIdeas && !topicLoading && (
                  <TopicInspirationView
                    ideas={topicIdeas}
                    newsDesc={newsDesc}
                    onUseAsDraft={handleUseAsDraft}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function FileTextIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function PlayIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function LightbulbIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2v1" />
      <path d="M12 7a5 5 0 0 1 5 5c0 2.2-1.4 4-3 5.2V18H10v-.8C8.4 16 7 14.2 7 12a5 5 0 0 1 5-5z" />
    </svg>
  );
}
