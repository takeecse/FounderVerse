import axios from "axios";

const API =
  "http://localhost:5000/api/chat";

export const getConversation = (
  userId
) => {
  const token =
    localStorage.getItem("token");

  return axios.get(
    `${API}/${userId}`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );
};

export const sendMessage = (
  receiverId,
  message
) => {
  const token =
    localStorage.getItem("token");

  return axios.post(
    `${API}/send`,
    {
      receiverId,
      message,
    },
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );
};

export const getConversations = () => {
  const token =
    localStorage.getItem("token");

  return axios.get(
    `${API}/conversations`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );
};