import axios from "axios";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "../firebase";

const API = `${import.meta.env.VITE_API_URL}/api/posts`;
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
]);

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const uploadImages = async (files) => {
  if (!files.length) return [];
  if (!auth.currentUser) {
    throw new Error("Your secure sign-in expired. Sign in again before uploading photos.");
  }
  if (files.length > MAX_IMAGES) throw new Error("Attach up to 4 photos.");

  return Promise.all(files.map(async (file) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error(`${file.name} is not a supported image.`);
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      throw new Error(`${file.name} must be smaller than 8 MB.`);
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
    const storagePath = `posts/${auth.currentUser.uid}/${crypto.randomUUID()}-${safeName}`;
    const uploaded = await uploadBytes(ref(storage, storagePath), file, {
      contentType: file.type,
    });

    return {
      url: await getDownloadURL(uploaded.ref),
      name: file.name,
      contentType: file.type,
      size: file.size,
    };
  }));
};

const excludeParams = (exclude = []) => ({
  exclude: exclude.slice(0, 160).join(","),
});

export const getFeedPosts = (exclude = []) =>
  axios.get(`${API}/feed`, {
    params: { limit: 12, ...excludeParams(exclude) },
    headers: localStorage.getItem("token") ? authHeaders() : {},
  });

export const getUserPosts = (userId, exclude = []) =>
  axios.get(`${API}/user/${userId}`, {
    params: { limit: 10, ...excludeParams(exclude) },
    headers: localStorage.getItem("token") ? authHeaders() : {},
  });

export const getStartupPosts = (startupId, exclude = []) =>
  axios.get(`${API}/startup/${startupId}`, {
    params: { limit: 10, ...excludeParams(exclude) },
    headers: localStorage.getItem("token") ? authHeaders() : {},
  });

export const createPost = async (payload, files = []) => {
  const images = await uploadImages(files);
  return axios.post(`${API}/`, { ...payload, images }, { headers: authHeaders() });
};

export const togglePostReaction = (postId, reaction) =>
  axios.put(`${API}/${postId}/reaction`, { reaction }, { headers: authHeaders() });

export const getPostComments = (postId, page = 1) =>
  axios.get(`${API}/${postId}/comments`, { params: { page, limit: 20 } });

export const addPostComment = (postId, message) =>
  axios.post(`${API}/${postId}/comments`, { message }, { headers: authHeaders() });
