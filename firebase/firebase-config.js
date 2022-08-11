import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  // apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  // messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  // appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASURMENT_ID
  apiKey: "AIzaSyCdQNNB6pG8KUGW1YWQCPGR38cINJAss-k",
  authDomain: "imaguesser.firebaseapp.com",
  projectId: "imaguesser",
  storageBucket: "imaguesser.appspot.com",
  messagingSenderId: "650564480876",
  appId: "1:650564480876:web:601c726cbc8f3c56d5cd49",
  measurementId: "G-JZ64LZXWKH"
  
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app)
export const authentication = getAuth(app);
