import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAWwYrQDW5e3D8hbFC4VTvgvCe0FOB0BtY",
  authDomain: "u-health-b4fde.firebaseapp.com",
  projectId: "u-health-b4fde",
  storageBucket: "u-health-b4fde.firebasestorage.app",
  messagingSenderId: "999981085929",
  appId: "1:999981085929:web:170e29a3ea332fcd1bac78"
};

initializeApp(firebaseConfig);
const app = createApp(App);
app.use(router)
app.mount('#app')
