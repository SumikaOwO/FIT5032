import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Resources from '../views/Resources.vue'
import Register from '../views/Register.vue'
import About from '../views/About.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/resources', name: 'Resources', component: Resources },
  { path: '/register', name: 'Register', component: Register },
  { path: '/about', name: 'About', component: About }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router