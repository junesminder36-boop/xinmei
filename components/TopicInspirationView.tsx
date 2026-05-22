"use client";

import { useState } from "react";
import type { TopicIdea } from "@/types/topic";
import { Copy, Check, ArrowRight, Lightbulb, Target, Zap, Quote } from "lucide-react";

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

export function TopicInspirationView({ ideas, newsDesc, onUseAsDraft }: TopicInspirationViewProps) {
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
            </div>

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
