import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/reports`;

export const submitReport = (payload) =>
  axios.post(`${API}/`, payload, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
