import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth`,
});

export const registerUser = (userData) =>
  API.post("/register", userData);

export const loginUser = (userData) =>
  API.post("/login", userData);

export const firebaseLogin = (authData) =>
  API.post("/firebase", authData);