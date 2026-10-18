import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/admin`;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getAdminOverview = () =>
  axios.get(`${API}/overview`, {
    headers: authHeaders(),
  });

export const getAdminVerificationApplications = (
  params = {}
) =>
  axios.get(`${API}/verification`, {
    params,
    headers: authHeaders(),
  });

export const reviewVerificationApplication = (
  id,
  payload
) =>
  axios.patch(`${API}/verification/${id}`, payload, {
    headers: authHeaders(),
  });

export const getAdminUsers = () =>
  axios.get(`${API}/users`, {
    headers: authHeaders(),
  });

export const updateAdminUser = (id, payload) =>
  axios.patch(`${API}/users/${id}`, payload, {
    headers: authHeaders(),
  });

export const getAdminStartups = () =>
  axios.get(`${API}/startups`, {
    headers: authHeaders(),
  });

export const moderateAdminStartup = (id, moderationStatus) =>
  axios.patch(
    `${API}/startups/${id}/moderation`,
    { moderationStatus },
    { headers: authHeaders() }
  );

export const getAdminReports = () =>
  axios.get(`${API}/reports`, {
    headers: authHeaders(),
  });

export const reviewAdminReport = (id, payload) =>
  axios.patch(`${API}/reports/${id}`, payload, {
    headers: authHeaders(),
  });

export const getAdminModerationQueue = () =>
  axios.get(`${API}/moderation`, {
    headers: authHeaders(),
  });
