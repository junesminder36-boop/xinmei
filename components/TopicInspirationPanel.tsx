"use client";

import { useState } from "react";
import type { Platform } from "@/types/report";
import type { TopicStyle } from "@/types/topic";
import { Check, Sparkles, Flame, ChevronDown, RefreshCw } from "lucide-react";

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
  { id: "数字化解决方案", label: "数字化解决方案" },
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

  const [hotTopics, setHotTopics] = useState<Array<{ title: string; source: string; date: string; category: string }>>([]);
  const [fetchingHot, setFetchingHot] = useState(false);
  const [showHotDropdown, setShowHotDropdown] = useState(false);
  const [hotError, setHotError] = useState<string>("");

  const fetchHotTopics = async (forceRefresh = false) => {
    setFetchingHot(true);
    setHotError("");
    try {
      const refreshParam = forceRefresh ? "&refresh" : "";
      const res = await fetch(`/api/hot-topics?t=${Date.now()}${refreshParam}`);
      const data = await res.json();
      if (data.topics && Array.isArray(data.topics)) {
        setHotTopics(data.topics);
        setShowHotDropdown(true);
        if (data.fallback && data.error) {
          setHotError(`热点搜索失败，当前为预置数据。原因：${data.error}`);
        } else if (data.fallback) {
          setHotError("热点搜索返回数据不足，已补充预置数据。");
        } else if (data.cached) {
          setHotError("");
        }
      }
    } catch (e) {
      console.error("获取热点失败", e);
      setHotError("网络请求失败，请稍后重试。");
    } finally {
      setFetchingHot(false);
    }
  };

  const selectHotTopic = (title: string) => {
    onNewsDescChange(title);
    setShowHotDropdown(false);
  };

  const canGenerate =
    newsDesc.trim().length > 5 && selectedPlatforms.length > 0;

  return (
    <>
      <div className="sidebar-inner">
        <div>
          <div className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>新闻描述或关键词</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => fetchHotTopics()}
                disabled={fetchingHot}
                style={{ padding: "2px 8px", fontSize: 12, height: 26 }}
              >
                {fetchingHot ? (
                  <span className="loading-spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                ) : (
                  <Flame size={11} />
                )}
                获取行业热点
              </button>
              {showHotDropdown && (
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => fetchHotTopics(true)}
                  disabled={fetchingHot}
                  title="刷新热点"
                  style={{ padding: "2px 6px", fontSize: 12, height: 26 }}
                >
                  <RefreshCw size={11} />
                </button>
              )}
            </div>
          </div>
          {hotError && (
            <div style={{ marginBottom: 8, padding: "6px 10px", fontSize: 12, color: "#c0392b", background: "#fdeaea", borderRadius: 6, border: "1px solid #f5c6cb" }}>
              {hotError}
            </div>
          )}
          {showHotDropdown && hotTopics.length > 0 && (
            <div style={{ marginBottom: 8, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", maxHeight: 240, overflow: "auto" }}>
              <div style={{ padding: "6px 10px", fontSize: 11, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>近3天行业热点（点击选用）</span>
                <button onClick={() => setShowHotDropdown(false)} style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>关闭</button>
              </div>
              {["城市更新", "地产", "物业"].map((cat) => {
                const items = hotTopics.filter((t) => t.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <div style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "var(--text-2)", background: "var(--surface-2)", position: "sticky", top: 0 }}>
                      {cat}
                    </div>
                    {items.map((t, i) => (
                      <div
                        key={`${cat}-${i}`}
                        onClick={() => selectHotTopic(t.title)}
                        style={{ padding: "6px 10px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--border-weak)", display: "flex", alignItems: "center", gap: 6 }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--surface-2)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                      >
                        <ChevronDown size={11} style={{ transform: "rotate(-90deg)", color: "var(--text-muted)", flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{t.source}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
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
