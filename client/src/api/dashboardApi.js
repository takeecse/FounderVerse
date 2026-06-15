import axios from "axios";

const API =
  "http://localhost:5000/api/dashboard";

export const getDashboardStats =
async () => {
  const token =
    localStorage.getItem("token");

  return axios.get(API, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};