<template>
  <nav class="navbar navbar-expand-lg bg-light border-bottom">
    <div class="container d-flex align-items-center">
      <router-link v-if="isAdmin" to="/admin" class="btn btn-outline-danger me-3">Admin</router-link>
      <router-link class="navbar-brand" to="/">U Health</router-link>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav"
              aria-controls="nav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="nav" class="collapse navbar-collapse">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item"><router-link class="nav-link" to="/">Home</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/resources">Resources</router-link></li>

          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="toolsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Tools</a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="toolsDropdown">
              <li><router-link class="dropdown-item" to="/tools">All Tools</router-link></li>
              <li><router-link class="dropdown-item" to="/calculator">Daily Calorie Calculator</router-link></li>
            </ul>
          </li>

          <li class="nav-item"><router-link class="nav-link" to="/about">About</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/findRecipe">Find Recipe</router-link></li>

          <li class="nav-item" v-if="!isAuthed">
            <router-link class="nav-link" :to="{ name: 'Login', query: { redirect: route.fullPath } }">Login</router-link>
          </li>
          <li class="nav-item d-flex align-items-center gap-2" v-else>
            <span class="nav-link disabled" style="opacity:.7; cursor:default;">Hi, {{ username }}</span>
            <a href="#" class="nav-link text-danger" @click.prevent="onLogout">Log out</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

function readUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) || null } catch { return null }
}

const user = ref(readUser())
const isAuthed = computed(() => !!user.value)
const username = computed(() => user.value?.username || '')
const isAdmin = computed(() => user.value?.role === 'admin' || localStorage.getItem('app:role') === 'admin')

function refresh() { user.value = readUser() }

function onLogout() {
  localStorage.removeItem('currentUser')
  localStorage.removeItem('app:role')
  localStorage.removeItem('app:username')
  refresh()
  router.push({ name: 'Home' })
}

watch(() => route.fullPath, refresh)
onMounted(() => {
  window.addEventListener('storage', refresh)
  window.addEventListener('focus', refresh)
})
onUnmounted(() => {
  window.removeEventListener('storage', refresh)
  window.removeEventListener('focus', refresh)
})
</script>
