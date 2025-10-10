<template>
  <section class="rc-wrap">
    <div class="rc-aggregate">
      <div class="rc-average">
        <div class="rc-average-num">{{ averageRating.toFixed(1) }}</div>
        <div class="rc-stars" aria-label="average stars">
          <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(averageRating) }">&#9733;</span>
        </div>
        <div class="rc-count">{{ totalCount }} review(s)</div>
      </div>

      <div class="rc-dist">
        <div v-for="i in [5,4,3,2,1]" :key="i" class="rc-dist-row">
          <span class="rc-dist-label">{{ i }}&#9733;&#9733;</span>
          <div class="rc-bar">
            <div class="rc-bar-fill" :style="{ width: (totalCount ? (countByStar[i] / totalCount * 100) : 0) + '%' }" />
          </div>
          <span class="rc-dist-count">{{ countByStar[i] }}</span>
        </div>
      </div>
    </div>

    <div class="rc-form">
      <h3>{{ state.my ? "Edit your review" : "Write a review" }}</h3>

      <div v-if="state.errors.auth" class="rc-alert">
        {{ state.errors.auth }}
        <button class="rc-btn link" @click="goLogin">Sign in</button>
      </div>

      <div class="rc-field">
        <label class="rc-label">Your rating</label>
        <div class="rc-stars input" aria-label="select stars">
          <button
            v-for="i in 5"
            :key="i"
            type="button"
            class="star"
            :class="{ filled: i <= state.ratingInput }"
            @click="setRating(i)"
            aria-pressed="i <= state.ratingInput"
          >&#9733;</button>
        </div>
        <div v-if="state.errors.rating" class="rc-error">{{ state.errors.rating }}</div>
      </div>

      <div class="rc-field">
        <label class="rc-label">Your review</label>
        <textarea
          v-model="state.textInput"
          class="rc-textarea"
          maxlength="500"
          placeholder="Share something helpful about this recipe (max 500 chars)"
        />
        <div v-if="state.errors.text" class="rc-error">{{ state.errors.text }}</div>
      </div>

      <div class="rc-actions">
        <button class="rc-btn primary" @click="submit">
          {{ state.my ? "Save changes" : "Post review" }}
        </button>
      </div>
    </div>

    <div class="rc-list">
      <div class="rc-list-head">
        <h3>All reviews</h3>
        <select v-model.number="state.ratingFilter" class="rc-select" aria-label="Filter by rating">
          <option :value="0">All ratings</option>
          <option :value="5">5&#9733; only</option>
          <option :value="4">4&#9733; only</option>
          <option :value="3">3&#9733; only</option>
          <option :value="2">2&#9733; only</option>
          <option :value="1">1&#9733; only</option>
        </select>
      </div>

      <div v-if="sortedComments.length === 0" class="rc-empty">No reviews yet.</div>

      <article v-for="c in sortedComments" :key="c.id" class="rc-item">
        <header class="rc-item-head">
          <div class="rc-user">{{ c.username }}</div>
          <div class="rc-stars" aria-label="user stars">
            <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= c.rating }">&#9733;</span>
          </div>
        </header>
        <p class="rc-text" v-text="c.text"></p>
        <footer class="rc-item-foot">
          <span class="rc-time">Updated: {{ timeShort(c.updatedAt) }}</span>
          <div class="rc-item-actions">
            <button v-if="canDelete(c)" class="rc-btn danger" @click="deleteComment(c)">Delete</button>
          </div>
        </footer>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

const props = defineProps({
  recipeId: { type: [String, Number], required: true }
});

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("currentUser")) || null; }
  catch { return null; }
}
function loadAllComments() {
  try { return JSON.parse(localStorage.getItem("comments")) || []; }
  catch { return []; }
}
function saveAllComments(list) {
  localStorage.setItem("comments", JSON.stringify(list));
}
function sanitize(s) {
  return String(s).replace(/[&<>"'`=\/]/g, ch => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;", "/":"&#x2F;", "`":"&#x60;", "=":"&#x3D;" }[ch]
  ));
}
function timeShort(iso) {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleString();
}

const router = useRouter();
const route = useRoute();

const currentUser = ref(getCurrentUser());
const isAdmin = computed(() => currentUser.value?.role === "admin");

const state = reactive({
  comments: [],
  my: null,
  ratingInput: 0,
  textInput: "",
  errors: {},
  ratingFilter: 0
});

function refreshUser() {
  currentUser.value = getCurrentUser();
  if (currentUser.value) state.errors = {};
}

function loadRecipeComments() {
  const all = loadAllComments();
  state.comments = all.filter(c => String(c.recipeId) === String(props.recipeId) && !c.isDeleted);
  state.my = state.comments.find(c => c.userId === currentUser.value?.id) || null;
  if (state.my) {
    state.ratingInput = state.my.rating;
    state.textInput = state.my.text;
  } else {
    state.ratingInput = 0;
    state.textInput = "";
  }
}

onMounted(() => {
  refreshUser();
  loadRecipeComments();
  window.addEventListener("focus", refreshUser);
  window.addEventListener("storage", refreshUser);
});
onUnmounted(() => {
  window.removeEventListener("focus", refreshUser);
  window.removeEventListener("storage", refreshUser);
});
watch(() => props.recipeId, () => { loadRecipeComments(); });

const averageRating = computed(() => {
  if (state.comments.length === 0) return 0;
  const sum = state.comments.reduce((a, c) => a + Number(c.rating || 0), 0);
  return Math.round((sum / state.comments.length) * 10) / 10;
});
const totalCount = computed(() => state.comments.length);
const countByStar = computed(() => {
  const m = { 5:0,4:0,3:0,2:0,1:0 };
  state.comments.forEach(c => { m[c.rating] = (m[c.rating] || 0) + 1; });
  return m;
});

const visibleComments = computed(() => {
  if (!state.ratingFilter) return state.comments;
  return state.comments.filter(c => Number(c.rating) === Number(state.ratingFilter));
});
const sortedComments = computed(() => {
  const arr = [...visibleComments.value];
  arr.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return arr;
});

function validate() {
  refreshUser();
  const errs = {};
  if (!currentUser.value) errs.auth = "Please sign in to post a review.";
  if (state.ratingInput < 1 || state.ratingInput > 5) errs.rating = "Please select a rating (1~5).";
  const t = (state.textInput || "").trim();
  if (t.length < 5) errs.text = "Review must be at least 5 characters.";
  if (t.length > 500) errs.text = "Review must be 500 characters or fewer.";
  state.errors = errs;
  return Object.keys(errs).length === 0;
}

function submit() {
  if (!validate()) return;
  const all = loadAllComments();
  const now = new Date().toISOString();

  if (state.my) {
    const idx = all.findIndex(c => c.id === state.my.id);
    if (idx > -1) {
      all[idx] = {
        ...all[idx],
        rating: state.ratingInput,
        text: sanitize((state.textInput || "").trim()),
        updatedAt: now
      };
    }
  } else {
    const newC = {
      id: crypto.randomUUID(),
      recipeId: String(props.recipeId),
      userId: currentUser.value.id,
      username: currentUser.value.username || "User",
      rating: state.ratingInput,
      text: sanitize((state.textInput || "").trim()),
      createdAt: now,
      updatedAt: now,
      isDeleted: false
    };
    all.push(newC);
  }
  saveAllComments(all);
  loadRecipeComments();
}

function canDelete(c){ return currentUser.value && (isAdmin.value || c.userId === currentUser.value.id); }

function deleteComment(c) {
  if (!canDelete(c)) return;
  if (!confirm("Delete this review?")) return;
  const all = loadAllComments();
  const idx = all.findIndex(x => x.id === c.id);
  if (idx > -1) {
    all[idx].isDeleted = true;
    all[idx].updatedAt = new Date().toISOString();
    saveAllComments(all);
    loadRecipeComments();
  }
}

function setRating(val) { state.ratingInput = val; }

function goLogin() {
  router.push({ name: "Login", query: { redirect: route.fullPath } });
}
</script>

<style scoped>
.rc-wrap { display: grid; gap: 1.25rem; }
.rc-aggregate { display: grid; grid-template-columns: 220px 1fr; gap: 1rem; align-items: center; }
.rc-average { display: grid; justify-items: center; gap: .25rem; padding: .75rem; border-radius: .75rem; background: #f7f7f9; }
.rc-average-num { font-size: 2.25rem; font-weight: 700; line-height: 1; }
.rc-count { font-size: .875rem; color: #666; }
.rc-stars { line-height: 1; }
.star { font-size: 1.1rem; border: 0; background: transparent; cursor: default; opacity: .35; }
.star.filled { opacity: 1; }
.rc-stars.input .star { cursor: pointer; font-size: 1.4rem; }

.rc-dist { display: grid; gap: .25rem; }
.rc-dist-row { display: grid; grid-template-columns: 36px 1fr 34px; align-items: center; gap: .5rem; }
.rc-dist-label { font-size: .875rem; color: #444; }
.rc-bar { height: 8px; background: #eee; border-radius: 999px; overflow: hidden; }
.rc-bar-fill { height: 100%; width: 0; background: #5aa770; }

.rc-form { padding: 1rem; border: 1px solid #eee; border-radius: .75rem; }
.rc-field { margin-bottom: .75rem; }
.rc-label { display: block; font-weight: 600; margin-bottom: .35rem; }
.rc-textarea { width: 100%; min-height: 96px; padding: .6rem .75rem; border: 1px solid #ddd; border-radius: .5rem; }
.rc-actions { display: flex; gap: .5rem; align-items: center; }

.rc-btn { padding: .5rem .8rem; border-radius: .5rem; border: 1px solid #ddd; background: #fff; cursor: pointer; }
.rc-btn.primary { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.rc-btn.danger { background: #ef4444; color: #fff; border-color: #ef4444; }
.rc-btn.link { background: transparent; border: none; color: #2563eb; padding: 0 .25rem; }

.rc-alert { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; padding: .5rem .75rem; border-radius: .5rem; display: flex; align-items: center; gap: .5rem; margin-bottom: .75rem; }

.rc-list { display: grid; gap: .75rem; }
.rc-list-head { display: flex; justify-content: space-between; align-items: center; }
.rc-select { padding: .4rem .5rem; border-radius: .5rem; border: 1px solid #ddd; background: #fff; }
.rc-empty { color:#666; font-style: italic; padding: .25rem 0; }

.rc-item { padding: .75rem; border: 1px solid #eee; border-radius: .75rem; background: #fff; }
.rc-item-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: .25rem; }
.rc-user { font-weight: 600; }
.rc-text { white-space: pre-wrap; margin: .25rem 0 .5rem; }
.rc-item-foot { display: flex; justify-content: space-between; align-items: center; font-size: .875rem; color: #666; }
.rc-item-actions { display: flex; gap: .25rem; }
</style>
