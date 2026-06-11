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