<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import recipes from "@/assets/json/recipes.json";
import RecipeComments from "@/components/RecipeComments.vue";
import { getRecipeStats } from "@/utils/comments.js";

const route = useRoute();
const router = useRouter();
const recipe = computed(() => recipes.find(r => String(r.id) === String(route.params.id)));
const stats = computed(() => recipe.value ? getRecipeStats(recipe.value.id) : { average:0, count:0 });
</script>

<template>
  <div v-if="recipe" class="wrap">
    <button class="back" @click="$router.back()">&larr; Back</button>

    <header class="hero">
      <div class="thumb" :style="{ backgroundImage: recipe.image ? `url(${recipe.image})` : '' }" />
      <div class="info">
        <h1 class="title">{{ recipe.title }}</h1>
        <div class="tags">
          <span v-for="t in recipe.tags" :key="t" class="tag">#{{ t }}</span>
        </div>
        <div class="rating">
          <span class="stars">
            <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(stats.average) }">&#9733;</span>
          </span>
          <span class="meta">{{ stats.average.toFixed(1) }} · {{ stats.count }} review(s)</span>
        </div>
        <div class="nutrition" v-if="recipe.nutrition">
          <span>Calories: {{ recipe.nutrition.calories }}</span>
          <span>Protein: {{ recipe.nutrition.protein }}g</span>
        </div>
      </div>
    </header>

    <section class="section">
      <h3>Ingredients</h3>
      <ul><li v-for="(ing,i) in recipe.ingredients" :key="i">{{ ing }}</li></ul>
    </section>

    <section class="section">
      <h3>Steps</h3>
      <ol><li v-for="(s,i) in recipe.steps" :key="i">{{ s }}</li></ol>
    </section>

    <section class="section">
      <RecipeComments :recipe-id="recipe.id" />
    </section>
  </div>
</template>

<style scoped>
.wrap { display:grid; gap:16px; }
.back { width:max-content; padding:6px 10px; border:1px solid #e5e7eb; border-radius:8px; background:#fff; cursor:pointer; }
.hero { display:grid; grid-template-columns: 220px 1fr; gap:16px; align-items:center; }
.thumb { width:220px; height:160px; border-radius:12px; background:#f3f4f6; background-size:cover; background-position:center; }
.title { margin:0 0 6px; }
.tags { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:6px; }
.tag { background:#f1f5f9; padding:2px 8px; border-radius:999px; font-size:.9rem; }
.rating { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.star { opacity:.35; }
.star.filled { opacity:1; }
.meta { font-size:.9rem; color:#555; }
.nutrition { display:flex; gap:12px; color:#444; }
.section { padding:12px; border:1px solid #eee; border-radius:12px; background:#fff; }
</style>
