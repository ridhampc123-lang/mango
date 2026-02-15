// Not Found Handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler - Production-level defensive coding
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error caught by errorHandler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // Determine status code
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  // Handle specific error types
  if (err.name === 'CastError') {
    statusCode = 400;
    err.message = 'Invalid ID format';
  }
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    err.message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }
  
  if (err.code === 11000) {
    statusCode = 400;
    err.message = 'Duplicate field value entered';
  }
  
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    err.message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    err.message = 'Token expired';
  }
  
  // Send response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
