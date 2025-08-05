# AI Chat Analysis Examples

This document provides examples of how to use the AI chat analysis feature to analyze WhatsApp conversations.

## Prerequisites

1. Configure your AI provider settings in the `.env` file:
   ```bash
   # Default AI provider (openrouter, openai, xai, custom)
   AI_PROVIDER=openrouter
   AI_MAX_TOKENS=4000
   AI_TEMPERATURE=0.1
   
   # OpenRouter (free tier available)
   OPENROUTER_API_KEY=your-openrouter-api-key
   OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
   OPENROUTER_SITE_URL=https://your-app.com
   OPENROUTER_APP_NAME=WhatsApp-AI-Analyzer
   
   # OpenAI
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o-mini
   
   # X.AI (Grok)
   X_API_KEY=your-x-ai-api-key
   X_MODEL=grok-3-mini
   
   # Custom provider
   AI_API_KEY=your-custom-api-key
   AI_BASE_URL=https://your-custom-api.com/v1
   AI_MODEL=your-model-name
   ```

2. Ensure your device is ready and authenticated.

## Basic Usage

### 1. Comprehensive Analysis (Default)

Analyze a chat with a comprehensive analysis including sentiment, issues, communication quality, and improvement suggestions:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key-123" \
  -d '{
    "messageLimit": 50,
    "analysisType": "comprehensive",
    "includeMetadata": true
  }' \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/{CHAT_ID}/analyze"
```

### 2. Sentiment Analysis Only

Focus specifically on sentiment and emotional tone:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key-123" \
  -d '{
    "messageLimit": 30,
    "analysisType": "sentiment",
    "includeMetadata": false
  }' \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/{CHAT_ID}/analyze"
```

### 3. Conversation Summary

Get a concise summary of the conversation:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key-123" \
  -d '{
    "messageLimit": 100,
    "analysisType": "summary",
    "includeMetadata": true
  }' \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/{CHAT_ID}/analyze"
```

### 4. Issues and Customer Service Analysis

Focus on identifying customer service issues and response quality:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key-123" \
  -d '{
    "messageLimit": 75,
    "analysisType": "issues",
    "includeMetadata": true
  }' \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/{CHAT_ID}/analyze"
```

### 5. Using Different AI Providers

Specify a different AI provider or model for analysis:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key-123" \
  -d '{
    "messageLimit": 50,
    "analysisType": "comprehensive",
    "includeMetadata": true,
    "provider": "openai",
    "model": "gpt-4o-mini"
  }' \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/{CHAT_ID}/analyze"
```

### 6. Custom Questions (NEW!)

Ask specific questions about the conversation using natural language:

```bash
# Ask about specific issues
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key-123" \
  -d '{
    "messageLimit": 50,
    "analysisType": "custom",
    "customQuery": "What specific technical issues were reported by users in this conversation?"
  }' \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/{CHAT_ID}/analyze"
```

```bash
# Ask about response patterns
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key-123" \
  -d '{
    "messageLimit": 100,
    "analysisType": "custom",
    "customQuery": "How quickly are users responding to messages? Are there any patterns in response times?"
  }' \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/{CHAT_ID}/analyze"
```

```bash
# Ask about user behavior
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-api-key-123" \
  -d '{
    "messageLimit": 75,
    "analysisType": "custom",
    "customQuery": "What are the most common complaints or concerns mentioned by customers?"
  }' \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/{CHAT_ID}/analyze"
```

## AI Provider Management

### Get Available Providers

Check which AI providers are configured and available:

```bash
curl -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/ai/providers"
```

Response:
```json
{
  "success": true,
  "data": {
    "default": "openrouter",
    "available": [
      {
        "provider": "openrouter",
        "model": "meta-llama/llama-3.1-8b-instruct:free",
        "available": true
      },
      {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "available": true
      },
      {
        "provider": "xai",
        "model": "grok-3-mini",
        "available": false
      }
    ]
  }
}
```

### Test Provider Connection

Test if a specific AI provider is working correctly:

```bash
curl -X POST \
  -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/ai/providers/openrouter/test"
```

Response:
```json
{
  "success": true,
  "data": {
    "success": true,
    "response": "Test successful"
  }
}
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `messageLimit` | integer | 100 | Number of recent messages to analyze (1-1000) |
| `analysisType` | string | "comprehensive" | Type of analysis: "comprehensive", "sentiment", "summary", "issues", "custom" |
| `includeMetadata` | boolean | true | Include message timestamps and metadata in analysis |
| `provider` | string | (from env) | AI provider to use: "openai", "openrouter", "xai", "custom" |
| `model` | string | (from provider config) | Specific model to use for analysis |
| `customQuery` | string | - | Required when analysisType is "custom". Your specific question about the chat (10-1000 chars) |

## Response Structure

### Comprehensive Analysis Response
```json
{
  "success": true,
  "data": {
    "choices": [{
      "message": {
        "content": "{
          \"conversation_summary\": {
            \"main_topics\": [\"Product inquiry\", \"Pricing discussion\"],
            \"purpose\": \"Customer seeking product information\",
            \"outcome\": \"Information provided, follow-up scheduled\"
          },
          \"sentiment_analysis\": {
            \"overall_sentiment\": \"positive\",
            \"sentiment_score\": 0.7,
            \"emotional_highlights\": [\"Initial confusion resolved\", \"Customer satisfaction improved\"]
          },
          \"communication_quality\": {
            \"response_time_assessment\": \"fast\",
            \"clarity_score\": 8,
            \"professionalism_score\": 9
          },
          \"issues_and_resolutions\": {
            \"problems_identified\": [\"Pricing confusion\"],
            \"resolution_success\": true,
            \"outstanding_issues\": []
          },
          \"improvement_suggestions\": [
            \"Consider providing pricing upfront\",
            \"Add FAQ links for common questions\"
          ],
          \"key_metrics\": {
            \"total_messages\": 15,
            \"participants\": 2,
            \"conversation_length\": \"approximately 30 minutes\"
          }
        }"
      }
    }]
  }
}
```

### Sentiment Analysis Response
```json
{
  "success": true,
  "data": {
    "choices": [{
      "message": {
        "content": "{
          \"overall_sentiment\": \"positive\",
          \"sentiment_score\": 0.6,
          \"sentiment_breakdown\": {
            \"positive_messages\": 8,
            \"negative_messages\": 2,
            \"neutral_messages\": 5
          },
          \"emotional_journey\": [
            \"Started neutral\",
            \"Became frustrated with pricing\",
            \"Resolved positively with explanation\"
          ],
          \"key_emotional_triggers\": [\"Pricing concerns\", \"Product availability\"]
        }"
      }
    }]
  }
}
```

### Custom Query Response
```json
{
  "success": true,
  "data": {
    "choices": [{
      "message": {
        "content": "{
          \"query\": \"What specific technical issues were reported by users?\",
          \"answer\": \"Users reported three main technical issues: 1) Login problems with the mobile app, 2) Payment gateway timeout errors, and 3) Slow loading times on the product catalog page.\",
          \"supporting_evidence\": [
            \"User123: Can't login to my account on the app\",
            \"CustomerX: Payment keeps failing with timeout error\",
            \"User456: Product page takes forever to load\"
          ],
          \"confidence_level\": \"high\",
          \"additional_insights\": \"All three issues seem to be related to server performance. Users are most frustrated with the payment gateway issue as it prevents purchases.\"
        }"
      }
    }]
  }
}
```

## Use Cases

### Customer Service Analytics
- **Monitor support quality**: Track response times and resolution effectiveness
- **Identify training needs**: Find common issues that agents struggle with
- **Improve customer satisfaction**: Detect negative sentiment early and improve processes

### Business Intelligence
- **Conversation insights**: Understand what customers discuss most
- **Product feedback**: Extract opinions about products and services
- **Communication patterns**: Analyze how different conversation flows affect outcomes

### Quality Assurance
- **Response evaluation**: Score agent performance automatically
- **Missed opportunities**: Find unanswered questions or unaddressed concerns
- **Best practice identification**: Learn from high-performing conversations

## Error Handling

Common errors and solutions:

### X_API_KEY not configured
```json
{
  "success": false,
  "error": "X_API_KEY not configured"
}
```
**Solution**: Add your X.AI API key to the `.env` file.

### Device not ready
```json
{
  "success": false,
  "error": "Device is not ready. Current status: qr",
  "currentStatus": "qr"
}
```
**Solution**: Ensure your WhatsApp device is authenticated and ready.

### Chat not found
```json
{
  "success": false,
  "error": "Failed to analyze chat"
}
```
**Solution**: Verify the chat ID exists and is accessible.

## Rate Limiting and Best Practices

1. **API Limits**: Be mindful of X.AI API rate limits
2. **Message Limits**: Start with smaller message limits (50-100) for faster responses
3. **Metadata**: Include metadata for more detailed analysis, exclude for faster processing
4. **Analysis Type**: Use specific analysis types when you only need certain insights
5. **Caching**: Consider caching results for frequently analyzed chats

## Integration Examples

### Node.js Integration
```javascript
const analyzeChat = async (deviceId, chatId, options = {}) => {
  const response = await fetch(`http://localhost:3000/api/v1/devices/${deviceId}/chats/${chatId}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'test-api-key-123'
    },
    body: JSON.stringify({
      messageLimit: 50,
      analysisType: 'comprehensive',
      includeMetadata: true,
      ...options
    })
  });
  
  return response.json();
};
```

### Python Integration
```python
import requests

def analyze_chat(device_id, chat_id, **options):
    payload = {
        'messageLimit': 50,
        'analysisType': 'comprehensive',
        'includeMetadata': True,
        **options
    }
    
    response = requests.post(
        f'http://localhost:3000/api/v1/devices/{device_id}/chats/{chat_id}/analyze',
        headers={
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key-123'
        },
        json=payload
    )
    
    return response.json()
```
