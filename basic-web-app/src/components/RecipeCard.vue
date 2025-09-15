<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { getRecipeStats } from "@/utils/comments.js";

const props = defineProps({ recipe: { type: Object, required: true } });
const router = useRouter();
const stats = computed(() => getRecipeStats(props.recipe.id));
const goDetail = () => router.push(`/findRecipe/${props.recipe.id}`);

</script>

<template>
  <article class="card" @click="goDetail" role="button" tabindex="0">
    <div class="thumb" :style="{ backgroundImage: recipe.image ? `url(${recipe.image})` : '' }" />
    <div class="body">
      <h3 class="title">{{ recipe.title }}</h3>
      <div class="tags">
        <span v-for="t in recipe.tags" :key="t" class="tag">#{{ t }}</span>
      </div>
      <div class="rating">
        <span class="stars">
          <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(stats.average) }">&#9733;</span>
        </span>
        <span class="meta">{{ stats.average.toFixed(1) }} · {{ stats.count }} review(s)</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card { display:grid; grid-template-columns:120px 1fr; gap:12px; background:#fff; border:1px solid #eee; border-radius:12px; padding:10px; cursor:pointer; }
.thumb { width:120px; height:90px; border-radius:8px; background:#f3f4f6; background-size:cover; background-position:center; }
.title { margin:0 0 4px; font-size:1.05rem; }
.tags { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px; }
.tag { font-size:.8rem; background:#f1f5f9; padding:2px 8px; border-radius:999px; }
.rating { display:flex; align-items:center; gap:8px; }
.star { opacity:.35; }
.star.filled { opacity:1; }
.meta { font-size:.85rem; color:#555; }
</style>
