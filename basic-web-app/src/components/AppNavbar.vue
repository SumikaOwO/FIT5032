<template>
  <nav class="navbar navbar-expand-lg bg-light border-bottom">
    <div class="container">
      <router-link class="navbar-brand" to="/">U Health</router-link>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav"
              aria-controls="nav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="nav" class="collapse navbar-collapse">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item"><router-link class="nav-link" to="/">Home</router-link></li>
          <li class="nav-item"><router-link class="nav-link" to="/resources">Resources</router-link></li>

          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="toolsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Tools</a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="toolsDropdown">
              <li><router-link class="dropdown-item" to="/tools">All Tools</router-link></li>
              <li><router-link class="dropdown-item" to="/calculator">Daily Calorie Calculator</router-link></li>
            </ul>
          </li>

          <li class="nav-item"><router-link class="nav-link" to="/about">About</router-link></li>
        </ul>
      </div>
    </div>
  </nav>
</template>
