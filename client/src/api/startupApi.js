import axios from "axios";

const API = "http://localhost:5000/api/startups";

export const createStartup = async (startupData) => {
  const token = localStorage.getItem("token");

  return axios.post(
    API,
    startupData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getStartups = async () => {
  return axios.get(API);
};

export const getMyStartups = async () => {
  const token = localStorage.getItem("token");

  return axios.get(
    `${API}/my`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getStartupById = async (id) => {
  return axios.get(`${API}/${id}`);
};