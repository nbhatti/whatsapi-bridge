import j2s from 'joi-to-swagger';
import Joi from 'joi';

// Type definitions
export interface Schemas {
  [key: string]: Joi.ObjectSchema;
}

export interface SwaggerSchema {
  [key: string]: any;
}

export interface JoiToSwaggerResult {
  swagger: SwaggerSchema;
  components: any;
}

/**
 * Converts a collection of Joi schemas to Swagger/OpenAPI 3.0 components
 * @param schemas - Object containing Joi validation schemas
 * @returns Swagger components schema object
 */
export const joiToSwagger = (schemas: Schemas): JoiToSwaggerResult => {
  const swaggerSchemas: SwaggerSchema = {};
  const components: any = {};

  // Convert each Joi schema to swagger format
  Object.keys(schemas).forEach((key) => {
    try {
      const { swagger } = j2s(schemas[key]);
      swaggerSchemas[key] = swagger;
    } catch (error) {
      console.warn(`Failed to convert schema '${key}' to swagger:`, error);
      // Fallback to basic object type
      swaggerSchemas[key] = {
        type: 'object',
        description: `Schema for ${key} (conversion failed)`,
      };
    }
  });

  return {
    swagger: swaggerSchemas,
    components: {
      schemas: swaggerSchemas,
    },
  };
};

/**
 * Generate a schema reference for use in swagger annotations
 * @param schemaName - Name of the schema to reference
 * @returns Schema reference object
 */
export const createSchemaRef = (schemaName: string) => ({
  $ref: `#/components/schemas/${schemaName}`,
});

/**
 * Convert a single Joi schema to swagger format
 * @param schema - Joi schema to convert
 * @returns Swagger schema object
 */
export const convertSingleSchema = (schema: Joi.ObjectSchema): any => {
  try {
    const { swagger } = j2s(schema);
    return swagger;
  } catch (error) {
    console.warn('Failed to convert schema to swagger:', error);
    return {
      type: 'object',
      description: 'Schema conversion failed',
    };
  }
};

/**
 * Creates common response schemas for API endpoints
 */
export const commonResponses = {
  successResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      data: {
        type: 'object',
        description: 'Response data',
      },
    },
    required: ['success'],
  },
  errorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      error: {
        type: 'string',
        description: 'Error message',
      },
      details: {
        type: 'string',
        description: 'Detailed error information',
      },
    },
    required: ['success', 'error'],
  },
  validationErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      error: {
        type: 'string',
        example: 'Validation error',
      },
      details: {
        type: 'string',
        description: 'Validation error details',
      },
    },
    required: ['success', 'error', 'details'],
  },
};

/**
 * Helper function to create standardized response documentation
 */
export const createResponseDoc = (dataSchema?: any) => ({
  200: {
    description: 'Success',
    content: {
      'application/json': {
        schema: {
          ...commonResponses.successResponse,
          properties: {
            ...commonResponses.successResponse.properties,
            ...(dataSchema && { data: dataSchema }),
          },
        },
      },
    },
  },
  400: {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: commonResponses.validationErrorResponse,
      },
    },
  },
  401: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: commonResponses.errorResponse,
      },
    },
  },
  404: {
    description: 'Not Found',
    content: {
      'application/json': {
        schema: commonResponses.errorResponse,
      },
    },
  },
  500: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: commonResponses.errorResponse,
      },
    },
  },
});
