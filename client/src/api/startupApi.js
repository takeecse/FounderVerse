import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/startups`;

export const createStartup = async (startupData) => {
  const token = localStorage.getItem("token");

  return axios.post(API, startupData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// params: { q, industry, stage, hiring, sort, page, limit }
// The token is optional: logged-in users get "best match" ordering.
export const getStartups = async (params = {}) => {
  const token = localStorage.getItem("token");

  return axios.get(API, {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

export const getRecommendedStartups = async () => {
  const token = localStorage.getItem("token");

  return axios.get(`${API}/recommended`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getMyStartups = async () => {
  const token = localStorage.getItem("token");

  return axios.get(`${API}/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getStartupById = async (id) => {
  return axios.get(`${API}/${id}`);
};

export const updateStartup = async (id, startupData) => {
  const token = localStorage.getItem("token");

  return axios.put(`${API}/${id}`, startupData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteStartup = async (id) => {
  const token = localStorage.getItem("token");

  return axios.delete(`${API}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const removeTeamMember = async (startupId, memberId) => {
  const token = localStorage.getItem("token");

  return axios.delete(`${API}/${startupId}/team/${memberId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};