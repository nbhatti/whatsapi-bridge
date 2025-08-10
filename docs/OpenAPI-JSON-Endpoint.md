# OpenAPI JSON Endpoint Documentation

## 🎯 Overview

The `/docs-json` endpoint serves the complete OpenAPI/Swagger specification in JSON format, enabling programmatic access to your API documentation. This is essential for automation, code generation, testing, and integration with various tools.

## 🔗 Endpoint Details

### Base URL
```
GET http://localhost:3000/docs-json
```

### Response Format
- **Content-Type**: `application/json`
- **CORS**: Enabled for cross-origin access
- **Format**: OpenAPI 3.0.0 specification

### Includes WebSocket Documentation
- Tag: `WebSocket`
- Informational paths for Socket.IO gateway:
  - `GET /ws` (handshake metadata)
  - `GET /ws/device/{deviceId}` (namespace info)
- Schemas for real-time payloads: `DeviceStatePayload`, `DeviceQRPayload`, `DeviceReadyPayload`, `DeviceAuthenticatedPayload`, `MessageReceivedPayload`, `DeviceDisconnectedPayload`

### Headers Included
```http
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
```

## 🚀 Use Cases

### 1. **Code Generation**
Generate client SDKs in various programming languages:

```bash
# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:3000/docs-json \
  -g python \
  -o ./python-client

# Generate JavaScript/TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3000/docs-json \
  -g typescript-axios \
  -o ./typescript-client

# Generate Java client
openapi-generator-cli generate \
  -i http://localhost:3000/docs-json \
  -g java \
  -o ./java-client
```

### 2. **API Testing & Validation**
Use the spec for automated testing:

```bash
# Validate API responses against schema
npm install -g swagger-tools
swagger-tools validate http://localhost:3000/docs-json

# Run contract tests
dredd http://localhost:3000/docs-json http://localhost:3000
```

### 3. **Documentation Processing**
Convert to other documentation formats:

```bash
# Generate static HTML documentation
redoc-cli build http://localhost:3000/docs-json

# Generate markdown documentation
swagger-codegen generate \
  -i http://localhost:3000/docs-json \
  -l dynamic-html \
  -o ./api-docs
```

### 4. **API Mocking**
Create mock servers for development:

```bash
# Start a mock server
npx @stoplight/prism mock http://localhost:3000/docs-json

# Use with Postman
# Import http://localhost:3000/docs-json into Postman
```

## 🛠 Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Fetch the OpenAPI specification
async function getApiSpec() {
  try {
    const response = await axios.get('http://localhost:3000/docs-json');
    const spec = response.data;
    
    console.log('API Title:', spec.info.title);
    console.log('API Version:', spec.info.version);
    console.log('Available endpoints:', Object.keys(spec.paths));
    
    return spec;
  } catch (error) {
    console.error('Error fetching API spec:', error.message);
  }
}

// Extract all endpoints with their methods
function getEndpoints(spec) {
  const endpoints = [];
  
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, details] of Object.entries(methods)) {
      if (typeof details === 'object' && details.summary) {
        endpoints.push({
          method: method.toUpperCase(),
          path: path,
          summary: details.summary,
          tags: details.tags || []
        });
      }
    }
  }
  
  return endpoints;
}

// Usage
getApiSpec().then(spec => {
  if (spec) {
    const endpoints = getEndpoints(spec);
    console.log(`Found ${endpoints.length} endpoints`);
    
    // Filter media endpoints
    const mediaEndpoints = endpoints.filter(ep => 
      ep.tags.includes('Media') || ep.path.includes('/media/')
    );
    console.log(`Media endpoints: ${mediaEndpoints.length}`);
  }
});
```

### Python
```python
import requests
import json

# Fetch API specification
def get_api_spec():
    try:
        response = requests.get('http://localhost:3000/docs-json')
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching API spec: {e}")
        return None

# Analyze endpoints
def analyze_endpoints(spec):
    if not spec or 'paths' not in spec:
        return
    
    endpoints = []
    for path, methods in spec['paths'].items():
        for method, details in methods.items():
            if isinstance(details, dict) and 'summary' in details:
                endpoints.append({
                    'method': method.upper(),
                    'path': path,
                    'summary': details.get('summary', ''),
                    'tags': details.get('tags', [])
                })
    
    print(f"Total endpoints: {len(endpoints)}")
    
    # Group by tags
    by_tags = {}
    for endpoint in endpoints:
        for tag in endpoint['tags']:
            if tag not in by_tags:
                by_tags[tag] = []
            by_tags[tag].append(endpoint)
    
    for tag, eps in by_tags.items():
        print(f"{tag}: {len(eps)} endpoints")

# Usage
spec = get_api_spec()
if spec:
    print(f"API: {spec['info']['title']} v{spec['info']['version']}")
    analyze_endpoints(spec)
```

### cURL Examples
```bash
# Basic fetch
curl -H "Accept: application/json" \
     http://localhost:3000/docs-json

# Save to file
curl -H "Accept: application/json" \
     http://localhost:3000/docs-json \
     -o api-spec.json

# Pretty print with jq
curl -s http://localhost:3000/docs-json | jq .

# Extract specific information
curl -s http://localhost:3000/docs-json | jq '.info'
curl -s http://localhost:3000/docs-json | jq '.paths | keys'
curl -s http://localhost:3000/docs-json | jq '.components.schemas | keys'
```

## 📊 Specification Structure

The JSON response includes:

### Basic Information
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "WhatsApp Unified API",
    "version": "2.0.0",
    "description": "A powerful, unified WhatsApp API wrapper...",
    "contact": {...},
    "license": {...}
  }
}
```

### Server Configuration
```json
{
  "servers": [
    {
      "url": "/api",
      "description": "Development server"
    }
  ]
}
```

### API Endpoints
```json
{
  "paths": {
    "/v1/devices/{id}/messages/{messageId}/media/download": {
      "get": {
        "summary": "Download media from a message",
        "tags": ["Media"],
        "parameters": [...],
        "responses": {...}
      }
    }
  }
}
```

### Data Schemas
```json
{
  "components": {
    "schemas": {
      "EnhancedMessage": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "mediaInfo": {"$ref": "#/components/schemas/MediaInfo"}
        }
      },
      "MediaInfo": {...}
    }
  }
}
```

## 🔧 Development Tools

### Swagger Editor
1. Go to https://editor.swagger.io/
2. Click "File" > "Import URL"
3. Enter: `http://localhost:3000/docs-json`
4. Edit and validate your API specification

### Postman Integration
1. Open Postman
2. Click "Import"
3. Select "Link" tab
4. Enter: `http://localhost:3000/docs-json`
5. Click "Continue" and "Import"

### Insomnia Integration
1. Open Insomnia
2. Click "Create" > "Import from URL"
3. Enter: `http://localhost:3000/docs-json`
4. Click "Fetch and Import"

## 📋 Validation & Quality Checks

### Validate Specification
```bash
# Install swagger-tools
npm install -g swagger-tools

# Validate the spec
swagger-tools validate http://localhost:3000/docs-json

# Check for best practices
spectral lint http://localhost:3000/docs-json
```

### Extract Metrics
```bash
# Count endpoints by method
curl -s http://localhost:3000/docs-json | \
  jq '[.paths | to_entries[] | .value | keys[]] | group_by(.) | map({method: .[0], count: length})'

# List all schemas
curl -s http://localhost:3000/docs-json | \
  jq '.components.schemas | keys'

# Count endpoints by tag
curl -s http://localhost:3000/docs-json | \
  jq '[.paths | to_entries[] | .value | to_entries[] | .value.tags[]?] | group_by(.) | map({tag: .[0], count: length})'
```

## 🚦 Error Handling

The endpoint may return these HTTP status codes:

- **200 OK**: Specification returned successfully
- **500 Internal Server Error**: Error generating specification
- **503 Service Unavailable**: Server not ready

Example error handling:
```javascript
try {
  const response = await fetch('http://localhost:3000/docs-json');
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const spec = await response.json();
  // Process specification
} catch (error) {
  console.error('Failed to fetch API specification:', error.message);
}
```

## 🔄 Updates and Versioning

The specification is dynamically generated from your route definitions and schemas. To get the latest version:

1. **Restart the server** to pick up code changes
2. **Fetch the endpoint again** - it's always current
3. **Use the update script**: `npm run swagger:update`

## 💡 Best Practices

1. **Cache the specification** for better performance in production
2. **Version control the spec** by saving periodic snapshots
3. **Validate changes** before deploying updates
4. **Use in CI/CD** for automated testing and documentation
5. **Monitor for breaking changes** in your API evolution

The `/docs-json` endpoint is now available and provides complete programmatic access to your enhanced WhatsApp API documentation! 🎉
