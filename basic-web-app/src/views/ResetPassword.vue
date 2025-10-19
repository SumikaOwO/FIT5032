<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-body">
            <h1 class="h4 mb-3">Reset Password</h1>
            <p v-if="email" class="text-muted">
              Resetting password for <strong>{{ email }}</strong>
            </p>

            <div v-if="stage === 'checking'" class="text-center text-muted py-4">
              Checking your reset link...
            </div>

            <form v-else-if="stage === 'form'" @submit.prevent="submit">
              <div class="mb-3">
                <label for="new-password" class="form-label">New password</label>
                <input
                  id="new-password"
                  type="password"
                  class="form-control"
                  v-model="password"
                  autocomplete="new-password"
                />
              </div>
              <div class="mb-3">
                <label for="confirm-password" class="form-label">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  class="form-control"
                  v-model="confirmPassword"
                  autocomplete="new-password"
                />
              </div>
              <button class="btn btn-primary" type="submit" :disabled="submitting">
                {{ submitting ? 'Saving...' : 'Set new password' }}
              </button>
            </form>

            <div v-else-if="stage === 'done'" class="alert alert-success mb-0">
              Password updated. Redirecting to sign in...
              <div class="small mt-1">
                If nothing happens, <router-link to="/login">click here</router-link>.
              </div>
            </div>

            <div v-else class="alert alert-danger mb-0">
              {{ error || 'This reset link is no longer valid. Please request a new one.' }}
            </div>

            <div v-if="error && stage === 'form'" class="alert alert-danger mt-3">{{ error }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth'
import { auth } from '@/firebase/init'

const route = useRoute()
const router = useRouter()

const code = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const error = ref('')
const stage = ref('checking')
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
let redirectTimer = null

onMounted(async () => {
  const incoming = typeof route.query.oobCode === 'string' ? route.query.oobCode : ''
  code.value = incoming

  if (!incoming) {
    error.value = 'Invalid password reset link.'
    stage.value = 'error'
    return
  }

  try {
    email.value = await verifyPasswordResetCode(auth, incoming)
    stage.value = 'form'
  } catch {
    error.value = 'This reset link has expired or is invalid.'
    stage.value = 'error'
  }
})

const submit = async () => {
  error.value = ''
  if (password.value.trim().length < 8) {
    error.value = 'Min 8 chars with letters and numbers.'
    return
  }
  if (!passwordRegex.test(password.value.trim())) {
    error.value = 'Min 8 chars with letters and numbers.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  submitting.value = true
  try {
    await confirmPasswordReset(auth, code.value, password.value)
    stage.value = 'done'
    redirectTimer = setTimeout(() => {
      router.push({ name: 'Login', query: { reset: 'success' } })
    }, 1500)
  } catch {
    error.value = 'Unable to reset password. Please request a new link.'
  } finally {
    submitting.value = false
  }
}

onUnmounted(() => {
  if (redirectTimer) clearTimeout(redirectTimer)
})
</script>

<style scoped>
.card {
  border-radius: 16px;
  border: none;
}
</style>
