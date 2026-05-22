export type TopicStyle = "深度解读" | "热点评论" | "科普拆解" | "故事化" | "争议讨论";

export interface TopicIdea {
  id: string;
  title: string;
  angle: string;
  platforms: string[];
  hookReason: string;
  openingSuggestion: string;
}
