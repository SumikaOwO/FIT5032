// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRI9Er0WXR0QoKPLuFLoYTUL5OTKJtH6k",
  authDomain: "week7-yuanhaoli.firebaseapp.com",
  projectId: "week7-yuanhaoli",
  storageBucket: "week7-yuanhaoli.firebasestorage.app",
  messagingSenderId: "680000462192",
  appId: "1:680000462192:web:2167b4c9584f98d49d03b5"
};

// Initialize Firebase
initializeApp(firebaseConfig);
const db = getFirestore()
export default db