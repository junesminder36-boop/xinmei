"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ChatContextState } from "@/types/chat";

interface ChatContextValue {
  context: ChatContextState;
  setContext: (ctx: ChatContextState) => void;
}

const ChatContext = createContext<ChatContextValue>({
  context: {},
  setContext: () => {},
});

export function ChatContextProvider({ children }: { children: React.ReactNode }) {
  const [context, setContextState] = useState<ChatContextState>({});

  const setContext = useCallback((ctx: ChatContextState) => {
    setContextState((prev) => ({ ...prev, ...ctx }));
  }, []);

  return (
    <ChatContext.Provider value={{ context, setContext }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  return useContext(ChatContext);
}
