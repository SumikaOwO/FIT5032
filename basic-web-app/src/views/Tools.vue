<script setup>
const tools = [
  {
    key: 'calorie',
    title: 'Daily Calorie Calculator',
    desc: 'Estimate BMR and daily maintenance calories.',
    route: '/calculator',
    alt: 'Calorie calculator illustration'
  }
]
</script>

<template>
  <section class="tools-section">
    <div class="container">
      <header class="row mb-4">
        <div class="col-12 col-md-10 col-lg-8 col-xxl-7 mx-auto">
          <h1 class="mb-2">Tools</h1>
          <p class="text-muted mb-0">Quick calculator for everyday calorie intake.</p>
        </div>
      </header>

      <div class="row g-4 justify-content-center">
        <div class="col-12 col-md-10 col-lg-6 col-xxl-5" v-for="t in tools" :key="t.key">
          <div class="card tool-card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-2">{{ t.title }}</h5>
              <p class="card-text mb-3">{{ t.desc }}</p>
              <router-link :to="t.route" class="btn btn-primary" :aria-label="`Open ${t.title}`">Open</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tools-section {
  padding: 2.5rem 0;
  background: #fff;
}
.tool-card {
  border-radius: 14px;
  overflow: hidden;
  transition: transform .15s ease, box-shadow .15s ease;
}
.tool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1.25rem rgba(0,0,0,.08);
}
h1 {
  font-weight: 700;
  letter-spacing: .2px;
}
@media (max-width: 576px) {
  .btn.btn-primary {
    width: 100%;
  }
}
</style>
