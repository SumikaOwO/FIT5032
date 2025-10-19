<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-7">
        <h1 class="text-center mb-3">Sign In</h1>

        <form @submit.prevent="submitForm" novalidate>
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <div class="input-wrap position-relative">
              <input
                id="email"
                type="email"
                class="form-control"
                v-model="formData.email"
                :class="inputClass('email')"
                @input="onEmailInput"
                autocomplete="email"
              />
            </div>
            <div v-if="shouldShowError('email')" class="text-danger mt-1">{{ errors.email }}</div>
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <div class="input-wrap position-relative">
              <input
                id="password"
                type="password"
                class="form-control"
                v-model="formData.password"
                :class="inputClass('password')"
                @input="onPasswordInput"
                autocomplete="current-password"
              />
            </div>
            <div v-if="shouldShowError('password')" class="text-danger mt-1">{{ errors.password }}</div>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-primary" type="submit" :disabled="submitting">
              {{ submitting ? 'Signing in...' : 'Sign In' }}
            </button>
            <button class="btn btn-outline-secondary" type="button" @click="goRegister">
              Create Account
            </button>
          </div>

          <div v-if="submitError" class="alert alert-danger mt-3">{{ submitError }}</div>
        </form>

        <div class="mt-4">
          <button class="btn btn-link p-0" type="button" @click="toggleReset">
            {{ showReset ? 'Close password reset' : 'Forgot password?' }}
          </button>
        </div>

        <div v-if="showReset" class="card mt-3">
          <div class="card-body">
            <h5 class="card-title mb-2">Reset password</h5>
            <p class="text-muted small mb-3">Enter your email address to receive a reset link.</p>
            <form @submit.prevent="submitResetRequest" novalidate>
              <div class="mb-3">
                <label for="reset-email" class="form-label">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  class="form-control"
                  v-model="resetEmail"
                  autocomplete="email"
                />
              </div>
              <button class="btn btn-secondary" type="submit" :disabled="resetSending">
                {{ resetSending ? 'Sending...' : 'Send Reset Link' }}
              </button>
            </form>
            <div v-if="resetSuccess" class="alert alert-success mt-3">
              We have sent a reset link to your email. Please follow the instructions to set a new password.
            </div>
            <div v-if="resetError" class="alert alert-danger mt-3">{{ resetError }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="toast-container position-fixed top-0 start-50 translate-middle-x p-3" style="z-index:1100;">
    <div class="toast text-bg-success border-0" ref="toastRef" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">{{ toastMsg }}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from '@/firebase/init'
import { useAuth } from '@/composables/useAuth.js'
import { Toast } from 'bootstrap'

const router = useRouter()
const route = useRoute()
const { setUserSession } = useAuth()

const formData = ref({ email: '', password: '' })
const errors = ref({ email: null, password: null })
const touched = ref({ email: false, password: false })
const submitting = ref(false)
const submitError = ref('')
const showReset = ref(false)
const resetEmail = ref('')
const resetSending = ref(false)
const resetSuccess = ref(false)
const resetError = ref('')

const toastRef = ref(null)
const toastMsg = ref('')
let toastInst

onMounted(() => {
  toastInst = new Toast(toastRef.value, { autohide: true, delay: 1800 })
})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateEmail = () => {
  const v = formData.value.email.trim()
  if (!v) { errors.value.email = 'Email is required.'; return }
  if (!emailRegex.test(v)) { errors.value.email = 'Enter a valid email.'; return }
  errors.value.email = null
}
const validatePassword = () => {
  const v = formData.value.password
  if (!v) { errors.value.password = 'Password is required.'; return }
  errors.value.password = null
}

const onEmailInput = () => { touched.value.email = true; validateEmail() }
const onPasswordInput = () => { touched.value.password = true; validatePassword() }

const shouldShowError = (f) => touched.value[f] && !!errors.value[f]
const inputClass = (f) => ({ 'is-invalid': shouldShowError(f) })

const goRegister = () => router.push('/register')
const toggleReset = () => {
  showReset.value = !showReset.value
  resetError.value = ''
  resetSuccess.value = false
  if (showReset.value && !resetEmail.value) {
    resetEmail.value = formData.value.email.trim()
  }
}

const submitResetRequest = async () => {
  const emailValue = (resetEmail.value || formData.value.email || '').trim()
  resetError.value = ''
  resetSuccess.value = false
  if (!emailValue) {
    resetError.value = 'Please enter your email.'
    return
  }
  if (!emailRegex.test(emailValue)) {
    resetError.value = 'Enter a valid email.'
    return
  }
  resetEmail.value = emailValue
  resetSending.value = true
  try {
    const sendReset = httpsCallable(functions, 'sendPasswordResetEmail')
    await sendReset({ email: emailValue })
    resetSuccess.value = true
  } catch (err) {
    resetError.value = 'Unable to send reset email. Please try again soon.'
    console.error('reset email failed', err)
  } finally {
    resetSending.value = false
  }
}

const showWelcomeAndGo = (name, dest) => {
  toastMsg.value = `Welcome, ${name}!`
  const goBackSafe = () => {
    if (window.history.length > 1) router.back()
    else router.push({ name: 'Home' })
  }
  const handler = () => {
    toastRef.value.removeEventListener('hidden.bs.toast', handler)
    if (dest === 'back') goBackSafe()
    else router.push(dest)
  }
  toastRef.value.addEventListener('hidden.bs.toast', handler)
  toastInst.show()
}

const submitForm = async () => {
  Object.keys(touched.value).forEach(k => touched.value[k] = true)
  validateEmail(); validatePassword()
  if (Object.values(errors.value).some(e => e)) return

  submitError.value = ''
  submitting.value = true
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      formData.value.email.trim(),
      formData.value.password
    )

    let roleText = 'user'
    let display = cred.user.displayName || ''
    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (snap.exists()) {
        const { role, usernameRaw } = snap.data()
        roleText = role || 'user'
        if (usernameRaw) display = usernameRaw
      }
    } catch {}

    const userObj = { id: cred.user.uid, username: display || 'User', role: roleText }
    setUserSession(userObj)

    const hasRedirect = typeof route.query.redirect === 'string' && route.query.redirect
    const dest = roleText === 'admin'
      ? { name: 'Admin' }
      : (hasRedirect ? route.query.redirect : 'back')

    showWelcomeAndGo(display || 'User', dest)
  } catch (e) {
    const code = e?.code || ''
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      submitError.value = 'Incorrect email or password.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.input-wrap { position: relative; }
.is-invalid { border-color: #dc3545 !important; }
</style>
