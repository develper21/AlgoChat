import { io } from 'socket.io-client';

let socketInstance = null;

export const initSocket = (token) => {
  if (!token) return null;
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token }
  });

  return socketInstance;
};

export const getSocket = () => socketInstance;
