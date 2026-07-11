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

export const getStartups = async () => {
  return axios.get(API);
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