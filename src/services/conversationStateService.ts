import { ChatMessage } from '@/types/ai';

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
  }>;
  error?: {
    code: string;
    message: string;
  };
}

export interface ConversationState {
  id: string;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
  title?: string;
  isActive: boolean;
  metadata: {
    userId?: string;
    sessionId?: string;
    toolUsage: Record<string, number>;
    errorCount: number;
    messageCount: number;
  };
}

export interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  lastMessage: string;
  updatedAt: number;
  hasErrors: boolean;
}

export class ConversationStateService {
  private conversations: Map<string, ConversationState> = new Map();
  private currentConversationId: string | null = null;
  private readonly MAX_MESSAGES_PER_CONVERSATION = 100;
  private readonly MAX_CONVERSATIONS = 50;
  private readonly STORAGE_KEY = 'devops-chat-conversations';

  constructor() {
    this.loadFromStorage();
  }

  // Create a new conversation
  createConversation(userId?: string, sessionId?: string): string {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const conversation: ConversationState = {
      id,
      messages: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
      metadata: {
        userId,
        sessionId,
        toolUsage: {},
        errorCount: 0,
        messageCount: 0
      }
    };

    this.conversations.set(id, conversation);
    this.currentConversationId = id;
    this.saveToStorage();
    this.cleanupOldConversations();

    return id;
  }

  // Get current conversation
  getCurrentConversation(): ConversationState | null {
    if (!this.currentConversationId) return null;
    return this.conversations.get(this.currentConversationId) || null;
  }

  // Set current conversation
  setCurrentConversation(id: string): boolean {
    if (this.conversations.has(id)) {
      this.currentConversationId = id;
      return true;
    }
    return false;
  }

  // Add message to current conversation
  addMessage(message: ConversationMessage): boolean {
    const conversation = this.getCurrentConversation();
    if (!conversation) return false;

    conversation.messages.push(message);
    conversation.updatedAt = Date.now();
    conversation.metadata.messageCount++;

    // Update tool usage statistics
    if (message.toolCalls) {
      message.toolCalls.forEach(toolCall => {
        conversation.metadata.toolUsage[toolCall.name] = 
          (conversation.metadata.toolUsage[toolCall.name] || 0) + 1;
      });
    }

    // Update error count
    if (message.error) {
      conversation.metadata.errorCount++;
    }

    // Trim messages if too many
    if (conversation.messages.length > this.MAX_MESSAGES_PER_CONVERSATION) {
      conversation.messages = conversation.messages.slice(-this.MAX_MESSAGES_PER_CONVERSATION);
    }

    this.saveToStorage();
    return true;
  }

  // Add system message
  addSystemMessage(content: string): boolean {
    return this.addMessage({
      role: 'system',
      content,
      timestamp: Date.now()
    });
  }

  // Add user message
  addUserMessage(content: string): boolean {
    return this.addMessage({
      role: 'user',
      content,
      timestamp: Date.now()
    });
  }

  // Add assistant message
  addAssistantMessage(
    content: string, 
    toolCalls?: Array<{ name: string; arguments: Record<string, unknown>; result?: unknown }>,
    error?: { code: string; message: string }
  ): boolean {
    return this.addMessage({
      role: 'assistant',
      content,
      timestamp: Date.now(),
      toolCalls,
      error
    });
  }

  // Get conversation history for AI
  getConversationHistory(conversationId?: string): ConversationMessage[] {
    const id = conversationId || this.currentConversationId;
    if (!id) return [];

    const conversation = this.conversations.get(id);
    if (!conversation) return [];

    return conversation.messages;
  }

  // Get conversation history with system message
  getConversationHistoryWithSystem(systemMessage: string, conversationId?: string): ConversationMessage[] {
    const history = this.getConversationHistory(conversationId);
    
    // Check if system message is already the first message
    if (history.length > 0 && history[0].role === 'system' && history[0].content === systemMessage) {
      return history;
    }

    // Add system message at the beginning
    return [
      { role: 'system', content: systemMessage, timestamp: Date.now() },
      ...history
    ];
  }

  // Update conversation title
  updateConversationTitle(title: string, conversationId?: string): boolean {
    const id = conversationId || this.currentConversationId;
    if (!id) return false;

    const conversation = this.conversations.get(id);
    if (!conversation) return false;

    conversation.title = title;
    conversation.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  // Get conversation summaries
  getConversationSummaries(): ConversationSummary[] {
    return Array.from(this.conversations.values())
      .map(conv => ({
        id: conv.id,
        title: conv.title || `Conversation ${conv.id.slice(-8)}`,
        messageCount: conv.metadata.messageCount,
        lastMessage: conv.messages[conv.messages.length - 1]?.content || 'No messages',
        updatedAt: conv.updatedAt,
        hasErrors: conv.metadata.errorCount > 0
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Get conversation by ID
  getConversation(id: string): ConversationState | null {
    return this.conversations.get(id) || null;
  }

  // Delete conversation
  deleteConversation(id: string): boolean {
    if (this.conversations.has(id)) {
      this.conversations.delete(id);
      
      if (this.currentConversationId === id) {
        this.currentConversationId = null;
      }
      
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Clear current conversation
  clearCurrentConversation(): boolean {
    if (!this.currentConversationId) return false;

    const conversation = this.conversations.get(this.currentConversationId);
    if (!conversation) return false;

    conversation.messages = [];
    conversation.updatedAt = Date.now();
    conversation.metadata.toolUsage = {};
    conversation.metadata.errorCount = 0;
    conversation.metadata.messageCount = 0;

    this.saveToStorage();
    return true;
  }

  // Get conversation statistics
  getConversationStatistics(conversationId?: string): {
    messageCount: number;
    toolUsage: Record<string, number>;
    errorCount: number;
    duration: number; // in minutes
  } | null {
    const id = conversationId || this.currentConversationId;
    if (!id) return null;

    const conversation = this.conversations.get(id);
    if (!conversation) return null;

    const duration = (Date.now() - conversation.createdAt) / (1000 * 60); // minutes

    return {
      messageCount: conversation.metadata.messageCount,
      toolUsage: { ...conversation.metadata.toolUsage },
      errorCount: conversation.metadata.errorCount,
      duration
    };
  }

  // Export conversation
  exportConversation(id: string): string | null {
    const conversation = this.conversations.get(id);
    if (!conversation) return null;

    return JSON.stringify(conversation, null, 2);
  }

  // Import conversation
  importConversation(data: string): boolean {
    try {
      const conversation: ConversationState = JSON.parse(data);
      
      // Validate conversation structure
      if (!conversation.id || !conversation.messages || !Array.isArray(conversation.messages)) {
        return false;
      }

      // Generate new ID to avoid conflicts
      conversation.id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      conversation.updatedAt = Date.now();

      this.conversations.set(conversation.id, conversation);
      this.saveToStorage();
      return true;
    } catch {
      return false;
    }
  }

  // Clean up old conversations
  private cleanupOldConversations(): void {
    if (this.conversations.size <= this.MAX_CONVERSATIONS) return;

    const conversations = Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);

    // Keep only the most recent conversations
    const toKeep = conversations.slice(0, this.MAX_CONVERSATIONS);
    this.conversations.clear();

    toKeep.forEach(conv => {
      this.conversations.set(conv.id, conv);
    });

    this.saveToStorage();
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      const data = {
        conversations: Array.from(this.conversations.entries()),
        currentConversationId: this.currentConversationId
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save conversations to storage:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return;

      const parsed = JSON.parse(data);
      
      if (parsed.conversations && Array.isArray(parsed.conversations)) {
        this.conversations = new Map(parsed.conversations);
      }
      
      if (parsed.currentConversationId) {
        this.currentConversationId = parsed.currentConversationId;
      }
    } catch (error) {
      console.error('Failed to load conversations from storage:', error);
    }
  }

  // Convert ChatMessage to ConversationMessage
  static convertChatMessage(chatMessage: ChatMessage): ConversationMessage {
    return {
      role: chatMessage.role,
      content: chatMessage.content,
      timestamp: chatMessage.timestamp.getTime(),
      toolCalls: chatMessage.toolCalls?.map(tc => ({
        name: tc.name,
        arguments: tc.arguments,
        result: tc.result
      }))
    };
  }

  // Convert ConversationMessage to ChatMessage (excludes system messages)
  static convertToChatMessage(conversationMessage: ConversationMessage): ChatMessage | null {
    // Skip system messages as ChatMessage only supports 'user' | 'assistant'
    if (conversationMessage.role === 'system') {
      return null;
    }
    
    return {
      id: `msg_${conversationMessage.timestamp}`,
      role: conversationMessage.role as 'user' | 'assistant',
      content: conversationMessage.content,
      timestamp: new Date(conversationMessage.timestamp),
      toolCalls: conversationMessage.toolCalls?.map(tc => ({
        id: `tc_${conversationMessage.timestamp}`,
        name: tc.name,
        arguments: tc.arguments,
        result: tc.result
      }))
    };
  }
}

// Export singleton instance
export const conversationStateService = new ConversationStateService();
