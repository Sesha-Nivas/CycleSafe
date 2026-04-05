import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDb_a7mJzs-0BIgA9MU2fgwiCshkOmAEWo",
  authDomain: "cyclesafe-ce446.firebaseapp.com",
  projectId: "cyclesafe-ce446",
  storageBucket: "cyclesafe-ce446.firebasestorage.app",
  messagingSenderId: "207511657274",
  appId: "1:207511657274:web:d56ace7a0651a684068e03"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);