/**
 * @swagger
 * tags:
 *   - name: WebSocket
 *     description: Real-time Socket.IO gateway documentation for device events.
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     WebSocketApiKey:
 *       type: apiKey
 *       in: query
 *       name: apiKey
 *       description: API key required for Socket.IO connection authentication.
 *   schemas:
 *     WebSocketInfo:
 *       type: object
 *       description: Information for establishing a WebSocket (Socket.IO) connection.
 *       properties:
 *         path:
 *           type: string
 *           example: "/ws"
 *         namespace:
 *           type: string
 *           example: "/device/{deviceId}"
 *         authentication:
 *           type: object
 *           properties:
 *             apiKey:
 *               type: string
 *               description: API key passed via query string
 *               example: "YOUR_API_KEY"
 *         notes:
 *           type: string
 *           example: |
 *             Use Socket.IO client: io(`http://host/device/${deviceId}`, { path: '/ws', query: { apiKey } })
 *     DeviceStatePayload:
 *       type: object
 *       properties:
 *         deviceId:
 *           type: string
 *         status:
 *           type: string
 *         timestamp:
 *           type: integer
 *           format: int64
 *     DeviceQRPayload:
 *       type: object
 *       properties:
 *         deviceId:
 *           type: string
 *         qr:
 *           type: string
 *         timestamp:
 *           type: integer
 *           format: int64
 *     DeviceReadyPayload:
 *       type: object
 *       properties:
 *         deviceId:
 *           type: string
 *         phoneNumber:
 *           type: string
 *           nullable: true
 *         timestamp:
 *           type: integer
 *           format: int64
 *     DeviceAuthenticatedPayload:
 *       type: object
 *       properties:
 *         deviceId:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         clientName:
 *           type: string
 *         timestamp:
 *           type: integer
 *           format: int64
 *     MessageReceivedPayload:
 *       type: object
 *       properties:
 *         deviceId:
 *           type: string
 *         message:
 *           $ref: '#/components/schemas/EnhancedMessage'
 *         timestamp:
 *           type: integer
 *           format: int64
 *     DeviceDisconnectedPayload:
 *       type: object
 *       properties:
 *         deviceId:
 *           type: string
 *         reason:
 *           type: string
 *         timestamp:
 *           type: integer
 *           format: int64
 */

/**
 * Note: OpenAPI 3.0 does not natively describe WebSocket protocols. We document
 * the Socket.IO gateway using informational paths and custom schemas.
 */

/**
 * @swagger
 * paths:
 *   /ws:
 *     get:
 *       tags: [WebSocket]
 *       summary: WebSocket Gateway (Socket.IO) Upgrade
 *       description: |
 *         Establish a Socket.IO connection using the client library.
 *         Connect to the desired device namespace `/device/{deviceId}` using the `path: '/ws'` option.
 *
 *         **Authentication**: The apiKey must match the API_KEY configured in your .env file.
 *
 *         Example (JavaScript):
 *         
 *           const socket = io(`http://localhost:3000/device/${'{'}deviceId{'}'}`, {
 *             path: '/ws',
 *             query: { apiKey: 'your-super-secure-api-key-change-this-immediately' }
 *           });
 *
 *         **Device ID Format**: Device IDs are typically UUIDs (v4) but can be any alphanumeric string.
 *         Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
 *       security:
 *         - WebSocketApiKey: []
 *       parameters:
 *         - in: query
 *           name: apiKey
 *           required: true
 *           schema:
 *             type: string
 *             example: "your-super-secure-api-key-change-this-immediately"
 *           description: |
 *             API key for authentication during the Socket.IO handshake. 
 *             Must match the API_KEY value in your .env configuration file.
 *       responses:
 *         '101':
 *           description: Switching Protocols - WebSocket/Socket.IO handshake successful.
 *         '400':
 *           description: |
 *             Bad Request - Missing or invalid parameters.
 *             Common errors:
 *             - "API key is required"
 *             - "Transport unknown"
 *         '401':
 *           description: |
 *             Authentication failed.
 *             Common errors:
 *             - "Invalid API key"
 *             - "Server configuration error"
 *         '403':
 *           description: Forbidden - API key authentication failed or insufficient permissions.
 *   /ws/device/{deviceId}:
 *     get:
 *       tags: [WebSocket]
 *       summary: Device Namespace Connection (Socket.IO)
 *       description: |
 *         Socket.IO namespace for a specific device. Use together with `path: '/ws'`.
 *       parameters:
 *         - in: path
 *           name: deviceId
 *           required: true
 *           schema:
 *             type: string
 *           description: Device/session identifier
 *       responses:
 *         '101':
 *           description: Switching Protocols - Namespace connected.
 */

// This file only contains Swagger JSDoc declarations for WebSocket docs
export const socketSchemas = {} as const;


