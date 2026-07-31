import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/chat`;

export const getConversation = (
  userId,
  params = {}
) => {
  const token =
    localStorage.getItem("token");

  return axios.get(
    `${API}/${userId}`,
    {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const sendMessage = (receiverId, message) => {
  const token = localStorage.getItem("token");

  return axios.post(
    `${API}/send`,
    {
      receiverId,
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getConversations = () => {
  const token = localStorage.getItem("token");

  return axios.get(
    `${API}/conversations`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const markConversationRead = (userId) => {
  const token = localStorage.getItem("token");

  return axios.put(
    `${API}/${userId}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
