import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDsWjs9r81XxwVl9oLqAqeWkpeSnv51eLc",
  authDomain: "founderverse-8246a.firebaseapp.com",
  projectId: "founderverse-8246a",
  storageBucket: "founderverse-8246a.firebasestorage.app",
  messagingSenderId: "5803579698",
  appId: "1:5803579698:web:d3398a7039f6779de41f2b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);