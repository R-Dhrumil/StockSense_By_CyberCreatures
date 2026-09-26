import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.startsWith('http')) {
    // If VITE_API_BASE_URL is 'http://localhost:5002/api/v1', strip '/api/v1'
    try {
      const parsed = new URL(envUrl);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return 'http://localhost:5002';
    }
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:5002`;
  }
  return 'http://localhost:5002';
};

let socket = null;

export const initSocket = () => {
  if (!socket) {
    const url = getSocketUrl();
    socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('⚡ [StockSense Telemetry] Connected to real-time WebSocket server:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚡ [StockSense Telemetry] Disconnected from WebSocket server:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚡ [StockSense Telemetry] Connection warning (offline dev mode):', err.message);
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const subscribeToEvent = (event, callback) => {
  const s = getSocket();
  if (s) {
    s.on(event, callback);
  }
  return () => {
    if (s) {
      s.off(event, callback);
    }
  };
};

export default {
  initSocket,
  getSocket,
  subscribeToEvent,
};
