import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AlgoChat API',
      version: '1.0.0',
      description: 'Real-time chat application API with Socket.IO',
      contact: {
        name: 'AlgoChat Team',
        email: 'support@algochat.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.algochat.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User name',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
              example: 'john@example.com'
            },
            avatar: {
              type: 'string',
              description: 'Avatar URL',
              example: 'https://example.com/avatar.jpg'
            },
            isOnline: {
              type: 'boolean',
              description: 'Online status',
              example: true
            },
            lastSeen: {
              type: 'string',
              format: 'date-time',
              description: 'Last seen timestamp'
            }
          }
        },
        Room: {
          type: 'object',
          required: ['name', 'members'],
          properties: {
            _id: {
              type: 'string',
              description: 'Room ID'
            },
            name: {
              type: 'string',
              description: 'Room name',
              example: 'General Chat'
            },
            isGroup: {
              type: 'boolean',
              description: 'Whether this is a group chat',
              example: true
            },
            members: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/User'
              },
              description: 'Room members'
            },
            lastMessageAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last message timestamp'
            }
          }
        },
        Message: {
          type: 'object',
          required: ['room', 'sender'],
          properties: {
            _id: {
              type: 'string',
              description: 'Message ID'
            },
            room: {
              type: 'string',
              description: 'Room ID'
            },
            sender: {
              $ref: '#/components/schemas/User'
            },
            text: {
              type: 'string',
              description: 'Message text',
              example: 'Hello, world!'
            },
            fileUrl: {
              type: 'string',
              description: 'File attachment URL'
            },
            fileType: {
              type: 'string',
              description: 'File type',
              example: 'image'
            },
            edited: {
              type: 'boolean',
              description: 'Whether message was edited',
              example: false
            },
            deleted: {
              type: 'boolean',
              description: 'Whether message was deleted',
              example: false
            },
            reactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user: {
                    $ref: '#/components/schemas/User'
                  },
                  emoji: {
                    type: 'string',
                    example: '👍'
                  },
                  createdAt: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            },
            readBy: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user: {
                    $ref: '#/components/schemas/User'
                  },
                  readAt: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Message creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Message update timestamp'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number',
              example: 1
            },
            limit: {
              type: 'integer',
              description: 'Items per page',
              example: 50
            },
            total: {
              type: 'integer',
              description: 'Total number of items',
              example: 150
            },
            pages: {
              type: 'integer',
              description: 'Total number of pages',
              example: 3
            },
            hasMore: {
              type: 'boolean',
              description: 'Whether there are more pages',
              example: true
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed'
            },
            code: {
              type: 'string',
              description: 'Error code',
              example: 'VALIDATION_ERROR'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
