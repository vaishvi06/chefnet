const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const env = require('./config/env');
const AppError = require('./utils/appError');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const chefRoutes = require('./routes/chefRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const mealRoutes = require('./routes/mealRoutes');
const dailyMenuRoutes = require('./routes/dailyMenuRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const supportRoutes = require('./routes/supportRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const geoRoutes = require('./routes/geoRoutes');

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false // for Swagger UI inline scripts
  })
);

// CORS configuration
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body & Cookie Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sanitize MongoDB operators
app.use(mongoSanitize());

// HTTP Response Compression
app.use(compression());

// Serve static uploaded files
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Swagger API Documentation
try {
  const swaggerDocument = YAML.load(path.resolve(__dirname, '../docs/openapi.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn('[Swagger UI] Could not load openapi.yaml:', err.message);
}

// Base Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ChiefNet Hyperlocal Subscription Platform API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Apply General Rate Limiter to /api/v1
app.use('/api/v1', apiLimiter);

// Mount API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/chefs', chefRoutes);
app.use('/api/v1/discovery', discoveryRoutes);
app.use('/api/v1/meals', mealRoutes);
app.use('/api/v1/daily-menus', dailyMenuRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/support-tickets', supportRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/geo', geoRoutes);

// Catch Unhandled Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
