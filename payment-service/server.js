const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
const winston = require('winston');
const { specs, swaggerUi } = require('./swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'payment-service.log' })
    ]
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Rate limiting - stricter for payment endpoints
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 payment requests per windowMs
    message: 'Too many payment requests from this IP, please try again later.'
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/create-payment-intent', paymentLimiter);
app.use('/api/', generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// MongoDB connection
mongoose.connect(process.env.DATABASE_URL || 'mongodb://database:27017/payments', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    logger.info('Connected to MongoDB');
}).catch(err => {
    logger.error('MongoDB connection error:', err);
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
    paymentIntentId: { type: String, required: true, unique: true },
    product: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'eur' },
    status: { type: String, default: 'pending' },
    customerEmail: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

// Swagger Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customSiteTitle: 'DevSecOps Payment Service Documentation',
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
 *     description: Returns the health status of the Payment Service including Stripe connectivity
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
        service: 'payment-service',
        version: '1.0.0',
        uptime: process.uptime(),
        stripe: !!process.env.STRIPE_SECRET_KEY
    });
});

/**
 * @swagger
 * /api/create-payment-intent:
 *   post:
 *     summary: Create a Stripe payment intent
 *     tags: [Payments]
 *     description: Create a payment intent for processing payments with Stripe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentIntent'
 *           examples:
 *             formation:
 *               summary: DevSecOps Formation
 *               value:
 *                 product: "formation-devsecops"
 *                 amount: 9999
 *                 customerEmail: "student@example.com"
 *             audit:
 *               summary: Security Audit
 *               value:
 *                 product: "audit-securite"
 *                 amount: 29999
 *                 customerEmail: "client@example.com"
 *             consulting:
 *               summary: Docker Consulting
 *               value:
 *                 product: "consulting-docker"
 *                 amount: 19999
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentIntentResponse'
 *       400:
 *         description: Validation error or invalid product/amount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Payment processing error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// Create payment intent endpoint
app.post('/api/create-payment-intent', [
    body('product').notEmpty().withMessage('Product is required'),
    body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { product, amount, customerEmail } = req.body;

        // Product validation
        const validProducts = ['formation-devsecops', 'audit-securite', 'consulting-docker'];
        if (!validProducts.includes(product)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product'
            });
        }

        // Amount validation (in cents)
        const validAmounts = {
            'formation-devsecops': 9999,
            'audit-securite': 29999,
            'consulting-docker': 19999
        };

        if (amount !== validAmounts[product]) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount for product'
            });
        }

        // Create payment intent with Stripe
        let paymentIntent;

        // Check if we're in demo mode (invalid Stripe key)
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_stripe_secret_key_here')) {
            // Demo mode - create a mock payment intent
            paymentIntent = {
                id: 'pi_demo_' + Date.now(),
                client_secret: 'pi_demo_' + Date.now() + '_secret_demo',
                amount: amount,
                currency: 'eur',
                status: 'requires_payment_method'
            };

            logger.info('Running in demo mode - using mock payment intent');
        } else {
            // Real Stripe mode
            paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'eur',
                metadata: {
                    product: product,
                    service: 'devsecops-ecommerce'
                },
                automatic_payment_methods: {
                    enabled: true
                }
            });
        }

        // Save payment record to database
        const payment = new Payment({
            paymentIntentId: paymentIntent.id,
            product: product,
            amount: amount,
            currency: 'eur',
            status: 'pending',
            customerEmail: customerEmail
        });

        await payment.save();

        logger.info('Payment intent created', {
            paymentIntentId: paymentIntent.id,
            product: product,
            amount: amount
        });

        // Check if we're in demo mode
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_stripe_secret_key_here')) {
            res.json({
                success: true,
                message: 'Paiement réussi ! (Mode démo)',
                paymentIntentId: paymentIntent.id,
                demoMode: true
            });
        } else {
            res.json({
                success: true,
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            });
        }

    } catch (error) {
        logger.error('Payment intent creation error:', error);

        if (error.type === 'StripeCardError') {
            return res.status(400).json({
                success: false,
                error: 'Card error: ' + error.message
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
 * /api/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Webhooks]
 *     description: Handle Stripe webhook events for payment confirmations
 *     security:
 *       - stripeWebhook: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Webhook signature verification failed
 */
// Webhook endpoint for Stripe events
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        logger.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;

            // Update payment status in database
            await Payment.findOneAndUpdate(
                { paymentIntentId: paymentIntent.id },
                {
                    status: 'completed',
                    updatedAt: new Date()
                }
            );

            logger.info('Payment succeeded', {
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount
            });
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;

            // Update payment status in database
            await Payment.findOneAndUpdate(
                { paymentIntentId: failedPayment.id },
                {
                    status: 'failed',
                    updatedAt: new Date()
                }
            );

            logger.warn('Payment failed', {
                paymentIntentId: failedPayment.id,
                lastPaymentError: failedPayment.last_payment_error
            });
            break;

        default:
            logger.info('Unhandled event type:', event.type);
    }

    res.json({ received: true });
});

/**
 * @swagger
 * /api/payment/{paymentIntentId}:
 *   get:
 *     summary: Get payment status
 *     tags: [Payments]
 *     description: Retrieve the status of a specific payment by its payment intent ID
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe payment intent ID
 *         example: "pi_1234567890"
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Failed to get payment status
 */
// Get payment status endpoint
app.get('/api/payment/:paymentIntentId', async (req, res) => {
    try {
        const { paymentIntentId } = req.params;

        const payment = await Payment.findOne({ paymentIntentId });

        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: payment.paymentIntentId,
                product: payment.product,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                createdAt: payment.createdAt
            }
        });

    } catch (error) {
        logger.error('Payment status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get payment status'
        });
    }
});

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Admin]
 *     description: Retrieve all payments from the database (limited to last 100)
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
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
 *                         $ref: '#/components/schemas/Payment'
 *       500:
 *         description: Failed to fetch payments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
// Get all payments endpoint (for admin)
app.get('/api/payments', async (req, res) => {
    try {
        const payments = await Payment.find()
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            data: payments
        });

    } catch (error) {
        logger.error('Payments fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payments'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
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
    logger.info(`Payment Service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 