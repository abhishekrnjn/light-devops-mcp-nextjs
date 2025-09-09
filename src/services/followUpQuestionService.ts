import { toolDiscoveryService, ToolMetadata } from './toolDiscoveryService';
import { errorHandlingService } from './errorHandlingService';

export interface FollowUpQuestion {
  id: string;
  question: string;
  parameter: string;
  toolName: string;
  type: 'missing_required' | 'clarification' | 'validation_error' | 'suggestion';
  priority: 'high' | 'medium' | 'low';
  suggestions?: string[];
  examples?: string[];
}

export interface QuestionContext {
  toolName: string;
  providedParameters: Record<string, unknown>;
  userInput: string;
  conversationHistory: string[];
  userPermissions: Record<string, boolean>;
}

export class FollowUpQuestionService {
  private questionTemplates: Record<string, (context: QuestionContext) => string> = {
    missing_required: (context) => {
      const tool = toolDiscoveryService.getToolMetadata(context.toolName);
      if (!tool) return 'Please provide the required information.';
      
      const missingParams = tool.parameters.filter(param => 
        param.required && !(param.name in context.providedParameters)
      );
      
      if (missingParams.length === 1) {
        const param = missingParams[0];
        let question = `What ${param.name} would you like to use?`;
        
        if (param.enum) {
          question += ` (Options: ${param.enum.join(', ')})`;
        }
        
        if (param.example) {
          question += ` (Example: ${param.example})`;
        }
        
        return question;
      } else {
        return `Please provide the following required information: ${missingParams.map(p => p.name).join(', ')}`;
      }
    },
    
    clarification: (context) => {
      return `Could you clarify what you'd like to do with ${context.toolName}?`;
    },
    
    validation_error: (context) => {
      return `There seems to be an issue with the provided information. Could you please check and correct it?`;
    },
    
    suggestion: (context) => {
      return `Here are some suggestions for using ${context.toolName}:`;
    }
  };

  // Generate follow-up questions based on context
  generateFollowUpQuestions(context: QuestionContext): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];
    const tool = toolDiscoveryService.getToolMetadata(context.toolName);
    
    if (!tool) {
      return [{
        id: `unknown_tool_${Date.now()}`,
        question: 'I\'m not familiar with that tool. Could you clarify what you\'d like to do?',
        parameter: 'unknown',
        toolName: context.toolName,
        type: 'clarification',
        priority: 'high'
      }];
    }

    // Check for missing required parameters
    const missingRequired = tool.parameters.filter(param => 
      param.required && !(param.name in context.providedParameters)
    );

    if (missingRequired.length > 0) {
      missingRequired.forEach((param, index) => {
        const question = this.generateParameterQuestion(param, context);
        questions.push({
          id: `missing_${param.name}_${Date.now()}_${index}`,
          question,
          parameter: param.name,
          toolName: context.toolName,
          type: 'missing_required',
          priority: 'high',
          suggestions: param.enum,
          examples: param.example ? [param.example] : undefined
        });
      });
    }

    // Check for validation errors
    const validation = toolDiscoveryService.validateToolParameters(context.toolName, context.providedParameters);
    if (!validation.valid) {
      validation.errors.forEach((error, index) => {
        questions.push({
          id: `validation_${Date.now()}_${index}`,
          question: `Validation error: ${error}`,
          parameter: 'validation',
          toolName: context.toolName,
          type: 'validation_error',
          priority: 'high'
        });
      });
    }

    // Generate suggestions if no errors
    if (validation.valid && missingRequired.length === 0) {
      const suggestions = this.generateToolSuggestions(tool, context);
      if (suggestions.length > 0) {
        questions.push({
          id: `suggestions_${Date.now()}`,
          question: `Here are some suggestions for using ${context.toolName}:`,
          parameter: 'suggestions',
          toolName: context.toolName,
          type: 'suggestion',
          priority: 'low',
          suggestions
        });
      }
    }

    return questions;
  }

  // Generate a specific parameter question
  private generateParameterQuestion(param: { name: string; description?: string; enum?: string[]; example?: string; pattern?: string; type: string; minimum?: number; maximum?: number }, context: QuestionContext): string {
    let question = `What ${param.name} would you like to use?`;
    
    // Add description if available
    if (param.description) {
      question = `${param.description}. ${question}`;
    }
    
    // Add enum options
    if (param.enum && param.enum.length > 0) {
      question += `\n\nAvailable options: ${param.enum.join(', ')}`;
    }
    
    // Add example
    if (param.example) {
      question += `\n\nExample: ${param.example}`;
    }
    
    // Add format requirements
    if (param.pattern) {
      question += `\n\nFormat: ${param.pattern}`;
    }
    
    // Add range requirements
    if (param.type === 'number') {
      if (param.minimum !== undefined && param.maximum !== undefined) {
        question += `\n\nRange: ${param.minimum} to ${param.maximum}`;
      } else if (param.minimum !== undefined) {
        question += `\n\nMinimum: ${param.minimum}`;
      } else if (param.maximum !== undefined) {
        question += `\n\nMaximum: ${param.maximum}`;
      }
    }
    
    return question;
  }

  // Generate tool suggestions
  private generateToolSuggestions(tool: ToolMetadata, context: QuestionContext): string[] {
    const suggestions: string[] = [];
    
    // Add basic usage examples
    tool.examples.forEach(example => {
      suggestions.push(`${example.description}: ${JSON.stringify(example.input)}`);
    });
    
    // Add parameter-specific suggestions
    tool.parameters.forEach(param => {
      if (param.enum && param.enum.length > 0) {
        suggestions.push(`${param.name} options: ${param.enum.join(', ')}`);
      }
    });
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  // Generate contextual questions based on user input
  generateContextualQuestions(userInput: string, availableTools: ToolMetadata[]): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = [];
    const input = userInput.toLowerCase();
    
    // Check if user is asking about specific tools
    const mentionedTools = availableTools.filter(tool => 
      input.includes(tool.name.toLowerCase()) || 
      input.includes(tool.category.toLowerCase())
    );
    
    if (mentionedTools.length === 0) {
      // No specific tool mentioned, suggest tools based on keywords
      const keywordMatches = this.findToolsByKeywords(input, availableTools);
      if (keywordMatches.length > 0) {
        questions.push({
          id: `suggest_tools_${Date.now()}`,
          question: `I can help you with: ${keywordMatches.map(t => t.name).join(', ')}. What would you like to do?`,
          parameter: 'tool_selection',
          toolName: 'general',
          type: 'suggestion',
          priority: 'medium',
          suggestions: keywordMatches.map(t => t.name)
        });
      }
    } else {
      // Specific tool mentioned, generate parameter questions
      mentionedTools.forEach(tool => {
        const context: QuestionContext = {
          toolName: tool.name,
          providedParameters: {},
          userInput,
          conversationHistory: [],
          userPermissions: {}
        };
        
        const toolQuestions = this.generateFollowUpQuestions(context);
        questions.push(...toolQuestions);
      });
    }
    
    return questions;
  }

  // Find tools by keywords in user input
  private findToolsByKeywords(input: string, tools: ToolMetadata[]): ToolMetadata[] {
    const keywords = {
      'logs': ['log', 'logs', 'logging', 'error', 'debug', 'warning', 'info'],
      'metrics': ['metric', 'metrics', 'performance', 'monitoring', 'stats', 'statistics'],
      'deployment': ['deploy', 'deployment', 'release', 'version', 'staging', 'production'],
      'rollback': ['rollback', 'revert', 'undo', 'back', 'previous']
    };
    
    const matches: ToolMetadata[] = [];
    
    Object.entries(keywords).forEach(([category, words]) => {
      if (words.some(word => input.includes(word))) {
        const categoryTools = tools.filter(tool => tool.category === category);
        matches.push(...categoryTools);
      }
    });
    
    return matches.slice(0, 3); // Limit to 3 matches
  }

  // Format questions for display
  formatQuestionsForDisplay(questions: FollowUpQuestion[]): string[] {
    return questions.map(q => {
      let formatted = q.question;
      
      if (q.suggestions && q.suggestions.length > 0) {
        formatted += `\n\nSuggestions:\n${q.suggestions.map(s => `• ${s}`).join('\n')}`;
      }
      
      if (q.examples && q.examples.length > 0) {
        formatted += `\n\nExamples:\n${q.examples.map(e => `• ${e}`).join('\n')}`;
      }
      
      return formatted;
    });
  }

  // Get quick response suggestions
  getQuickResponseSuggestions(toolName: string, parameter: string): string[] {
    const tool = toolDiscoveryService.getToolMetadata(toolName);
    if (!tool) return [];
    
    const param = tool.parameters.find(p => p.name === parameter);
    if (!param) return [];
    
    const suggestions: string[] = [];
    
    if (param.enum) {
      suggestions.push(...param.enum);
    }
    
    if (param.example) {
      suggestions.push(param.example);
    }
    
    // Add common values based on parameter type
    switch (param.name) {
      case 'level':
        suggestions.push('error', 'warning', 'info', 'debug');
        break;
      case 'environment':
        suggestions.push('staging', 'production');
        break;
      case 'limit':
        suggestions.push('10', '50', '100');
        break;
    }
    
    return [...new Set(suggestions)]; // Remove duplicates
  }

  // Check if user input answers a follow-up question
  checkIfQuestionAnswered(question: FollowUpQuestion, userInput: string): boolean {
    const input = userInput.toLowerCase();
    
    // Check if user provided the required parameter
    if (question.type === 'missing_required') {
      // Simple check - could be enhanced with NLP
      return input.length > 0 && !input.includes('?');
    }
    
    // Check if user is asking for clarification
    if (question.type === 'clarification') {
      return input.includes('yes') || input.includes('no') || input.length > 10;
    }
    
    return false;
  }
}

// Export singleton instance
export const followUpQuestionService = new FollowUpQuestionService();
