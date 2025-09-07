'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatMessage } from '@/types/ai';

interface ChatContextType {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  conversationHistory: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  setConversationHistory: React.Dispatch<React.SetStateAction<Array<{ role: "system" | "user" | "assistant"; content: string }>>>;
  clearConversation: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "system" | "user" | "assistant"; content: string }>>([]);

  const clearConversation = () => {
    setMessages([]);
    setConversationHistory([]);
  };

  const value: ChatContextType = {
    messages,
    setMessages,
    conversationHistory,
    setConversationHistory,
    clearConversation,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
