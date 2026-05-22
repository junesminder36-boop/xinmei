"use client";

import { useState, useEffect } from "react";
import type { SavedReport } from "@/lib/db";
import { X, Clock, Trash2, FileText } from "lucide-react";

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onSelect: (report: SavedReport) => void;
}

export function HistoryPanel({ open, onClose, onSelect }: HistoryPanelProps) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadHistory();
  }, [open]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (e) {
      console.error("加载历史记录失败:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("删除失败:", err);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  if (!open) return null;

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <div className="history-title">
            <Clock size={16} />
            <span>历史记录</span>
          </div>
          <button className="history-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="history-list">
          {loading && reports.length === 0 && (
            <div className="history-empty">加载中…</div>
          )}

          {!loading && reports.length === 0 && (
            <div className="history-empty">
              <FileText size={24} opacity={0.4} />
              <p>暂无历史记录</p>
              <span>完成检测后报告将自动保存</span>
            </div>
          )}

          {reports.map((r) => (
            <div
              key={r.id}
              className="history-item"
              onClick={() => onSelect(r)}
            >
              <div className="history-item-title">{r.title || "无标题"}</div>
              <div className="history-item-meta">
                <span>{formatTime(r.createdAt)}</span>
                <span className="history-item-platforms">
                  {r.platforms.join("、")}
                </span>
              </div>
              <div className="history-item-scores">
                <ScoreBadge label="可信度" score={r.report.scores.credibility} />
                <ScoreBadge label="安全性" score={r.report.scores.safety} />
                <ScoreBadge label="差异化" score={r.report.scores.differentiation} />
                <span className={`history-advice advice-${r.report.scores.advice === "建议发布" ? "ok" : r.report.scores.advice === "建议修改后发布" ? "warn" : "danger"}`}>
                  {r.report.scores.advice}
                </span>
              </div>
              <button
                className="history-item-delete"
                onClick={(e) => handleDelete(e, r.id)}
                title="删除"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const cls = score >= 80 ? "good" : score >= 50 ? "mid" : "bad";
  return (
    <span className={`history-score ${cls}`}>
      {label} {score}
    </span>
  );
}
