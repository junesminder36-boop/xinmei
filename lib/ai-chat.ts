import type { ChatMessage, ChatContextState } from "@/types/chat";

export async function sendChatMessage(
  messages: ChatMessage[],
  context?: ChatContextState
): Promise<string> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, context }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return `请求失败：${error.error || response.statusText}`;
    }

    const data = await response.json();
    return data.reply || "AI 没有返回内容";
  } catch (error) {
    console.error("Chat 请求异常:", error);
    return "网络异常，请稍后重试。";
  }
}
