---

tags:
  - Devices
  - Contacts
summary: Get contacts for a device
parameters:
  - in: path
    name: id
    required: true
    schema:
      type: string
    description: Device ID
requestBody:
  required: false
  content:
    application/json:
      schema:
        type: object
        properties:
          search:
            type: string
            description: Search term to filter contacts
          contactIds:
            type: array
            items:
              type: string
            description: Specific contact IDs to retrieve
responses:
  '200':
    description: Contact list retrieved successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                  name:
                    type: string
                  number:
                    type: string
                  profilePicUrl:
                    type: string
  '404':
    description: Device not found
  '500':
    description: Internal server error

