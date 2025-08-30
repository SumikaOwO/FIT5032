<script setup>
const tools = [
  {
    key: 'calorie',
    title: 'Daily Calorie Calculator',
    desc: 'Estimate BMR and daily maintenance calories.',
    route: '/calculator',
    // img: '/tools/calorie.jpg',
    alt: 'Calorie calculator illustration'
  }
]
</script>

<template>
  <section>
    <header class="mb-4">
      <h1 class="mb-1">Tools</h1>
      <p class="text-muted">Quick calculator for everyday calorie income.</p>
    </header>

    <div class="row g-3">
      <div class="col-12 col-sm-6 col-lg-4" v-for="t in tools" :key="t.key">
        <div class="card h-100">
          <router-link :to="t.route" class="text-decoration-none" aria-label="Open tool">
            <img :src="t.img" class="card-img-top" :alt="t.alt" />
          </router-link>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ t.title }}</h5>
            <p class="card-text flex-grow-1">{{ t.desc }}</p>
            <router-link :to="t.route" class="btn btn-primary align-self-start" aria-label="Open {{ t.title }}">Open</router-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
