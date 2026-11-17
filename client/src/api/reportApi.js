import axios from "axios";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "../firebase";

const API = `${import.meta.env.VITE_API_URL}/api/reports`;

const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const isSupportedFile = (file) =>
  ALLOWED_TYPES.has(file.type);

const uploadAttachments = async (files) => {
  if (!files.length) return [];
  if (!auth.currentUser) {
    throw new Error("Your secure sign-in expired. Sign in again before uploading files.");
  }
  if (files.length > 5) throw new Error("Attach up to 5 files.");

  return Promise.all(files.map(async (file) => {
    if (!isSupportedFile(file)) {
      throw new Error(`${file.name} is not a supported image or document.`);
    }
    if (file.size <= 0 || file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error(`${file.name} must be smaller than 8 MB.`);
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
    const storagePath = `reports/${auth.currentUser.uid}/${crypto.randomUUID()}-${safeName}`;
    const uploaded = await uploadBytes(ref(storage, storagePath), file, {
      contentType: file.type || "application/octet-stream",
    });
    const url = await getDownloadURL(uploaded.ref);

    return {
      url,
      name: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    };
  }));
};

export const submitReport = async (payload, files = []) => {
  const attachments = await uploadAttachments(files);

  return axios.post(`${API}/`, { ...payload, attachments }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};
