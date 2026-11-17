import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/users`;

export const getProfile = async () => {
  const token = localStorage.getItem("token");

  return axios.get(`${API}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateProfile = async (profileData) => {
  const token = localStorage.getItem("token");

  return axios.put(
    `${API}/profile`,
    profileData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getAllUsers = async () => {
  return axios.get(API);
};

export const getUserById = async (id) => {
  const token = localStorage.getItem("token");
  return axios.get(`${API}/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

export const getConnections = async () => {
  const token = localStorage.getItem("token");

  return axios.get(`${API}/connections`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const blockUser = async (id) => {
  const token = localStorage.getItem("token");
  return axios.post(`${API}/${id}/block`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const unblockUser = async (id) => {
  const token = localStorage.getItem("token");
  return axios.delete(`${API}/${id}/block`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
