// ============================================================================
// StockSense Real-Time Socket Service
// Wraps socket.io-client with graceful fallback if unavailable
// ============================================================================

let _io = null;

// Dynamic import so a resolution failure never crashes the module graph
async function loadIo() {
  if (_io) return _io;
  try {
    const mod = await import('socket.io-client');
    _io = mod.io || mod.default;
  } catch {
    console.warn('[StockSense Socket] socket.io-client not available — real-time features disabled.');
    _io = null;
  }
  return _io;
}

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.startsWith('http')) {
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

export const initSocket = async () => {
  if (socket) return socket;

  const io = await loadIo();
  if (!io) return null;

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

  return socket;
};

export const getSocket = () => socket;

export const subscribeToEvent = (event, callback) => {
  if (!socket) {
    // Will silently no-op if socket not yet initialized
    return () => {};
  }
  socket.on(event, callback);
  return () => {
    socket.off(event, callback);
  };
};

export default {
  initSocket,
  getSocket,
  subscribeToEvent,
};
