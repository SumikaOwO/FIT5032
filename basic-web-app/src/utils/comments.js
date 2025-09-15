export function loadComments() {
  try { return JSON.parse(localStorage.getItem("comments")) || []; }
  catch { return []; }
}

export function getRecipeStats(recipeId) {
  const all = loadComments().filter(c => String(c.recipeId) === String(recipeId) && !c.isDeleted);
  const count = all.length;
  const avg = count === 0 ? 0 : Math.round((all.reduce((s, c) => s + Number(c.rating || 0), 0) / count) * 10) / 10;
  return { average: avg, count };
}
