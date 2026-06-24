import axios from "axios";

const API = "http://localhost:5000/api/users";

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
  return axios.get(
    "http://localhost:5000/api/users"
  );
};

export const getUserById = async (id) => {
  return axios.get(
    `http://localhost:5000/api/users/${id}`
  );
};

export const getConnections = async () => {
  const token = localStorage.getItem("token");

  return axios.get(
    `${API}/connections`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};