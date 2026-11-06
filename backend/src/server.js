const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { initChatSocket } = require('./sockets/chatSocket');
const { initCronJobs } = require('./jobs/cronJobs');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err.name, err.message, err.stack);
  process.exit(1);
});

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP & Socket.io server
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true
    }
  });

  // Initialize WebSockets
  initChatSocket(io);

  // Initialize automated cron jobs
  initCronJobs();

  // Start listening on all interfaces (IPv4 and IPv6 compatible)
  const server = httpServer.listen(env.PORT, '0.0.0.0', () => {
    console.log(
      `[ChiefNet Backend] Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`
    );
    console.log(`[ChiefNet API Docs] Swagger UI available at http://localhost:${env.PORT}/api/docs`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED REJECTION]:', err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown on termination signals
  const shutdown = async () => {
    console.log('[ChiefNet Backend] Shutting down gracefully...');
    server.close(async () => {
      await disconnectDB();
      console.log('[ChiefNet Backend] Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
