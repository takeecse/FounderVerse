import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/verification`;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getMyVerificationApplications = () =>
  axios.get(`${API}/applications/me`, {
    headers: authHeaders(),
  });

export const submitVerificationApplication = (payload) =>
  axios.post(`${API}/applications`, payload, {
    headers: authHeaders(),
  });
