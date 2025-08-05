import { Request, Response } from 'express';
import { DeviceManager } from '../services/DeviceManager';
import { AIService, AIMessage } from '../services/AIService';
import { logger } from '../config';

const formatMessagesForAI = (messages: any[], includeMetadata: boolean) => {
  return messages.map(msg => {
    const from = msg.fromMe ? 'Me' : msg.from.split('@')[0];
    let content = `${from}: ${msg.body}`;
    if (includeMetadata) {
      content += ` (timestamp: ${new Date(msg.timestamp * 1000).toISOString()}`;
      if (msg.isForwarded) content += ', forwarded';
      if (msg.hasQuotedMsg) content += ', replied';
      content += ')';
    }
    return content;
  }).join('\n');
};

const getAnalysisPrompt = (analysisType: string, customQuery?: string): string => {
  const basePrompt = `You are WhatsAppAnalyst, an AI assistant specialized in analyzing WhatsApp conversations. Always respond with a structured JSON format.`;
  
  // Handle custom queries
  if (analysisType === 'custom' && customQuery) {
    return `${basePrompt} Answer the following specific question about the conversation: "${customQuery}". 
    Provide your response in JSON format like this:
    {
      "query": "${customQuery}",
      "answer": "your detailed answer here",
      "supporting_evidence": ["specific examples from the conversation"],
      "confidence_level": "high/medium/low",
      "additional_insights": "any other relevant observations"
    }`;
  }
  
  switch (analysisType) {
    case 'sentiment':
      return `${basePrompt} Analyze the sentiment and emotional tone of the conversation. Return JSON with:
      {
        "overall_sentiment": "positive/negative/neutral",
        "sentiment_score": -1 to 1,
        "sentiment_breakdown": {
          "positive_messages": number,
          "negative_messages": number,
          "neutral_messages": number
        },
        "emotional_journey": ["sentiment changes over time"],
        "key_emotional_triggers": ["list of topics that caused sentiment shifts"]
      }`;
    
    case 'summary':
      return `${basePrompt} Provide a concise summary of the conversation. Return JSON with:
      {
        "main_topics": ["list of main discussion topics"],
        "conversation_purpose": "what was this conversation about",
        "key_decisions": ["decisions made or actions agreed upon"],
        "participants": ["who was involved"],
        "duration_analysis": "conversation flow and timing"
      }`;
    
    case 'issues':
      return `${basePrompt} Focus on identifying customer service issues and problems. Return JSON with:
      {
        "identified_issues": [{
          "issue": "description",
          "severity": "low/medium/high",
          "resolved": true/false,
          "resolution_quality": "poor/fair/good/excellent"
        }],
        "response_effectiveness": {
          "avg_response_time": "estimated",
          "completeness_score": 1-10,
          "helpfulness_score": 1-10
        },
        "missed_opportunities": ["what could have been handled better"]
      }`;
    
    default: // comprehensive
      return `${basePrompt} Provide a comprehensive analysis of this WhatsApp conversation. Return JSON with:
      {
        "conversation_summary": {
          "main_topics": ["list"],
          "purpose": "overall purpose",
          "outcome": "what was achieved"
        },
        "sentiment_analysis": {
          "overall_sentiment": "positive/negative/neutral",
          "sentiment_score": -1 to 1,
          "emotional_highlights": ["key emotional moments"]
        },
        "communication_quality": {
          "response_time_assessment": "fast/moderate/slow",
          "clarity_score": 1-10,
          "professionalism_score": 1-10
        },
        "issues_and_resolutions": {
          "problems_identified": ["list"],
          "resolution_success": true/false,
          "outstanding_issues": ["unresolved items"]
        },
        "improvement_suggestions": ["actionable recommendations"],
        "key_metrics": {
          "total_messages": number,
          "participants": number,
          "conversation_length": "estimated duration"
        }
      }`;
  }
};

export const getProviders = async (req: Request, res: Response): Promise<void> => {
  try {
    const aiService = AIService.getInstance();
    const providers = aiService.getAvailableProviders();
    const defaultProvider = process.env.AI_PROVIDER || 'openrouter';
    
    const providerInfo = providers.map(provider => aiService.getProviderInfo(provider));
    
    res.json({ 
      success: true, 
      data: {
        default: defaultProvider,
        available: providerInfo
      }
    });
  } catch (error) {
    logger.error('Error getting AI providers:', error);
    res.status(500).json({ success: false, error: 'Failed to get AI providers' });
  }
};

export const testProvider = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    const aiService = AIService.getInstance();
    
    const result = await aiService.testProvider(provider);
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error testing AI provider:', error);
    res.status(500).json({ success: false, error: 'Failed to test AI provider' });
  }
};

export const analyzeChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceManager = DeviceManager.getInstance();
    const device = deviceManager.getDevice(req.params.id);
    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    if (device.status !== 'ready') {
      res.status(400).json({ 
        success: false, 
        error: `Device is not ready. Current status: ${device.status}`,
        currentStatus: device.status
      });
      return;
    }

    const { messageLimit, analysisType, includeMetadata, provider, model, customQuery } = req.body;
    
    // Validate custom query requirement
    if (analysisType === 'custom' && !customQuery) {
      res.status(400).json({ 
        success: false, 
        error: 'customQuery is required when analysisType is "custom"' 
      });
      return;
    }
    
    const chat = await device.client.getChatById(req.params.chatId);
    const messages = await chat.fetchMessages({ limit: messageLimit });
    const formattedMessages = formatMessagesForAI(messages, includeMetadata);

    const aiService = AIService.getInstance();
    const aiMessages: AIMessage[] = [
      {
        role: 'system',
        content: getAnalysisPrompt(analysisType, customQuery)
      },
      {
        role: 'user',
        content: `Please analyze the following WhatsApp conversation:\n\n${formattedMessages}`
      }
    ];

    const response = await aiService.generateCompletion({
      messages: aiMessages,
      provider,
      model,
      temperature: 0
    });

    res.json({ success: true, data: response });

  } catch (error) {
    logger.error('Error analyzing chat:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze chat' });
  }
};
