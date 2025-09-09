import toolsConfig from './tools-config.json';

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  missingParameters: string[];
  followUpQuestions: string[];
  errors: string[];
}

export class ToolValidator {
  private static tools = toolsConfig.tools;

  static validateToolCall(toolCall: ToolCall): ValidationResult {
    const tool = this.tools.find(t => t.name === toolCall.name);
    
    if (!tool) {
      return {
        isValid: false,
        missingParameters: [],
        followUpQuestions: [],
        errors: [`Unknown tool: ${toolCall.name}`]
      };
    }

    const missingParameters: string[] = [];
    const followUpQuestions: string[] = [];
    const errors: string[] = [];

    // Check required parameters
    for (const param of tool.required_parameters) {
      if (!toolCall.arguments[param] || toolCall.arguments[param] === '') {
        missingParameters.push(param);
        if (tool.follow_up_questions[param]) {
          followUpQuestions.push(tool.follow_up_questions[param]);
        }
      }
    }

    // Validate parameter values
    for (const [paramName, value] of Object.entries(toolCall.arguments)) {
      const validationRule = tool.validation_rules?.[paramName];
      if (validationRule) {
        const validationError = this.validateParameter(paramName, value, validationRule);
        if (validationError) {
          errors.push(validationError);
        }
      }
    }

    const isValid = missingParameters.length === 0 && errors.length === 0;

    return {
      isValid,
      missingParameters,
      followUpQuestions,
      errors
    };
  }

  private static validateParameter(paramName: string, value: any, rule: any): string | null {
    if (rule.type === 'enum' && rule.values) {
      if (!rule.values.includes(value)) {
        return `${paramName} must be one of: ${rule.values.join(', ')}`;
      }
    }

    if (rule.type === 'integer') {
      const numValue = parseInt(value);
      if (isNaN(numValue)) {
        return `${paramName} must be a valid integer`;
      }
      if (rule.min !== undefined && numValue < rule.min) {
        return `${paramName} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && numValue > rule.max) {
        return `${paramName} must be at most ${rule.max}`;
      }
    }

    return null;
  }

  static getToolByName(name: string) {
    return this.tools.find(t => t.name === name);
  }

  static getAllTools() {
    return this.tools;
  }

  static generateFollowUpMessage(toolName: string, missingParams: string[]): string {
    const tool = this.getToolByName(toolName);
    if (!tool) return '';

    const questions = missingParams
      .map(param => tool.follow_up_questions[param])
      .filter(Boolean);

    if (questions.length === 0) return '';

    if (questions.length === 1) {
      return questions[0];
    }

    return `I need a few more details:\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  }
}
