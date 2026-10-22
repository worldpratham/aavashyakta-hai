import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socketInstance: Socket | null = null;

export function getSocketUrl(): string {
  try {
    if (API_BASE_URL.startsWith('/')) {
      return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
    }
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'http://localhost:5000';
  }
}

export function getSocket(): Socket {
  if (!socketInstance) {
    const serverUrl = getSocketUrl();
    socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      console.log('🛰️ [Socket] Connected to Live GPS Server:', socketInstance?.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('🛰️ [Socket] Connection Notice:', err.message);
    });
  }
  return socketInstance;
}

export interface WorkerLocationPayload {
  workerId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  statusText?: string;
  updatedAt?: string;
}

export function emitWorkerLocation(payload: WorkerLocationPayload): void {
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit('worker_location_update', payload);
  }
}

export function emitWorkerStatusToggle(data: {
  workerId: string;
  isAvailableNow: boolean;
  statusText?: string;
  latitude?: number | null;
  longitude?: number | null;
}): void {
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit('worker_status_toggle', data);
  }
}

export function onWorkerMoved(callback: (data: WorkerLocationPayload) => void): () => void {
  const socket = getSocket();
  socket.on('worker_moved', callback);
  return () => {
    socket.off('worker_moved', callback);
  };
}

export function onWorkerStatusChanged(
  callback: (data: {
    workerId: string;
    isAvailableNow: boolean;
    statusText?: string;
  }) => void
): () => void {
  const socket = getSocket();
  socket.on('worker_status_changed', callback);
  return () => {
    socket.off('worker_status_changed', callback);
  };
}
