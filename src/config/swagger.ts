import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import swaggerDefinition from './swaggerDef'; // Import the new definition

// Swagger JSDoc options
const swaggerOptions = {
  swaggerDefinition,
  apis: [
    './src/routes/**/*.ts',
    './src/config/validation.ts', // Include validation schemas
    './src/config/mediaSchemas.ts', // Include media schemas
    './src/config/socketSchemas.ts', // Include websocket/socket schemas
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Custom CSS to inject into Swagger UI
const customCss = `
  .swagger-ui .topbar { display: none }
  .swagger-ui .info { margin: 20px 0; }
  .swagger-ui .scheme-container { background-color: #f0f0f0; padding: 10px; }
  .swagger-ui .opblock-tag { font-size: 1.2em; font-weight: bold; }
  .swagger-ui .opblock { border-color: #ccc; }
  .swagger-ui .opblock-summary-method { background-color: #337ab7; }
`;

// Setup Swagger middleware
export const setupSwagger = (app: Application): void => {
  // Serve the raw OpenAPI/Swagger JSON specification
  app.get('/docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for tools
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.json(swaggerSpec);
  });

  // Serve the Swagger UI documentation
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss,
      customSiteTitle: 'WhatsApp Web.js API Docs',
      customfavIcon: '/static/favicon.ico',
      swaggerOptions: {
        tagsSorter: 'alpha', // Sort tags alphabetically
        operationsSorter: 'alpha', // Sort operations alphabetically within each tag
        docExpansion: 'list', // Expand only the tags list by default
        filter: true, // Enable search filter
        showExtensions: true,
        showCommonExtensions: true,
        url: '/docs-json', // Point to our JSON endpoint
      },
    })
  );

  console.log(`Swagger docs available at http://localhost:${process.env.PORT || 3000}/docs`);
  console.log(`OpenAPI JSON spec available at http://localhost:${process.env.PORT || 3000}/docs-json`);
};

// Export the swagger specification for external use
export { swaggerSpec };

