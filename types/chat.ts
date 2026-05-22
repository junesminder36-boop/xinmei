import type { AnalysisReport } from "./report";
import type { TopicIdea } from "./topic";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatContextState {
  mode?: "analyze" | "inspiration";
  title?: string;
  content?: string;
  platforms?: string[];
  newsDesc?: string;
  topicIdeas?: TopicIdea[];
  selectedStyle?: string;
  report?: AnalysisReport;
}
