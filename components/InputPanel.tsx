"use client";

import { useState } from "react";
import type { Platform } from "@/types/report";
import { FileText, Play, RefreshCw, Copy, Check } from "lucide-react";

const PLATFORMS: { id: Platform; name: string; icon: string; brand: string }[] = [
  { id: "百家号", name: "百家号", icon: "百", brand: "pf-baijiahao" },
  { id: "今日头条", name: "今日头条", icon: "头", brand: "pf-toutiao" },
  { id: "微信公众号", name: "微信公众号", icon: "微", brand: "pf-wechat" },
  { id: "小红书", name: "小红书", icon: "红", brand: "pf-xhs" },
  { id: "知乎", name: "知乎", icon: "知", brand: "pf-zhihu" },
];

const EXAMPLE_TITLE = "重磅！教师减负终于来了，国家亲自出手，全体教师必看！";
const EXAMPLE_CONTENT = `近日，国家相关部门发布重磅文件，明确将大力推进教师减负工作。据悉，新政策一旦落地，全国千万教师都将受益。

业内人士表示，这一改革力度前所未有。未来非教学任务将被严格限制，迎检、填表、各类无关会议都会大幅减少。某地教师反映，过去一周要应付十几项检查，现在终于可以安心备课了。

专家表示，给教师减负就是给教育减负，给孩子减负。我们要让教师把全部精力放在课堂上，这才是教育的本质。相信不久的将来，老师们就能告别被迫加班、996的日子。

广大教师朋友们，这次国家是真的下定决心了，大家可以期待！如果你身边有当老师的朋友，一定要转发给他们。`;

interface InputPanelProps {
  title: string;
  content: string;
  selectedPlatforms: Platform[];
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onPlatformsChange: (v: Platform[]) => void;
  onAnalyze: () => void;
  loading: boolean;
  hasReport: boolean;
  onReset: () => void;
  onCopyRewritten?: () => void;
  titleRef?: React.RefObject<HTMLInputElement | null> | React.RefObject<HTMLTextAreaElement | null>;
  contentRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function InputPanel({
  title,
  content,
  selectedPlatforms,
  onTitleChange,
  onContentChange,
  onPlatformsChange,
  onAnalyze,
  loading,
  hasReport,
  onReset,
  onCopyRewritten,
  titleRef,
  contentRef,
}: InputPanelProps) {
  const togglePlatform = (p: Platform) => {
    if (selectedPlatforms.includes(p)) {
      onPlatformsChange(selectedPlatforms.filter((x) => x !== p));
    } else {
      onPlatformsChange([...selectedPlatforms, p]);
    }
  };

  const fillExample = () => {
    onTitleChange(EXAMPLE_TITLE);
    onContentChange(EXAMPLE_CONTENT);
    if (selectedPlatforms.length === 0) {
      onPlatformsChange(PLATFORMS.map((p) => p.id));
    }
  };

  const canAnalyze =
    title.trim().length > 0 &&
    content.trim().length > 20 &&
    selectedPlatforms.length > 0;

  return (
    <>
      <div className="sidebar-inner">
        <div>
          <div className="field-label">
            <span>文章标题</span>
            <span className="hint">{title.length} / 64</span>
          </div>
          <input
            ref={titleRef as React.RefObject<HTMLInputElement | null>}
            className="input"
            placeholder="请输入文章标题"
            value={title}
            maxLength={64}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <div>
          <div className="field-label">
            <span>文章正文</span>
            <span className="hint">{content.replace(/\s/g, "").length} 字</span>
          </div>
          <textarea
            ref={contentRef}
            className="textarea"
            placeholder="粘贴或输入文章正文，建议 200 字以上以获得更稳定的检测结果"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
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

        <button className="btn btn-ghost" onClick={fillExample} disabled={loading}>
          <FileText size={13} />
          使用示例文章
        </button>
      </div>

      <div className="sidebar-actions">
        <button
          className="btn btn-primary"
          disabled={!canAnalyze || loading}
          onClick={onAnalyze}
          style={{ width: "100%", height: 38 }}
        >
          {loading ? (
            <>
              <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              检测中…
            </>
          ) : hasReport ? (
            <><RefreshCw size={13} />重新检测</>
          ) : (
            <><Play size={13} />开始检测</>
          )}
        </button>
        <button
          className="btn btn-secondary"
          disabled={!hasReport || loading}
          style={{ width: "100%" }}
          onClick={onCopyRewritten}
        >
          <Copy size={13} />
          复制改写稿
        </button>
      </div>
    </>
  );
}
