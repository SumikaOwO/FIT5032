import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'bootstrap/dist/css/bootstrap.min.css'

// import './assets/main.css'
// import './style.css'

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

const app = createApp(App);
app.use(PrimeVue,{
    theme: {
        preset: Aura
    }
});
app.use(router)

app.mount('#app')
