import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Resources from '../views/Resources.vue'
import Calculator from '../views/Calculator.vue'
import Tools from '../views/Tools.vue'
import About from '../views/About.vue'
import Admin from '@/views/Admin.vue'
import FindRecipe from '@/views/FindRecipe.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import RecipeDetail from '@/views/RecipeDetail.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/resources', name: 'Resources', component: Resources },
  { path: '/about', name: 'About', component: About },
  { path: '/calculator', name: 'Calculator', component: Calculator },
  { path: '/tools', name: 'Tools', component: Tools },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/findRecipe', name: 'FindRecipe', component: FindRecipe },
  { path: '/recipeDetail', name: 'RecipeDetail', component: RecipeDetail },
  { path: '/admin', name: 'Admin', component: Admin }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router