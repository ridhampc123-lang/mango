const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const stockRoutes = require('./routes/stockRoutes');
const batchRoutes = require('./routes/batchRoutes');
const customerRoutes = require('./routes/customerRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const labourRoutes = require('./routes/labourRoutes');

const app = express();

const normalizeOrigin = (origin) => {
  const trimmed = origin.trim().replace(/\/+$/, '');

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) {
    return `http://${trimmed}`;
  }

  return `https://${trimmed}`;
};

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  'http://localhost:5173,mango-qq94uemu8-royals-projects-9a33691c.vercel.app'
)
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const vercelPreviewPattern = /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests like curl/Postman and same-origin requests.
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedRequestOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedRequestOrigin) || vercelPreviewPattern.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mango Business Management API is running',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/labour', labourRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
