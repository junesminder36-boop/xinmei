import type { AnalysisReport } from "./report";
import type { TopicIdea } from "./topic";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type WorkflowStage =
  | "idle"
  | "clarify"
  | "structure"
  | "outline"
  | "draft";

export interface ChatContextState {
  mode?: "analyze" | "inspiration";
  title?: string;
  content?: string;
  platforms?: string[];
  newsDesc?: string;
  topicIdeas?: TopicIdea[];
  selectedStyle?: string;
  report?: AnalysisReport;
  workflowStage?: WorkflowStage;
  draftParams?: {
    platform?: string;
    theme?: string;
    audience?: string;
    placement?: string;
    wordCount?: string;
    structure?: string;
    outline?: string;
  };
}
