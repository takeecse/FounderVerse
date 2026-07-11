import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/notifications`;

export const getNotifications = () => {
  const token = localStorage.getItem("token");

  return axios.get(API, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const markAllNotificationsRead = () => {
  const token = localStorage.getItem("token");

  return axios.put(
    `${API}/read-all`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};