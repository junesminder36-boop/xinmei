"use client";

import { useState } from "react";
import type { Platform } from "@/types/report";
import type { TopicStyle } from "@/types/topic";
import { Check, Sparkles } from "lucide-react";

const PLATFORMS: { id: Platform; name: string; icon: string; brand: string }[] = [
  { id: "百家号", name: "百家号", icon: "百", brand: "pf-baijiahao" },
  { id: "今日头条", name: "今日头条", icon: "头", brand: "pf-toutiao" },
  { id: "微信公众号", name: "微信公众号", icon: "微", brand: "pf-wechat" },
  { id: "小红书", name: "小红书", icon: "红", brand: "pf-xhs" },
  { id: "知乎", name: "知乎", icon: "知", brand: "pf-zhihu" },
];

const STYLES: { id: TopicStyle; label: string }[] = [
  { id: "深度解读", label: "深度解读" },
  { id: "热点评论", label: "热点评论" },
  { id: "科普拆解", label: "科普拆解" },
  { id: "故事化", label: "故事化" },
  { id: "争议讨论", label: "争议讨论" },
];

interface TopicInspirationPanelProps {
  newsDesc: string;
  selectedPlatforms: Platform[];
  selectedStyle: TopicStyle;
  onNewsDescChange: (v: string) => void;
  onPlatformsChange: (v: Platform[]) => void;
  onStyleChange: (v: TopicStyle) => void;
  onGenerate: () => void;
  loading: boolean;
}

export function TopicInspirationPanel({
  newsDesc,
  selectedPlatforms,
  selectedStyle,
  onNewsDescChange,
  onPlatformsChange,
  onStyleChange,
  onGenerate,
  loading,
}: TopicInspirationPanelProps) {
  const togglePlatform = (p: Platform) => {
    if (selectedPlatforms.includes(p)) {
      onPlatformsChange(selectedPlatforms.filter((x) => x !== p));
    } else {
      onPlatformsChange([...selectedPlatforms, p]);
    }
  };

  const canGenerate =
    newsDesc.trim().length > 5 && selectedPlatforms.length > 0;

  return (
    <>
      <div className="sidebar-inner">
        <div>
          <div className="field-label">
            <span>新闻描述或关键词</span>
            <span className="hint">{newsDesc.length} 字</span>
          </div>
          <textarea
            className="textarea"
            style={{ minHeight: 120 }}
            placeholder="粘贴新闻描述、热点事件或关键词，例如：教师减负政策出台"
            value={newsDesc}
            onChange={(e) => onNewsDescChange(e.target.value)}
          />
        </div>

        <div>
          <div className="field-label">
            <span>目标平台</span>
            <span className="hint">已选 {selectedPlatforms.length} / {PLATFORMS.length}</span>
          </div>
          <div className="platform-grid">
            {PLATFORMS.map((p) => (
              <label
                key={p.id}
                className={"platform-chip" + (selectedPlatforms.includes(p.id) ? " checked" : "")}
                role="checkbox"
                aria-checked={selectedPlatforms.includes(p.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    togglePlatform(p.id);
                  }
                }}
              >
                <span className="check">
                  {selectedPlatforms.includes(p.id) && (
                    <Check size={9} strokeWidth={2.4} color="#fff" />
                  )}
                </span>
                <span className={"icon " + p.brand}>{p.icon}</span>
                <span>{p.name}</span>
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(p.id)}
                  onChange={() => togglePlatform(p.id)}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="field-label">
            <span>风格方向</span>
            <span className="hint">单选</span>
          </div>
          <div className="style-grid">
            {STYLES.map((s) => (
              <label
                key={s.id}
                className={"style-chip" + (selectedStyle === s.id ? " checked" : "")}
                role="radio"
                aria-checked={selectedStyle === s.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    onStyleChange(s.id);
                  }
                }}
              >
                <span className="radio-dot" />
                <span>{s.label}</span>
                <input
                  type="radio"
                  name="topic-style"
                  checked={selectedStyle === s.id}
                  onChange={() => onStyleChange(s.id)}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-actions">
        <button
          className="btn btn-primary"
          disabled={!canGenerate || loading}
          onClick={onGenerate}
          style={{ width: "100%", height: 38 }}
        >
          {loading ? (
            <>
              <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              生成中…
            </>
          ) : (
            <>
              <Sparkles size={13} />
              生成选题灵感
            </>
          )}
        </button>
      </div>
    </>
  );
}
