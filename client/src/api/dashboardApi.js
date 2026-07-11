import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/dashboard`;

export const getDashboardStats = async () => {
  const token = localStorage.getItem("token");

  return axios.get(API, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};