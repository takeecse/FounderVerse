import axios from "axios";

const API =
  "http://localhost:5000/api/notifications";

export const getNotifications = () => {
  const token =
    localStorage.getItem("token");

  return axios.get(API, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};