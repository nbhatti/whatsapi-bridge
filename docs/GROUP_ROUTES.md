# Group Routes Documentation

This document describes the newly implemented group routes for managing WhatsApp groups through the API.

## Endpoints

### Join Group
**POST** `/api/v1/devices/{deviceId}/groups/{groupId}/join`

Allows a device to join a WhatsApp group using an invite link or invite code.

#### Request Body
```json
{
  "inviteCode": "ABC123DEF456",     // Optional: Group invite code
  "inviteLink": "https://chat.whatsapp.com/ABC123DEF456"  // Optional: Full invite link
}
```

**Note:** Either `inviteCode` OR `inviteLink` must be provided, but not both.

#### Response
```json
{
  "success": true,
  "data": {
    "deviceId": "device-123",
    "groupId": "120363123456789012@g.us",
    "message": "Successfully joined the group",
    "joinedGroupId": "120363123456789012@g.us"
  }
}
```

#### Error Responses
- `400` - Device not ready or invalid request
- `404` - Device not found
- `500` - Internal server error

### Leave Group
**POST** `/api/v1/devices/{deviceId}/groups/{groupId}/leave`

Allows a device to leave a WhatsApp group.

#### Request Body
No request body required.

#### Response
```json
{
  "success": true,
  "data": {
    "deviceId": "device-123",
    "groupId": "120363123456789012@g.us",
    "message": "Successfully left the group"
  }
}
```

#### Error Responses
- `400` - Device not ready or not a group member
- `404` - Device or group not found
- `500` - Internal server error

## Future Endpoints (Stubs)

The following endpoints are implemented as stubs and will return `501 Not Implemented`:

### Add Participants
**POST** `/api/v1/devices/{deviceId}/groups/{groupId}/participants/add`

### Remove Participants  
**POST** `/api/v1/devices/{deviceId}/groups/{groupId}/participants/remove`

### Set Group Subject
**PUT** `/api/v1/devices/{deviceId}/groups/{groupId}/subject`

### Set Group Description
**PUT** `/api/v1/devices/{deviceId}/groups/{groupId}/description`

## Usage Examples

### Join a group using invite code
```bash
curl -X POST "http://localhost:3000/api/v1/devices/my-device/groups/target-group/join" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"inviteCode": "ABC123DEF456"}'
```

### Join a group using invite link
```bash
curl -X POST "http://localhost:3000/api/v1/devices/my-device/groups/target-group/join" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"inviteLink": "https://chat.whatsapp.com/ABC123DEF456"}'
```

### Leave a group
```bash
curl -X POST "http://localhost:3000/api/v1/devices/my-device/groups/120363123456789012@g.us/leave" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key"
```

## Requirements

- Device must be in `ready` state
- Valid API key must be provided
- For join operations: either `inviteCode` or `inviteLink` must be provided
- For leave operations: device must be a member of the group

## Implementation Details

- Built using Express.js and WhatsApp Web.js
- Includes comprehensive error handling and logging
- Validates request parameters using Joi schemas
- Follows existing API patterns and structure
- Includes Swagger/OpenAPI documentation
