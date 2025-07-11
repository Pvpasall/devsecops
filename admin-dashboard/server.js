const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const winston = require('winston');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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
        new winston.transports.File({ filename: 'admin-dashboard.log' })
    ]
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security middleware - intentionally relaxed for penetration testing
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for easier testing
    crossOriginEmbedderPolicy: false
}));

// CORS configuration - intentionally permissive
app.use(cors({
    origin: true, // Allow all origins
    credentials: true
}));

// Rate limiting - intentionally weak for testing
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // Very high limit for testing
    message: 'Too many requests from this IP'
});
app.use(limiter);

// Session configuration - intentionally insecure for testing
app.use(session({
    secret: process.env.ADMIN_SECRET || 'weak-secret-key', // Weak secret
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Allow HTTP for testing
        httpOnly: false, // Allow JavaScript access for testing
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.DATABASE_URL || 'mongodb://database:27017/admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    logger.info('Connected to MongoDB');
}).catch(err => {
    logger.error('MongoDB connection error:', err);
});

// User Schema - intentionally simple for testing
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: String,
    role: { type: String, default: 'user' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Authentication middleware - intentionally weak
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'admin-dashboard',
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Login page
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Login endpoint - intentionally vulnerable to SQL injection (simulated)
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Intentionally vulnerable: Direct string concatenation (simulated)
        logger.info(`Login attempt for user: ${username}`);

        // Simple authentication - intentionally weak
        if (username === 'admin' && password === 'admin123') {
            req.session.userId = 1;
            req.session.username = 'admin';
            req.session.role = 'admin';

            logger.info('Admin login successful');
            res.redirect('/dashboard');
        } else if (username === 'user' && password === 'user123') {
            req.session.userId = 2;
            req.session.username = 'user';
            req.session.role = 'user';

            logger.info('User login successful');
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'Invalid credentials' });
        }
    } catch (error) {
        logger.error('Login error:', error);
        res.render('login', { error: 'Login failed' });
    }
});

// Dashboard - main admin interface
app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', {
        user: {
            username: req.session.username,
            role: req.session.role
        }
    });
});

// API to get system information - intentionally exposes sensitive data
app.get('/api/system-info', requireAuth, (req, res) => {
    res.json({
        system: {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            env: process.env, // Intentionally exposing environment variables
            cwd: process.cwd(),
            pid: process.pid
        },
        database: {
            url: process.env.DATABASE_URL,
            connected: mongoose.connection.readyState === 1
        }
    });
});

// File upload endpoint - intentionally vulnerable
app.post('/api/upload', requireAuth, (req, res) => {
    // Intentionally no file validation
    const { filename, content } = req.body;

    if (!filename || !content) {
        return res.status(400).json({ error: 'Filename and content required' });
    }

    // Intentionally vulnerable: No path validation
    const fs = require('fs');
    const filePath = path.join(__dirname, 'uploads', filename);

    try {
        fs.writeFileSync(filePath, content);
        res.json({ success: true, message: 'File uploaded successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Command execution endpoint - intentionally vulnerable
app.post('/api/execute', requireAuth, (req, res) => {
    const { command } = req.body;

    if (!command) {
        return res.status(400).json({ error: 'Command required' });
    }

    // Intentionally vulnerable: Direct command execution
    const { exec } = require('child_process');

    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({
                error: error.message,
                stderr: stderr
            });
        }

        res.json({
            success: true,
            output: stdout,
            stderr: stderr
        });
    });
});

// User management - intentionally vulnerable to privilege escalation
app.get('/api/users', requireAuth, async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password but still vulnerable
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create user - intentionally vulnerable
app.post('/api/users', requireAuth, async (req, res) => {
    try {
        const { username, password, email, role } = req.body;

        // Intentionally weak validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Intentionally storing plain text password
        const user = new User({
            username,
            password, // Not hashed!
            email,
            role: role || 'user'
        });

        await user.save();

        res.json({
            success: true,
            message: 'User created successfully',
            user: { username, email, role }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Debug endpoint - intentionally exposes internal state
app.get('/debug', (req, res) => {
    res.json({
        session: req.session,
        headers: req.headers,
        cookies: req.cookies,
        query: req.query,
        params: req.params,
        body: req.body,
        ip: req.ip,
        ips: req.ips,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl,
        url: req.url,
        method: req.method,
        protocol: req.protocol,
        secure: req.secure,
        xhr: req.xhr
    });
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Error handling middleware - intentionally exposes stack traces
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        stack: err.stack, // Intentionally exposing stack trace
        details: err
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).render('404');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Admin Dashboard running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info('WARNING: This application contains intentional security vulnerabilities for penetration testing');
}); 