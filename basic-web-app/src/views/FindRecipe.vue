<script setup>
import { ref, computed } from "vue";
import RecipeCard from "@/components/RecipeCard.vue";
import recipes from "@/assets/json/recipes.json";

const q = ref("");
const selectedTags = ref([]);
const allTags = computed(() => {
  const set = new Set();
  recipes.forEach(r => r.tags.forEach(t => set.add(t)));
  return Array.from(set).sort();
});
const filtered = computed(() => {
  const kw = q.value.trim().toLowerCase();
  return recipes.filter(r => {
    const okKw = kw ? (r.title.toLowerCase().includes(kw) || r.tags.some(t => t.includes(kw))) : true;
    const okTag = selectedTags.value.length ? selectedTags.value.every(t => r.tags.includes(t)) : true;
    return okKw && okTag;
  });
});
</script>

<template>
  <div class="wrap">
    <h1>Find Recipe</h1>

    <div class="controls">
      <input class="input" v-model="q" placeholder="Search by title or tag..." />
      <div class="tags">
        <label v-for="t in allTags" :key="t" class="tag">
          <input type="checkbox" :value="t" v-model="selectedTags" />
          <span>{{ t }}</span>
        </label>
      </div>
    </div>

    <div class="grid">
      <RecipeCard v-for="r in filtered" :key="r.id" :recipe="r" />
    </div>

    <div v-if="filtered.length === 0" class="empty">No recipes found.</div>
  </div>
</template>

<style scoped>
.wrap { display:grid; gap:14px; }
.controls { display:grid; gap:10px; }
.input { padding:10px 12px; border:1px solid #ddd; border-radius:8px; }
.tags { display:flex; flex-wrap:wrap; gap:8px; }
.tag { display:flex; align-items:center; gap:6px; padding:4px 8px; border:1px solid #e5e7eb; border-radius:999px; background:#fafafa; font-size:.9rem; }
.grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap:12px; }
.empty { color:#666; font-style:italic; }
</style>
