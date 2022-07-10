import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCdQNNB6pG8KUGW1YWQCPGR38cINJAss-k",
  authDomain: "imaguesser.firebaseapp.com",
  projectId: "imaguesser",
  storageBucket: "imaguesser.appspot.com",
  messagingSenderId: "650564480876",
  appId: "1:650564480876:web:601c726cbc8f3c56d5cd49",
  measurementId: "G-JZ64LZXWKH"
};

const app = initializeApp(firebaseConfig);

export const authentication = getAuth(app);
