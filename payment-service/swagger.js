const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DevSecOps Payment Service',
            version: '1.0.0',
            description: 'Payment Service with Stripe Integration - ESTIAM E5 Project',
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
                url: 'http://payment.localhost',
                description: 'Payment Service (via reverse proxy)'
            },
            {
                url: 'http://localhost:4000',
                description: 'Payment Service direct access'
            }
        ],
        components: {
            securitySchemes: {
                stripeWebhook: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'stripe-signature',
                    description: 'Stripe webhook signature'
                }
            },
            schemas: {
                PaymentIntent: {
                    type: 'object',
                    required: ['product', 'amount'],
                    properties: {
                        product: {
                            type: 'string',
                            enum: ['formation-devsecops', 'audit-securite', 'consulting-docker'],
                            description: 'Product identifier',
                            example: 'formation-devsecops'
                        },
                        amount: {
                            type: 'integer',
                            description: 'Amount in cents (must match product price)',
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
                PaymentIntentResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        clientSecret: {
                            type: 'string',
                            description: 'Stripe client secret for frontend payment confirmation',
                            example: 'pi_1234567890_secret_abcdefghijk'
                        },
                        paymentIntentId: {
                            type: 'string',
                            description: 'Stripe payment intent ID',
                            example: 'pi_1234567890'
                        }
                    }
                },
                Payment: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Payment intent ID',
                            example: 'pi_1234567890'
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
                        currency: {
                            type: 'string',
                            description: 'Currency code',
                            example: 'eur'
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'completed', 'failed'],
                            description: 'Payment status',
                            example: 'completed'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Payment creation date'
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
                            example: 'payment-service'
                        },
                        version: {
                            type: 'string',
                            example: '1.0.0'
                        },
                        uptime: {
                            type: 'number',
                            description: 'Service uptime in seconds'
                        },
                        stripe: {
                            type: 'boolean',
                            description: 'Stripe configuration status'
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
                ValidationError: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            example: 'Validation failed'
                        },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    msg: {
                                        type: 'string',
                                        example: 'Product is required'
                                    },
                                    param: {
                                        type: 'string',
                                        example: 'product'
                                    }
                                }
                            }
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
                name: 'Payments',
                description: 'Payment processing with Stripe'
            },
            {
                name: 'Webhooks',
                description: 'Stripe webhook handlers'
            },
            {
                name: 'Admin',
                description: 'Administrative endpoints'
            }
        ]
    },
    apis: ['./server.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi }; 