// src/lib/firebase.ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDidFtzxu9hlStMX9FB_c983pnlDIgFoOg",
  authDomain: "riai-by-nm.firebaseapp.com",
  projectId: "riai-by-nm",
  storageBucket: "riai-by-nm.appspot.com",
  messagingSenderId: "848421435426",
  appId: "1:848421435426:web:38e1d9b21e555a82a5f27b",
  measurementId: "G-ELFYSD2HPF"
};

export const app = initializeApp(firebaseConfig);
