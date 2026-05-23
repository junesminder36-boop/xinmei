"use client";

import { useState } from "react";
import type { TopicIdea } from "@/types/topic";
import { Copy, Check, ArrowRight, Lightbulb, Target, Zap, Quote, ChevronDown, ChevronUp, LayoutTemplate, Download } from "lucide-react";

interface TopicInspirationViewProps {
  ideas: TopicIdea[];
  newsDesc: string;
  onUseAsDraft?: (title: string, opening: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try { await navigator.clipboard.writeText(text); } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button className={"copy-btn" + (copied ? " copied" : "")} onClick={onClick}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      <span>{copied ? "已复制" : "复制选题"}</span>
    </button>
  );
}

function generateTopicMarkdown(ideas: TopicIdea[], newsDesc: string): string {
  const lines: string[] = [
    "# 选题灵感报告",
    "",
    `**输入描述：** ${newsDesc}`,
    `**生成时间：** ${new Date().toLocaleString("zh-CN")}`,
    `**共生成 ${ideas.length} 个选题角度**`,
    "",
    "---",
    "",
  ];

  ideas.forEach((idea, idx) => {
    lines.push(`## ${idx + 1}. ${idea.title}`);
    lines.push("");
    lines.push(`- **切入角度：** ${idea.angle}`);
    lines.push(`- **适配平台：** ${idea.platforms.join("、")}`);
    if (idea.structure) {
      lines.push(`- **推荐结构：** ${idea.structure}`);
    }
    lines.push("");

    if (idea.titleOptions) {
      lines.push("### 标题三选一");
      lines.push(`- 【流量】${idea.titleOptions.traffic.title}（${idea.titleOptions.traffic.score}/10 · ${idea.titleOptions.traffic.reason}）`);
      lines.push(`- 【专业】${idea.titleOptions.professional.title}（${idea.titleOptions.professional.score}/10 · ${idea.titleOptions.professional.reason}）`);
      lines.push(`- 【平衡】${idea.titleOptions.balanced.title}（${idea.titleOptions.balanced.score}/10 · ${idea.titleOptions.balanced.reason}）`);
      lines.push("");
    }

    lines.push("### 爆点理由");
    lines.push(idea.hookReason);
    lines.push("");

    lines.push("### 开头建议");
    lines.push(idea.openingSuggestion);
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}

export function TopicInspirationView({ ideas, newsDesc, onUseAsDraft }: TopicInspirationViewProps) {
  const handleExport = () => {
    try {
      const md = generateTopicMarkdown(ideas, newsDesc);
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `选题灵感-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error("导出失败:", e);
      alert("导出失败，请重试");
    }
  };

  return (
    <>
      <div className="verdict tone-safe">
        <div className="verdict-icon">
          <Lightbulb size={18} />
        </div>
        <div className="verdict-text">
          <div className="verdict-title">生成 {ideas.length} 个选题角度</div>
          <div className="verdict-sub">
            基于「{newsDesc.slice(0, 40)}{newsDesc.length > 40 ? "…" : ""}」生成，覆盖 {new Set(ideas.flatMap((i) => i.platforms)).size} 个平台的适配角度
          </div>
        </div>
        <button
          className="btn btn-sm btn-ghost"
          onClick={handleExport}
          title="导出 Markdown"
          style={{ marginLeft: "auto", flexShrink: 0 }}
        >
          <Download size={13} />
          导出
        </button>
      </div>

      <div className="topic-list">
        {ideas.map((idea, idx) => (
          <div className="topic-card" key={idea.id}>
            <div className="topic-card-head">
              <span className="topic-num">{String(idx + 1).padStart(2, "0")}</span>
              <CopyButton text={idea.title} />
            </div>

            <h3 className="topic-title">{idea.title}</h3>

            <div className="topic-meta">
              <span className="tag tone-primary">
                <Target size={11} />
                {idea.angle}
              </span>
              {idea.platforms.map((p) => (
                <span key={p} className="tag">{p}</span>
              ))}
              {idea.structure && (
                <span className="tag tone-warn">
                  <LayoutTemplate size={11} />
                  {idea.structure}
                </span>
              )}
            </div>

            {idea.structureReason && (
              <div className="topic-section">
                <p className="topic-section-text" style={{ color: "var(--text-2)", fontSize: 12 }}>
                  推荐结构：{idea.structureReason}
                </p>
              </div>
            )}

            {idea.titleOptions && <TitleOptions idea={idea} />}

            <div className="topic-section">
              <div className="topic-section-label">
                <Zap size={12} />
                爆点理由
              </div>
              <p className="topic-section-text">{idea.hookReason}</p>
            </div>

            <div className="topic-section">
              <div className="topic-section-label">
                <Quote size={12} />
                开头建议
              </div>
              <p className="topic-section-text" style={{ fontStyle: "italic" }}>{idea.openingSuggestion}</p>
            </div>

            {onUseAsDraft && (
              <div className="topic-card-footer">
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => onUseAsDraft(idea.title, idea.openingSuggestion)}
                >
                  <ArrowRight size={12} />
                  转为检测草稿
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function TitleOptions({ idea }: { idea: TopicIdea }) {
  const [open, setOpen] = useState(false);
  const opts = idea.titleOptions;
  if (!opts) return null;

  return (
    <div className="topic-section" style={{ background: "var(--surface-2)", borderRadius: 8, padding: "8px 10px" }}>
      <button
        className="topic-section-label"
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", border: "none", background: "transparent", padding: 0 }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Target size={12} />
          标题 3 选 1
        </span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="title-option">
            <span className="tag tone-warn">流量</span>
            <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{opts.traffic.title}</span>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{opts.traffic.score}/10 · {opts.traffic.reason}</span>
          </div>
          <div className="title-option">
            <span className="tag tone-primary">专业</span>
            <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{opts.professional.title}</span>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{opts.professional.score}/10 · {opts.professional.reason}</span>
          </div>
          <div className="title-option">
            <span className="tag tone-safe">平衡</span>
            <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{opts.balanced.title}</span>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{opts.balanced.score}/10 · {opts.balanced.reason}</span>
          </div>
        </div>
      )}
    </div>
  );
}
