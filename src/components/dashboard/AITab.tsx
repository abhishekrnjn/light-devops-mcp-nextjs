'use client';

import { useState, useRef, useEffect } from 'react';
import { useJWT } from '@/hooks/useJWT';
import { useMCPConnection } from '@/hooks/useMCPConnection';
import { usePermissions } from '@/hooks/usePermissions';
import { ChatMessage } from '@/types/ai';

export const AITab = () => {
  const { token } = useJWT();
  const { mcpService, resources, tools } = useMCPConnection();
  const { permissions } = usePermissions();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (!input.trim() || !token) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create context about available tools and permissions
      const context = {
        availableResources: safeResources.map(r => r.name),
        availableTools: safeTools.map(t => t.name),
        userPermissions: permissions,
        mcpServerUrl: process.env.NEXT_PUBLIC_MCP_SERVER_URL,
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
          context,
          history: messages.slice(-10), // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        toolCalls: data.toolCalls,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Execute tool calls if any
      if (data.toolCalls && data.toolCalls.length > 0) {
        await executeToolCalls(data.toolCalls);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeToolCalls = async (toolCalls: { name: string; arguments: Record<string, unknown> }[]) => {
    for (const toolCall of toolCalls) {
      try {
        let result;
        switch (toolCall.name) {
          case 'get_logs':
            result = await mcpService.getLogs(token!, toolCall.arguments.level as string, toolCall.arguments.limit as number);
            break;
          case 'get_metrics':
            result = await mcpService.getMetrics(token!, toolCall.arguments.limit as number);
            break;
          case 'deploy_service':
            result = await mcpService.deployService(
              token!,
              toolCall.arguments.service_name as string,
              toolCall.arguments.version as string,
              toolCall.arguments.environment as string
            );
            break;
          case 'rollback_deployment':
            result = await mcpService.rollbackDeployment(
              token!,
              toolCall.arguments.deployment_id as string,
              toolCall.arguments.reason as string
            );
            break;
          default:
            result = { success: false, error: 'Unknown tool' };
        }

        const toolResultMessage: ChatMessage = {
          id: `tool-${Date.now()}`,
          role: 'assistant',
          content: `Tool ${toolCall.name} executed: ${JSON.stringify(result, null, 2)}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, toolResultMessage]);
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: `tool-error-${Date.now()}`,
          role: 'assistant',
          content: `Tool ${toolCall.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">AI Assistant</h3>
      
      <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🤖</div>
            <p>Ask me anything about your DevOps operations!</p>
            <p className="text-sm mt-2">I can help you with logs, metrics, deployments, and more.</p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
              <h4 className="font-semibold text-blue-800 mb-2">Your Available Operations:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {safeResources.map((resource, index) => (
                  <li key={index}>• {resource.name}: {resource.description}</li>
                ))}
                {safeTools.map((tool, index) => (
                  <li key={index}>• {tool.name}: {tool.description}</li>
                ))}
                {safeResources.length === 0 && safeTools.length === 0 && (
                  <li>• Loading available operations...</li>
                )}
              </ul>
            </div>
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
                      : 'bg-white text-gray-800 border'
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
                <div className="bg-white text-gray-800 border px-4 py-2 rounded-lg">
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

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about logs, metrics, deployments..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};
