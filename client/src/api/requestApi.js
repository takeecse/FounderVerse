import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/requests`;

export const sendRequest = async (
  receiverId,
  startupId,
  message
) => {
  const token = localStorage.getItem("token");

  return axios.post(
    API,
    {
      receiverId,
      startupId,
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getReceivedRequests = async () => {
  const token = localStorage.getItem("token");

  return axios.get(`${API}/received`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getSentRequests = async () => {
  const token = localStorage.getItem("token");

  return axios.get(`${API}/sent`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const acceptRequest = async (id) => {
  const token = localStorage.getItem("token");

  return axios.put(
    `${API}/${id}/accept`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const rejectRequest = async (id) => {
  const token = localStorage.getItem("token");

  return axios.put(
    `${API}/${id}/reject`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};