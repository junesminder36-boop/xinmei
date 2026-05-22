import type { TopicIdea, TopicStyle } from "@/types/topic";
import { generateTopicIdeas as mockGenerate } from "./topic-mock";

export async function generateTopicIdeasWithAI(
  newsDesc: string,
  platforms: string[],
  style: TopicStyle
): Promise<TopicIdea[]> {
  try {
    const response = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsDesc, platforms, style }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.warn("AI 选题生成失败，降级到 mock:", error.error || response.statusText);
      return mockGenerate(newsDesc, platforms, style);
    }

    const ideas: TopicIdea[] = await response.json();
    return ideas;
  } catch (error) {
    console.warn("AI 选题请求异常，降级到 mock:", error);
    return mockGenerate(newsDesc, platforms, style);
  }
}
