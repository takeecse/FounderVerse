import axios from "axios";

const API = "http://localhost:5000/api/requests";

export const getReceivedRequests = async () => {
  const token = localStorage.getItem("token");

  return axios.get(
    `${API}/received`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
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

export const getSentRequests = async () => {
  const token = localStorage.getItem("token");

  return axios.get(
    "http://localhost:5000/api/requests/sent",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};