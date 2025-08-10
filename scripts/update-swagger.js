#!/usr/bin/env node

/**
 * Swagger Documentation Update Script
 * 
 * This script regenerates the Swagger documentation with the latest
 * enhanced media functionality and schema definitions.
 * 
 * Usage:
 *   node scripts/update-swagger.js
 *   npm run swagger:update
 */

const fs = require('fs');
const path = require('path');

const SWAGGER_SPEC_PATH = path.join(__dirname, '../swagger-spec.json');
const DOCS_URL = 'http://localhost:3000/docs';

console.log('🔄 Updating Swagger Documentation...\n');

// Check if the app is running
const axios = require('axios');

async function updateSwaggerDocs() {
  try {
    console.log('📡 Checking if API server is running...');
    
    // Try to access the swagger spec endpoint
    let swaggerSpec;
    try {
      const response = await axios.get('http://localhost:3000/docs-json');
      swaggerSpec = response.data;
      console.log('✅ Retrieved swagger spec from running server');
    } catch (error) {
      console.log('❌ Server not running. Please start the server first:');
      console.log('   npm run dev');
      console.log('');
      console.log('Then run this script again to update the documentation.');
      process.exit(1);
    }
    
    // Write the spec to a JSON file
    fs.writeFileSync(SWAGGER_SPEC_PATH, JSON.stringify(swaggerSpec, null, 2));
    console.log(`📄 Swagger spec written to: ${SWAGGER_SPEC_PATH}`);
    
    // Validate the spec has our enhanced schemas
    const hasEnhancedSchemas = [
      'EnhancedMessage',
      'MediaInfo',
      'LocationInfo',
      'QuotedMessage',
      'MessageReaction',
      'MediaInfoResponse',
      'EnhancedMessagesResponse',
      'MediaSearchResponse',
      'ErrorResponse'
    ].every(schema => swaggerSpec.components?.schemas?.[schema]);
    
    if (hasEnhancedSchemas) {
      console.log('✅ All enhanced media schemas are present');
    } else {
      console.log('⚠️  Some enhanced schemas may be missing');
    }
    
    // Check for Media tag
    const hasMediaTag = swaggerSpec.tags?.some(tag => tag.name === 'Media');
    if (hasMediaTag) {
      console.log('✅ Media tag is present');
    } else {
      console.log('⚠️  Media tag may be missing');
    }
    
    // Count endpoints
    const endpoints = Object.keys(swaggerSpec.paths || {});
    const mediaEndpoints = endpoints.filter(path => path.includes('/media/'));
    
    console.log(`📊 Documentation Summary:`);
    console.log(`   • Total endpoints: ${endpoints.length}`);
    console.log(`   • Media endpoints: ${mediaEndpoints.length}`);
    console.log(`   • Tags: ${swaggerSpec.tags?.length || 0}`);
    console.log(`   • Schemas: ${Object.keys(swaggerSpec.components?.schemas || {}).length}`);
    
    console.log(`\n🎉 Swagger documentation updated successfully!`);
    console.log(`📖 View the documentation at: ${DOCS_URL}`);
    
    // List the media endpoints
    if (mediaEndpoints.length > 0) {
      console.log(`\n📎 Media Endpoints:`);
      mediaEndpoints.forEach(endpoint => {
        console.log(`   • ${endpoint}`);
      });
    }
    
    // Show enhanced message endpoints
    const enhancedEndpoints = endpoints.filter(path => 
      path.includes('/messages') && 
      (path.includes('/chats/') || path.includes('/messages/search'))
    );
    
    if (enhancedEndpoints.length > 0) {
      console.log(`\n💫 Enhanced Message Endpoints:`);
      enhancedEndpoints.forEach(endpoint => {
        console.log(`   • ${endpoint}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating swagger documentation:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 To update with live server data:');
      console.log('   1. Start the development server: npm run dev');
      console.log('   2. Run this script again: npm run swagger:update');
    }
    
    process.exit(1);
  }
}

// Add to package.json script
function updatePackageJson() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    if (!packageJson.scripts['swagger:update']) {
      packageJson.scripts['swagger:update'] = 'node scripts/update-swagger.js';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Added swagger:update script to package.json');
    }
  } catch (error) {
    console.log('⚠️  Could not update package.json scripts');
  }
}

// Main execution
async function main() {
  updatePackageJson();
  await updateSwaggerDocs();
}

if (require.main === module) {
  main();
}

module.exports = { updateSwaggerDocs };
