'use client';

import { useState, useRef, useEffect } from 'react';
import { useJWT } from '@/hooks/useJWT';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { usePermissions } from '@/hooks/usePermissions';
import { useChatContext } from '@/contexts/ChatContext';
import { ChatMessage } from '@/types/ai';
import { parseError } from '@/utils/errorHandler';

export const AITab = () => {
  const { token } = useJWT();
  const { resources, tools, isConnected } = useMCPConnection();
  const { permissions, hasPermission } = usePermissions();
  const { messages, setMessages, setConversationHistory, clearConversation } = useChatContext();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get permission states
  const canReadLogs = hasPermission('read_logs');
  const canReadMetrics = hasPermission('read_metrics');
  const canDeployStaging = hasPermission('deploy_staging');
  const canDeployProduction = hasPermission('deploy_production');
  const canRollbackStaging = hasPermission('rollback_staging');
  const canRollbackProduction = hasPermission('rollback_production');

  // Ensure resources and tools are arrays
  const safeResources = Array.isArray(resources) ? resources : [];
  const safeTools = Array.isArray(tools) ? tools : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !token || !isConnected) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setFollowUpQuestions([]);

    try {
      // Create context about available tools and permissions
      const context = {
        availableResources: safeResources.map(r => r.name),
        availableTools: safeTools.map(t => t.name),
        userPermissions: permissions,
        mcpServerUrl: process.env.NEXT_PUBLIC_MCP_SERVER_URL,
        userId: token, // Pass token as userId for now
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          context,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      
      // Handle errors from the API
      if (data.error) {
        setError(data.error);
        setErrorCode(data.errorCode);
        
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${data.error}${data.errorCode ? ` (Code: ${data.errorCode})` : ''}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      // Update conversation ID if provided
      if (data.conversationId) {
        setCurrentConversationId(data.conversationId);
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        toolCalls: data.toolCalls,
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update conversation history for continuity
      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory);
      }

      // Display tool results if any
      if (data.toolResults && data.toolResults.length > 0) {
        data.toolResults.forEach((toolResult: { content: string }, index: number) => {
          const toolResultMessage: ChatMessage = {
            id: `tool-result-${Date.now()}-${index}`,
            role: 'assistant',
            content: `Tool Result: ${toolResult.content}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, toolResultMessage]);
        });
      }

      // Display follow-up questions if any
      if (data.followUpQuestions && data.followUpQuestions.length > 0) {
        setFollowUpQuestions(data.followUpQuestions);
      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${parseError(error)}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearConversation = () => {
    clearConversation();
    setInput('');
    setError(null);
    setErrorCode(null);
    setFollowUpQuestions([]);
    setCurrentConversationId(null);
  };

  const handleFollowUpClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Chat</h3>
        {currentConversationId && (
          <span className="text-xs text-slate-500">
            Conversation: {currentConversationId.slice(-8)}
          </span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <div className="text-red-500">⚠️</div>
            <div className="flex-1">
              <p className="text-red-800 text-sm font-medium">{error}</p>
              {errorCode && (
                <p className="text-red-600 text-xs mt-1">Error Code: {errorCode}</p>
              )}
            </div>
            <button
              onClick={() => {
                setError(null);
                setErrorCode(null);
              }}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-slate-600 py-8">
            <div className="text-4xl mb-2">🤖</div>
            <p>Ask me anything about your DevOps operations!</p>
            <p className="text-sm mt-2">
              I can help you with
              {canReadLogs && ' logs'}
              {canReadLogs && (canReadMetrics || canDeployStaging || canDeployProduction || canRollbackStaging || canRollbackProduction) && ','}
              {canReadMetrics && ' metrics'}
              {canReadMetrics && (canDeployStaging || canDeployProduction || canRollbackStaging || canRollbackProduction) && ','}
              {(canDeployStaging || canDeployProduction) && ' deployments'}
              {(canDeployStaging || canDeployProduction) && (canRollbackStaging || canRollbackProduction) && ','}
              {(canRollbackStaging || canRollbackProduction) && ' rollbacks'}
              {(!canReadLogs && !canReadMetrics && !canDeployStaging && !canDeployProduction && !canRollbackStaging && !canRollbackProduction) && ' basic operations'}
              {' and more.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.content.startsWith('Error:')
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-white text-slate-800 border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.toolCalls && (
                    <div className="mt-2 text-xs opacity-75">
                      Tool calls: {message.toolCalls.map(tc => tc.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-800 border px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Follow-up Questions */}
      {followUpQuestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Suggestions:</h4>
          <div className="space-y-2">
            {followUpQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleFollowUpClick(question)}
                className="block w-full text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 p-2 rounded border border-blue-200 hover:border-blue-300 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Ask about logs, metrics, deployments..." : "MCP Server Offline - Chat unavailable"}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={isLoading || !isConnected}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading || !isConnected}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {!isConnected ? 'Offline' : 'Send'}
        </button>
        {messages.length > 0 && (
          <button
            onClick={handleClearConversation}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            title="Clear conversation"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
