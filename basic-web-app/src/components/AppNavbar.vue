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
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="toolsDropdown"
              role="button"
              ref="toolsToggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >Tools</a>
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
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { Dropdown } from 'bootstrap'

const router = useRouter()
const route = useRoute()
const toolsToggle = ref(null)
const { isAuthed, username, isAdmin, refreshFromStorage, signOutUser } = useAuth()

async function onLogout() {
  await signOutUser()
  router.push({ name: 'Home' })
}

watch(() => route.fullPath, async () => {
  refreshFromStorage()
  await nextTick()
  if (toolsToggle.value) Dropdown.getOrCreateInstance(toolsToggle.value)
})

onMounted(async () => {
  if (toolsToggle.value) Dropdown.getOrCreateInstance(toolsToggle.value)
  window.addEventListener('storage', refreshFromStorage)
  window.addEventListener('focus', refreshFromStorage)
})

onUnmounted(() => {
  window.removeEventListener('storage', refreshFromStorage)
  window.removeEventListener('focus', refreshFromStorage)
})
</script>
