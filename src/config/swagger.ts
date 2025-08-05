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
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss,
      customSiteTitle: 'WhatsApp Web.js API Docs',
      customfavIcon: '/static/favicon.ico', // Example: add a favicon
      swaggerOptions: {
        tagsSorter: 'alpha', // Sort tags alphabetically
        operationsSorter: 'alpha', // Sort operations alphabetically within each tag
        docExpansion: 'list', // Expand only the tags list by default
        filter: true, // Enable search filter
        showExtensions: true,
        showCommonExtensions: true,
      },
    })
  );

  console.log(`Swagger docs available at http://localhost:${process.env.PORT || 3000}/docs`);
};

