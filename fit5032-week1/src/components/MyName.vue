<template>
  <div class="my-name">
    <h1>Welcome to my website</h1>
    <p>My name is <strong>{{ name }}</strong></p>
    <a :href="githubUrl" target="_blank" rel="noopener noreferrer">{{ githubUrl }}</a>
  </div>
</template>

<script>
export default {
  name: "MyName",
  data() {
    return {
      name: "Yuanhao Li",
      githubUrl: "https://github.com/SumikaOwO"
    };
  }
};
</script>

<style scoped>
.my-name {
  text-align: center;
  margin-top: 50px;
}
</style>
