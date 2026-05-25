export type TopicStyle = "深度解读" | "热点评论" | "科普拆解" | "故事化" | "争议讨论" | "数字化解决方案";

export interface TitleOption {
  title: string;
  score: number;
  reason: string;
}

export interface TopicIdea {
  id: string;
  title: string;
  angle: string;
  platforms: string[];
  hookReason: string;
  openingSuggestion: string;
  structure?: string;
  structureReason?: string;
  titleOptions?: {
    traffic: TitleOption;
    professional: TitleOption;
    balanced: TitleOption;
  };
}
