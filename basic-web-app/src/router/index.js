import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Resources from '../views/Resources.vue'
import Calculator from '../views/Calculator.vue'
import Tools from '../views/Tools.vue'
import About from '../views/About.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/resources', name: 'Resources', component: Resources },
  { path: '/about', name: 'About', component: About },
  { path: '/calculator', name: 'Calculator', component: Calculator },
  { path: '/tools', name: 'Tools', component: Tools }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router