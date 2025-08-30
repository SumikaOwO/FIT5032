<template>
  <div class="container mt-5">
    <h1 class="text-center mb-4">Nutrition Resources</h1>
    <div class="row">
      <div v-for="item in resources" :key="item.id" class="col-md-12 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">{{ item.title }}</h5>
            <p class="card-text">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import resourcesData from '../assets/json/resources.json'

const resources = resourcesData
</script>

<style scoped>
.card {
  border-radius: 12px;
}
.card-title {
  color: #2c3e50;
  font-weight: 600;
}
</style>
