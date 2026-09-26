import http from 'http';
import os from 'os';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initSocket } from './services/socket.service.js';

const startServer = async () => {
  // Connect to Database & Auto-initialize Schema
  await connectDB();

  const PORT = env.PORT || 5000;
  const server = http.createServer(app);

  // Initialize Real-time Socket.IO WebSocket Server
  initSocket(server);

  const HOST = env.HOST || '0.0.0.0';

  // Get local network IPv4 address for same-network sharing
  const networkInterfaces = os.networkInterfaces();
  let localIp = '127.0.0.1';
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
        break;
      }
    }
  }

  server.listen(Number(PORT), HOST, () => {
    logger.success(`🚀 Server running in ${env.NODE_ENV} mode:`);
    logger.info(`   ➜  Local:   http://localhost:${PORT}`);
    logger.info(`   ➜  Network: http://${localIp}:${PORT} (Same Network Sharing)`);
    logger.info(`📌 Health check available at http://localhost:${PORT}/health`);
    logger.info(`📖 Swagger API Docs at http://localhost:${PORT}/docs`);
    logger.info(`📌 API endpoints mounted at http://localhost:${PORT}/api/v1`);
    logger.info(`⚡ Socket.IO Real-time server active on ws://${localIp}:${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1);
  });
};

startServer();
