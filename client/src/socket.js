import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 4000,
  timeout: 12000,
  transports: ["websocket", "polling"],
});

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    socket.disconnect();
    return socket;
  }

  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  socket.disconnect();
  socket.auth = {};
};

export default socket;
