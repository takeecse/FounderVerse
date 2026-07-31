import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
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
