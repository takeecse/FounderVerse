import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/system`;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getSystemOverview = () =>
  axios.get(`${API}/overview`, { headers: authHeaders() });

export const getSystemAccounts = () =>
  axios.get(`${API}/accounts`, { headers: authHeaders() });

export const updateSystemOperatorAccess = (id, systemRole) =>
  axios.patch(
    `${API}/operators/${id}`,
    { systemRole },
    { headers: authHeaders() }
  );
