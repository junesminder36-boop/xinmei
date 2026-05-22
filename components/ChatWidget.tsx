"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendChatMessage } from "@/lib/ai-chat";
import { useChatContext } from "@/lib/chat-context";
import type { ChatMessage } from "@/types/chat";
import { X, Send, Loader2, FileText, Lightbulb, PenTool, ShieldCheck, MousePointerClick } from "lucide-react";

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "你好！我是优小马，你的新媒体创作助手。\n\n我可以帮你：\n• 根据选题灵感或建议角度生成完整文章\n• 优化标题、改写内容、检查合规性\n• 回答新媒体运营和优码产品相关问题\n\n直接输入你的需求，或点击下方的快捷操作吧！",
};

const QUICK_ACTIONS = [
  { label: "生成完整文章", icon: FileText, prompt: "请根据当前页面的内容，帮我生成一篇完整的、可直接发布的新媒体文章。" },
  { label: "基于选题写文章", icon: Lightbulb, prompt: "请基于当前生成的选题，帮我写一篇完整的文章。选择最有潜力的那个选题。" },
  { label: "优化标题", icon: PenTool, prompt: "请帮我优化当前文章的标题，给出3个不同风格的备选标题。" },
  { label: "检查合规性", icon: ShieldCheck, prompt: "请帮我检查当前内容是否存在合规风险，并给出修改建议。" },
];

const ASSISTANT_AVATAR_SRC = "/assistant-typing.gif";

export function ChatWidget() {
  const { context } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drag state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { mx: clientX, my: clientY, ox: offset.x, oy: offset.y };

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const cx = "touches" in ev ? ev.touches[0].clientX : ev.clientX;
      const cy = "touches" in ev ? ev.touches[0].clientY : ev.clientY;
      setOffset({
        x: dragStart.current.ox + (cx - dragStart.current.mx),
        y: dragStart.current.oy + (cy - dragStart.current.my),
      });
    };

    const onUp = (ev: MouseEvent | TouchEvent) => {
      const cx = "changedTouches" in ev ? ev.changedTouches[0].clientX : ev.clientX;
      const cy = "changedTouches" in ev ? ev.changedTouches[0].clientY : ev.clientY;
      const dx = cx - dragStart.current.mx;
      const dy = cy - dragStart.current.my;
      if (Math.sqrt(dx * dx + dy * dy) < 5) {
        setIsTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 900);
        setIsOpen(true);
      }
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = [...messages, userMsg].slice(-20);
    const reply = await sendChatMessage(history, context);

    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleQuickAction = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <>
      {/* Floating avatar button (always visible, draggable) */}
      <div
        className={`chat-avatar-shell ${isOpen ? "chat-avatar-hidden" : ""} ${isTyping ? "chat-avatar-shell-typing" : ""}`}
        style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
      >
        <span className="chat-avatar-label">AI助手</span>
        <span className="chat-avatar-guide" aria-hidden="true">
          <MousePointerClick className="chat-avatar-guide-icon" size={15} strokeWidth={2.2} />
          <span>点击</span>
        </span>
        <button
          type="button"
          className="chat-avatar-btn"
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          title="优小马 AI 助手"
          aria-label="打开优小马 AI 助手"
        >
          <span className="chat-avatar-orb">
            <img
              src={ASSISTANT_AVATAR_SRC}
              alt="优小马"
              draggable={false}
            />
          </span>
        </button>
      </div>

      {/* Chat panel */}
      {isOpen && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <img
                src={ASSISTANT_AVATAR_SRC}
                alt="优小马"
                className={`chat-header-avatar ${loading ? "chat-header-avatar-typing" : ""}`}
              />
              <div>
                <div className="chat-header-name">优小马</div>
                <div className="chat-header-status">
                  <span className="chat-status-dot" />
                  AI 创作助手
                </div>
              </div>
            </div>
            <button className="chat-header-close" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message ${msg.role === "user" ? "chat-message-user" : "chat-message-assistant"}`}
              >
                {msg.role === "assistant" && (
                  <img src={ASSISTANT_AVATAR_SRC} alt="" className="chat-msg-avatar" />
                )}
                <div className="chat-bubble">
                  <div className="chat-bubble-content">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message chat-message-assistant">
                <img src={ASSISTANT_AVATAR_SRC} alt="" className="chat-msg-avatar" />
                <div className="chat-bubble">
                  <div className="chat-bubble-loading">
                    <Loader2 size={14} className="chat-spin" />
                    思考中…
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {messages.length <= 2 && !loading && (
            <div className="chat-quick-actions">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className="chat-quick-btn"
                  onClick={() => handleQuickAction(action.prompt)}
                >
                  <action.icon size={12} />
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder="输入你的需求，按 Enter 发送，Shift+Enter 换行…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="chat-send-btn"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
