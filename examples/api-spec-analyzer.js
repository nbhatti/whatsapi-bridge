#!/usr/bin/env node

/**
 * API Specification Analyzer
 * 
 * This example demonstrates how to use the /docs-json endpoint
 * to programmatically analyze your WhatsApp API specification.
 * 
 * Usage:
 *   node examples/api-spec-analyzer.js
 * 
 * Prerequisites:
 *   1. Start the API server: npm run dev
 *   2. Ensure axios is installed: npm install axios
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';
const DOCS_JSON_URL = `${API_BASE}/docs-json`;

/**
 * Fetch the complete API specification
 */
async function fetchApiSpec() {
  try {
    console.log('📡 Fetching API specification...');
    const response = await axios.get(DOCS_JSON_URL, {
      headers: { 'Accept': 'application/json' }
    });
    
    console.log('✅ API specification retrieved successfully');
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server not running. Start with: npm run dev');
    } else {
      console.error('❌ Error fetching API spec:', error.message);
    }
    return null;
  }
}

/**
 * Analyze basic API information
 */
function analyzeApiInfo(spec) {
  console.log('\n📊 API Information:');
  console.log(`   Title: ${spec.info.title}`);
  console.log(`   Version: ${spec.info.version}`);
  console.log(`   Description: ${spec.info.description.substring(0, 100)}...`);
  
  if (spec.info.contact) {
    console.log(`   Contact: ${spec.info.contact.email || 'N/A'}`);
  }
  
  if (spec.servers && spec.servers.length > 0) {
    console.log(`   Server: ${spec.servers[0].url} (${spec.servers[0].description})`);
  }
}

/**
 * Extract and analyze all endpoints
 */
function analyzeEndpoints(spec) {
  console.log('\n🔗 Endpoint Analysis:');
  
  const endpoints = [];
  const methods = {};
  const tags = {};
  
  for (const [path, pathInfo] of Object.entries(spec.paths)) {
    for (const [method, details] of Object.entries(pathInfo)) {
      if (typeof details === 'object' && details.summary) {
        const endpoint = {
          method: method.toUpperCase(),
          path: path,
          summary: details.summary,
          tags: details.tags || [],
          parameters: details.parameters || [],
          hasRequestBody: !!details.requestBody,
          operationId: details.operationId || null
        };
        
        endpoints.push(endpoint);
        
        // Count methods
        methods[endpoint.method] = (methods[endpoint.method] || 0) + 1;
        
        // Count tags
        endpoint.tags.forEach(tag => {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      }
    }
  }
  
  console.log(`   Total Endpoints: ${endpoints.length}`);
  
  // Show methods breakdown
  console.log('\n   📋 HTTP Methods:');
  Object.entries(methods)
    .sort(([,a], [,b]) => b - a)
    .forEach(([method, count]) => {
      console.log(`      ${method}: ${count}`);
    });
  
  // Show tags breakdown
  console.log('\n   🏷️  Tags:');
  Object.entries(tags)
    .sort(([,a], [,b]) => b - a)
    .forEach(([tag, count]) => {
      console.log(`      ${tag}: ${count} endpoints`);
    });
  
  return endpoints;
}

/**
 * Analyze media-specific endpoints
 */
function analyzeMediaEndpoints(endpoints) {
  console.log('\n📎 Media Endpoints Analysis:');
  
  const mediaEndpoints = endpoints.filter(ep => 
    ep.tags.includes('Media') || 
    ep.path.includes('/media/') ||
    ep.summary.toLowerCase().includes('media')
  );
  
  console.log(`   Media-related endpoints: ${mediaEndpoints.length}`);
  
  mediaEndpoints.forEach(ep => {
    console.log(`      ${ep.method} ${ep.path}`);
    console.log(`         ${ep.summary}`);
  });
  
  return mediaEndpoints;
}

/**
 * Analyze enhanced message endpoints
 */
function analyzeEnhancedEndpoints(endpoints) {
  console.log('\n💫 Enhanced Message Endpoints:');
  
  const enhancedEndpoints = endpoints.filter(ep => 
    (ep.tags.includes('Messages') || ep.tags.includes('Chats')) &&
    (ep.path.includes('/messages') || ep.path.includes('/chats'))
  );
  
  console.log(`   Enhanced message endpoints: ${enhancedEndpoints.length}`);
  
  enhancedEndpoints.forEach(ep => {
    if (ep.summary.toLowerCase().includes('enhanced') || 
        ep.summary.toLowerCase().includes('media') ||
        ep.path.includes('/messages')) {
      console.log(`      ${ep.method} ${ep.path}`);
      console.log(`         ${ep.summary}`);
    }
  });
}

/**
 * Analyze schemas and data models
 */
function analyzeSchemas(spec) {
  console.log('\n📋 Schema Analysis:');
  
  if (!spec.components || !spec.components.schemas) {
    console.log('   No schemas found');
    return;
  }
  
  const schemas = spec.components.schemas;
  const schemaNames = Object.keys(schemas);
  
  console.log(`   Total Schemas: ${schemaNames.length}`);
  
  // Categorize schemas
  const mediaSchemas = schemaNames.filter(name => 
    name.toLowerCase().includes('media') ||
    name.toLowerCase().includes('message') ||
    name.toLowerCase().includes('enhanced')
  );
  
  if (mediaSchemas.length > 0) {
    console.log('\n   📎 Media/Message Schemas:');
    mediaSchemas.forEach(schema => {
      const schemaObj = schemas[schema];
      const description = schemaObj.description || 'No description';
      console.log(`      ${schema}: ${description.substring(0, 60)}...`);
    });
  }
  
  // Show all schemas briefly
  console.log('\n   📚 All Schemas:');
  schemaNames.forEach(schema => {
    const properties = schemas[schema].properties || {};
    const propCount = Object.keys(properties).length;
    console.log(`      ${schema} (${propCount} properties)`);
  });
}

/**
 * Generate endpoint documentation
 */
function generateDocumentation(endpoints) {
  console.log('\n📝 Generating Documentation Summary...');
  
  const docPath = path.join(__dirname, 'api-endpoints-summary.md');
  let content = '# API Endpoints Summary\n\n';
  content += `Generated on: ${new Date().toISOString()}\n\n`;
  
  // Group by tags
  const byTags = {};
  endpoints.forEach(ep => {
    ep.tags.forEach(tag => {
      if (!byTags[tag]) byTags[tag] = [];
      byTags[tag].push(ep);
    });
  });
  
  Object.entries(byTags).forEach(([tag, eps]) => {
    content += `## ${tag}\n\n`;
    eps.forEach(ep => {
      content += `### ${ep.method} ${ep.path}\n`;
      content += `${ep.summary}\n\n`;
      if (ep.parameters.length > 0) {
        content += `**Parameters:** ${ep.parameters.length}\n`;
      }
      if (ep.hasRequestBody) {
        content += `**Has Request Body:** Yes\n`;
      }
      content += '\n';
    });
  });
  
  fs.writeFileSync(docPath, content);
  console.log(`   📄 Documentation saved to: ${docPath}`);
}

/**
 * Save specification to file
 */
function saveSpecification(spec) {
  const specPath = path.join(__dirname, 'api-specification.json');
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  console.log(`\n💾 Full specification saved to: ${specPath}`);
}

/**
 * Generate client code examples
 */
function generateClientExamples(mediaEndpoints) {
  console.log('\n🔧 Client Code Examples:');
  
  console.log('\n   JavaScript/Axios:');
  console.log('   ```javascript');
  console.log('   const axios = require("axios");');
  console.log('   const BASE_URL = "http://localhost:3000/api";');
  console.log('');
  
  mediaEndpoints.slice(0, 2).forEach(ep => {
    if (ep.method === 'GET') {
      const path = ep.path.replace(/{([^}]+)}/g, '${$1}');
      console.log(`   // ${ep.summary}`);
      console.log(`   async function ${ep.operationId || 'apiCall'}(deviceId, messageId) {`);
      console.log(`     const response = await axios.get(\`\${BASE_URL}${path}\`);`);
      console.log('     return response.data;');
      console.log('   }');
      console.log('');
    }
  });
  
  console.log('   ```');
  
  console.log('\n   cURL:');
  mediaEndpoints.slice(0, 2).forEach(ep => {
    if (ep.method === 'GET') {
      const path = ep.path.replace(/{([^}]+)}/g, '<$1>');
      console.log(`   # ${ep.summary}`);
      console.log(`   curl "${API_BASE}/api${path}"`);
    }
  });
}

/**
 * Main analysis function
 */
async function analyzeApi() {
  console.log('🚀 WhatsApp API Specification Analyzer\n');
  
  const spec = await fetchApiSpec();
  if (!spec) {
    console.log('\n💡 Make sure to:');
    console.log('   1. Start the API server: npm run dev');
    console.log('   2. Wait for the server to be ready');
    console.log('   3. Run this script again');
    return;
  }
  
  // Perform all analyses
  analyzeApiInfo(spec);
  const endpoints = analyzeEndpoints(spec);
  const mediaEndpoints = analyzeMediaEndpoints(endpoints);
  analyzeEnhancedEndpoints(endpoints);
  analyzeSchemas(spec);
  
  // Generate outputs
  generateDocumentation(endpoints);
  saveSpecification(spec);
  generateClientExamples(mediaEndpoints);
  
  console.log('\n🎉 Analysis complete!');
  console.log('\nNext steps:');
  console.log('   📖 View full docs: http://localhost:3000/docs');
  console.log('   📋 Raw spec: http://localhost:3000/docs-json');
  console.log('   🔧 Generate clients: Use OpenAPI generators with the JSON spec');
}

/**
 * CLI interface
 */
if (require.main === module) {
  analyzeApi().catch(error => {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  fetchApiSpec,
  analyzeApiInfo,
  analyzeEndpoints,
  analyzeMediaEndpoints,
  analyzeSchemas
};
