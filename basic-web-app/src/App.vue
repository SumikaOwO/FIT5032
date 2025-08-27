<script setup>
import AppNavbar from './components/AppNavbar.vue'
</script>

<template>
  <div class="main-container">
    <header>
      <AppNavbar />
    </header>
  
    <main class="main-box">
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>
</style>
