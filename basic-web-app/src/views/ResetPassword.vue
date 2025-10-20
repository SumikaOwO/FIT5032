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

            <form v-else-if="stage === 'form'" @submit.prevent="submit" novalidate>
              <div class="mb-3">
                <label for="new-password" class="form-label">New password</label>
                <div class="input-wrap position-relative">
                  <input
                    id="new-password"
                    type="password"
                    class="form-control"
                    v-model="password"
                    :class="inputClass('password')"
                    @input="onPasswordInput"
                    @blur="onPasswordInput"
                    autocomplete="new-password"
                  />
                  <span v-if="shouldShowValid('password')" class="valid-check">&#10004;</span>
                </div>
                <div v-if="shouldShowError('password')" class="text-danger mt-1">{{ errors.password }}</div>
              </div>
              <div class="mb-3">
                <label for="confirm-password" class="form-label">Confirm new password</label>
                <div class="input-wrap position-relative">
                  <input
                    id="confirm-password"
                    type="password"
                    class="form-control"
                    v-model="confirmPassword"
                    :class="inputClass('confirm')"
                    @input="onConfirmInput"
                    @blur="onConfirmInput"
                    autocomplete="new-password"
                  />
                  <span v-if="shouldShowValid('confirm')" class="valid-check">&#10004;</span>
                </div>
                <div v-if="shouldShowError('confirm')" class="text-danger mt-1">{{ errors.confirm }}</div>
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
              {{ formError || 'This reset link is no longer valid. Please request a new one.' }}
            </div>

            <div v-if="formError && stage === 'form'" class="alert alert-danger mt-3">{{ formError }}</div>
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
const formError = ref('')
const stage = ref('checking')
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
let redirectTimer = null
const errors = ref({ password: null, confirm: null })
const touched = ref({ password: false, confirm: false })

onMounted(async () => {
  const incoming = typeof route.query.oobCode === 'string' ? route.query.oobCode : ''
  code.value = incoming

  if (!incoming) {
    formError.value = 'Invalid password reset link.'
    stage.value = 'error'
    return
  }

  try {
    email.value = await verifyPasswordResetCode(auth, incoming)
    stage.value = 'form'
  } catch {
    formError.value = 'This reset link has expired or is invalid.'
    stage.value = 'error'
  }
})

const validatePassword = () => {
  const value = password.value.trim()
  if (!value) { errors.value.password = 'Password is required.'; return }
  if (!passwordRegex.test(value)) { errors.value.password = 'Min 8 chars with letters and numbers.'; return }
  errors.value.password = null
}

const validateConfirm = () => {
  const value = confirmPassword.value.trim()
  if (!value) { errors.value.confirm = 'Please confirm your password.'; return }
  if (value !== password.value.trim()) { errors.value.confirm = 'Passwords do not match.'; return }
  errors.value.confirm = null
}

const onPasswordInput = () => {
  touched.value.password = true
  validatePassword()
  if (touched.value.confirm) validateConfirm()
}

const onConfirmInput = () => {
  touched.value.confirm = true
  validateConfirm()
}

const valueForField = (field) => (field === 'password' ? password.value : confirmPassword.value)
const shouldShowError = (field) => touched.value[field] && !!errors.value[field]
const shouldShowValid = (field) =>
  touched.value[field] &&
  !errors.value[field] &&
  String(valueForField(field)).trim() !== ''
const inputClass = field => ({
  'is-invalid': shouldShowError(field),
  'is-valid': shouldShowValid(field),
})

const submit = async () => {
  formError.value = ''
  Object.keys(touched.value).forEach(key => touched.value[key] = true)
  validatePassword()
  validateConfirm()
  if (Object.values(errors.value).some(v => v)) return

  submitting.value = true
  try {
    await confirmPasswordReset(auth, code.value, password.value)
    stage.value = 'done'
    redirectTimer = setTimeout(() => {
      router.push({ name: 'Login', query: { reset: 'success' } })
    }, 1500)
  } catch {
    formError.value = 'Unable to reset password. Please request a new link.'
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
.input-wrap {
  position: relative;
}
.valid-check {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
  color: #198754;
}
:deep(.form-control.is-valid) {
  background-image: none;
}
</style>
