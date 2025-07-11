const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DevSecOps API Gateway',
            version: '1.0.0',
            description: 'API Gateway for DevSecOps E-Commerce Platform - ESTIAM E5 Project',
            contact: {
                name: 'ESTIAM E5 DevSecOps Team',
                email: 'contact@devsecops-shop.fr'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost',
                description: 'Development server (via reverse proxy)'
            },
            {
                url: 'http://api.localhost',
                description: 'API Gateway direct access'
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
                Product: {
                    type: 'object',
                    required: ['id', 'name', 'price'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Product unique identifier',
                            example: 'formation-devsecops'
                        },
                        name: {
                            type: 'string',
                            description: 'Product name',
                            example: 'Formation DevSecOps'
                        },
                        description: {
                            type: 'string',
                            description: 'Product description',
                            example: 'Formation complète en sécurité DevOps'
                        },
                        price: {
                            type: 'number',
                            format: 'float',
                            description: 'Product price in EUR',
                            example: 99.99
                        },
                        currency: {
                            type: 'string',
                            description: 'Currency code',
                            example: 'eur'
                        },
                        image: {
                            type: 'string',
                            description: 'Product image URL',
                            example: 'https://via.placeholder.com/300x200'
                        }
                    }
                },
                User: {
                    type: 'object',
                    required: ['id', 'username', 'role'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'User unique identifier',
                            example: 1
                        },
                        username: {
                            type: 'string',
                            description: 'Username',
                            example: 'admin'
                        },
                        role: {
                            type: 'string',
                            enum: ['user', 'admin'],
                            description: 'User role',
                            example: 'admin'
                        }
                    }
                },
                Order: {
                    type: 'object',
                    required: ['id', 'product', 'amount', 'status'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Order unique identifier',
                            example: 'order-001'
                        },
                        product: {
                            type: 'string',
                            description: 'Product identifier',
                            example: 'formation-devsecops'
                        },
                        amount: {
                            type: 'integer',
                            description: 'Amount in cents',
                            example: 9999
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'completed', 'failed'],
                            description: 'Order status',
                            example: 'completed'
                        },
                        date: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Order creation date',
                            example: '2024-01-01T12:00:00Z'
                        }
                    }
                },
                PaymentIntent: {
                    type: 'object',
                    required: ['product', 'amount'],
                    properties: {
                        product: {
                            type: 'string',
                            description: 'Product identifier',
                            example: 'formation-devsecops'
                        },
                        amount: {
                            type: 'integer',
                            description: 'Amount in cents',
                            example: 9999
                        },
                        customerEmail: {
                            type: 'string',
                            format: 'email',
                            description: 'Customer email (optional)',
                            example: 'customer@example.com'
                        }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: {
                            type: 'string',
                            description: 'Username',
                            example: 'admin'
                        },
                        password: {
                            type: 'string',
                            description: 'Password',
                            example: 'devsecops2024'
                        }
                    }
                },
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Request success status'
                        },
                        data: {
                            type: 'object',
                            description: 'Response data'
                        },
                        error: {
                            type: 'string',
                            description: 'Error message if success is false'
                        }
                    }
                },
                HealthCheck: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'healthy'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        },
                        service: {
                            type: 'string',
                            example: 'api-gateway'
                        },
                        version: {
                            type: 'string',
                            example: '1.0.0'
                        },
                        uptime: {
                            type: 'number',
                            description: 'Service uptime in seconds'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Health',
                description: 'Health check endpoints'
            },
            {
                name: 'Products',
                description: 'Product catalog operations'
            },
            {
                name: 'Authentication',
                description: 'User authentication and authorization'
            },
            {
                name: 'Orders',
                description: 'Order management'
            },
            {
                name: 'Payments',
                description: 'Payment processing (proxied to Payment Service)'
            }
        ]
    },
    apis: ['./server.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi }; 