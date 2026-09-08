import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "REDACTED_ROTATE_THIS_KEY",
  authDomain: "tdp-bet.firebaseapp.com",
  databaseURL: "https://tdp-bet-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tdp-bet",
  storageBucket: "tdp-bet.firebasestorage.app",
  messagingSenderId: "685381903619",
  appId: "1:685381903619:web:40815a118b857c071f7536"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// bla