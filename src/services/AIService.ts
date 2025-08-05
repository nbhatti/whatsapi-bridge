import axios from 'axios';
import { logger } from '../config';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  provider?: string;
}

export interface AIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  created?: number;
}

export interface AIProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  headers?: Record<string, string>;
}

export class AIService {
  private static instance: AIService;
  private providers: Map<string, AIProviderConfig> = new Map();

  private constructor() {
    this.initializeProviders();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private initializeProviders(): void {
    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.1'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });
    }

    // OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      this.providers.set('openrouter', {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: 'https://openrouter.ai/api/v1',
        model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.1'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://localhost:3000',
          'X-Title': process.env.OPENROUTER_APP_NAME || 'WhatsApp AI Analyzer'
        }
      });
    }

    // X.AI (Grok)
    if (process.env.X_API_KEY) {
      this.providers.set('xai', {
        apiKey: process.env.X_API_KEY,
        baseUrl: 'https://api.x.ai/v1',
        model: process.env.X_MODEL || 'grok-3-mini',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.1'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.X_API_KEY}`
        }
      });
    }

    // Custom provider (configurable via env vars)
    if (process.env.AI_API_KEY && process.env.AI_BASE_URL) {
      this.providers.set('custom', {
        apiKey: process.env.AI_API_KEY,
        baseUrl: process.env.AI_BASE_URL,
        model: process.env.AI_MODEL || 'default',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.1'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_API_KEY}`
        }
      });
    }

    logger.info(`Initialized AI providers: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  private getProvider(providerName?: string): AIProviderConfig {
    const defaultProvider = process.env.AI_PROVIDER || 'openrouter';
    const provider = providerName || defaultProvider;
    
    const config = this.providers.get(provider);
    if (!config) {
      const availableProviders = Array.from(this.providers.keys());
      throw new Error(`AI provider '${provider}' not configured. Available providers: ${availableProviders.join(', ')}`);
    }
    
    return config;
  }

  public async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const provider = this.getProvider(request.provider);
    
    const payload = {
      messages: request.messages,
      model: request.model || provider.model,
      max_tokens: request.max_tokens || provider.maxTokens,
      temperature: request.temperature !== undefined ? request.temperature : provider.temperature,
      stream: request.stream || false
    };

    try {
      const response = await axios.post<AIResponse>(
        `${provider.baseUrl}/chat/completions`,
        payload,
        {
          headers: provider.headers,
          timeout: 60000 // 60 second timeout
        }
      );

      logger.info(`AI completion successful - Provider: ${request.provider || process.env.AI_PROVIDER}, Model: ${payload.model}, Tokens: ${response.data.usage?.total_tokens || 'unknown'}`);
      
      return response.data;
    } catch (error: any) {
      logger.error('AI completion failed:', {
        provider: request.provider || process.env.AI_PROVIDER,
        model: payload.model,
        error: error.response?.data || error.message
      });
      throw new Error(`AI completion failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  public getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  public getProviderInfo(providerName?: string): { provider: string; model: string; available: boolean } {
    const defaultProvider = process.env.AI_PROVIDER || 'openrouter';
    const provider = providerName || defaultProvider;
    const config = this.providers.get(provider);
    
    return {
      provider,
      model: config?.model || 'unknown',
      available: !!config
    };
  }

  public async testProvider(providerName?: string): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const testRequest: AIRequest = {
        messages: [
          { role: 'system', content: 'You are a test assistant. Respond with exactly: "Test successful"' },
          { role: 'user', content: 'Test connection' }
        ],
        provider: providerName,
        max_tokens: 50,
        temperature: 0
      };

      const response = await this.generateCompletion(testRequest);
      const content = response.choices[0]?.message?.content?.trim();
      
      return {
        success: true,
        response: content
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
