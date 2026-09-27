// Centralized error handler — always return JSON { message }
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
