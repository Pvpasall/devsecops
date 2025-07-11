const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const axios = require('axios');
const { specs, swaggerUi } = require('./swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "https://js.stripe.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            frameSrc: ["https://js.stripe.com"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Swagger Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customSiteTitle: 'DevSecOps API Gateway Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true
    }
}));

// API Documentation redirect
app.get('/api-docs', (req, res) => {
    res.redirect('/docs');
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Returns the health status of the API Gateway service
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       500:
 *         description: Service is unhealthy
 */
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'api-gateway',
        version: '1.0.0',
        uptime: process.uptime()
    });
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     description: Retrieve the complete product catalog
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// Products endpoint
app.get('/api/products', async (req, res) => {
    try {
        const products = [
            {
                id: 'formation-devsecops',
                name: 'Formation DevSecOps',
                description: 'Formation complète en sécurité DevOps',
                price: 99.99,
                currency: 'eur',
                image: 'https://via.placeholder.com/300x200/4CAF50/white?text=Formation+DevSecOps'
            },
            {
                id: 'audit-securite',
                name: 'Audit de Sécurité',
                description: 'Audit complet de votre infrastructure',
                price: 299.99,
                currency: 'eur',
                image: 'https://via.placeholder.com/300x200/2196F3/white?text=Audit+Sécurité'
            },
            {
                id: 'consulting-docker',
                name: 'Consulting Docker',
                description: 'Optimisation de vos conteneurs Docker',
                price: 199.99,
                currency: 'eur',
                image: 'https://via.placeholder.com/300x200/FF9800/white?text=Consulting+Docker'
            }
        ];

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/create-payment-intent:
 *   post:
 *     summary: Create a payment intent
 *     tags: [Payments]
 *     description: Create a Stripe payment intent for a product purchase (proxied to Payment Service)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentIntent'
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 clientSecret:
 *                   type: string
 *                   description: Stripe client secret
 *                 paymentIntentId:
 *                   type: string
 *                   description: Payment intent ID
 *       400:
 *         description: Invalid request parameters
 *       503:
 *         description: Payment service unavailable
 *       500:
 *         description: Payment processing error
 */
// Create payment intent endpoint
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { product, amount } = req.body;

        if (!product || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Product and amount are required'
            });
        }

        // Forward to payment service
        const response = await axios.post('http://payment-service:4000/api/create-payment-intent', {
            product,
            amount
        }, {
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error('Payment intent error:', error);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'Payment service unavailable'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Payment processing error'
        });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User authentication
 *     tags: [Authentication]
 *     description: Authenticate user with username and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Authentication error
 */
// User authentication endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Simple demo authentication
        if (username === 'admin' && password === 'devsecops2024') {
            const token = 'demo-jwt-token';
            res.json({
                success: true,
                token,
                user: {
                    id: 1,
                    username: 'admin',
                    role: 'admin'
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
 *     description: Retrieve list of orders for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Failed to fetch orders
 */
// Orders endpoint
app.get('/api/orders', async (req, res) => {
    try {
        // Demo orders data
        const orders = [
            {
                id: 'order-001',
                product: 'formation-devsecops',
                amount: 9999,
                status: 'completed',
                date: new Date().toISOString()
            },
            {
                id: 'order-002',
                product: 'audit-securite',
                amount: 29999,
                status: 'pending',
                date: new Date().toISOString()
            }
        ];

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Orders error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
});

// Proxy to admin dashboard (for internal communication)
app.use('/api/admin', async (req, res) => {
    try {
        const response = await axios({
            method: req.method,
            url: `http://admin-dashboard:3000${req.originalUrl.replace('/api/admin', '')}`,
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                ...req.headers
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Admin proxy error:', error);
        res.status(500).json({
            success: false,
            error: 'Admin service error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 