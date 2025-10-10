<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <h1 class="text-center mb-3">Create Account</h1>

        <form @submit.prevent="submitForm" novalidate>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="username" class="form-label">Username</label>
              <div class="input-wrap position-relative">
                <input
                  id="username" type="text" class="form-control"
                  v-model="formData.username" :class="inputClass('username')"
                  @input="onUsernameInput" @blur="checkUsernameUniqueness(true)"
                  autocomplete="username"
                />
                <span v-if="shouldShowValid('username')" class="valid-check">&#10004;</span>
              </div>
              <div v-if="shouldShowError('username')" class="text-danger mt-1">{{ errors.username }}</div>
            </div>

            <div class="col-md-6 mb-3">
              <label for="email" class="form-label">Email</label>
              <div class="input-wrap position-relative">
                <input
                  id="email" type="email" class="form-control"
                  v-model="formData.email" :class="inputClass('email')"
                  @input="onEmailInput" @blur="checkEmailUniqueness(true)"
                  autocomplete="email"
                />
                <span v-if="shouldShowValid('email')" class="valid-check">&#10004;</span>
              </div>
              <div v-if="shouldShowError('email')" class="text-danger mt-1">{{ errors.email }}</div>
            </div>
          </div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="password" class="form-label">Password</label>
              <div class="input-wrap position-relative">
                <input
                  id="password" type="password" class="form-control"
                  v-model="formData.password" :class="inputClass('password')"
                  @input="onPasswordInput" autocomplete="new-password"
                />
                <span v-if="shouldShowValid('password')" class="valid-check">&#10004;</span>
              </div>
              <div v-if="shouldShowError('password')" class="text-danger mt-1">{{ errors.password }}</div>
            </div>

            <div class="col-md-6 mb-3">
              <label for="confirm" class="form-label">Confirm Password</label>
              <div class="input-wrap position-relative">
                <input
                  id="confirm" type="password" class="form-control"
                  v-model="formData.confirm" :class="inputClass('confirm')"
                  @input="onConfirmInput" autocomplete="new-password"
                />
                <span v-if="shouldShowValid('confirm')" class="valid-check">&#10004;</span>
              </div>
              <div v-if="shouldShowError('confirm')" class="text-danger mt-1">{{ errors.confirm }}</div>
            </div>
          </div>

          <div class="mb-2">
            <label for="adminkey" class="form-label">Admin Key</label>
            <div class="input-wrap position-relative">
              <input
                id="adminkey" type="text" class="form-control"
                v-model="formData.adminKey" :class="adminKeyClass"
                @input="onAdminKeyInput" placeholder="Enter admin to register as admin" autocomplete="off"
              />
              <span v-if="adminKeyValid && touched.adminKey" class="valid-check">&#10004;</span>
            </div>
            <small class="text-muted d-block mt-1">
              Role: <strong>{{ roleLabel }}</strong>
            </small>
          </div>

          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-primary" type="submit" :disabled="!canSubmit">
              {{ submitting ? 'Creating...' : (checkingUsername || checkingEmail ? 'Validating...' : 'Create Account') }}
            </button>
            <button class="btn btn-outline-secondary" type="button" @click="goLogin">
              Back to Sign In
            </button>
          </div>

          <div v-if="submitError" class="alert alert-danger mt-3">{{ submitError }}</div>
        </form>
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
import { ref, computed, watch, onMounted } from 'vue'
import { Toast } from 'bootstrap'
import { useRouter } from 'vue-router'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase/init'

const router = useRouter()

const formData = ref({ username: '', email: '', password: '', confirm: '', adminKey: '' })
const errors   = ref({ username: null, email: null, password: null, confirm: null })
const touched  = ref({ username: false, email: false, password: false, confirm: false, adminKey: false })
const submitting = ref(false)
const submitError = ref('')

const checkingUsername = ref(false)
const usernameUnique = ref(null)
const checkingEmail = ref(false)
const emailUnique = ref(null)

const toastRef = ref(null)
const toastMsg = ref('')
let toastInst

onMounted(() => {
  toastInst = new Toast(toastRef.value, { autohide: true, delay: 1800 })
})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernameRegex = /^[A-Za-z][A-Za-z0-9_.-]{2,19}$/
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

const normalizedEmail = computed(() => formData.value.email.trim().toLowerCase())

const adminKeyValid = computed(() => formData.value.adminKey.trim().toLowerCase() === 'admin')
const roleLabel     = computed(() => (adminKeyValid.value ? 'admin' : 'user'))
const adminKeyClass = computed(() => ({ 'is-valid': touched.value.adminKey && adminKeyValid.value }))

const validateUsername = () => {
  const v = formData.value.username.trim()
  if (!v) { errors.value.username = 'Username is required.'; return }
  if (!usernameRegex.test(v)) { errors.value.username = '3~20 characters, start with letter.'; return }
  errors.value.username = null
}
const validateEmail = () => {
  const v = formData.value.email.trim()
  if (!v) { errors.value.email = 'Email is required.'; return }
  if (!emailRegex.test(v)) { errors.value.email = 'Enter a valid email.'; return }
  errors.value.email = null
}
const validatePassword = () => {
  const v = formData.value.password
  if (!v) { errors.value.password = 'Password is required.'; return }
  if (!passwordRegex.test(v)) { errors.value.password = 'Min 8 chars with letters and numbers.'; return }
  errors.value.password = null
}
const validateConfirm = () => {
  const v = formData.value.confirm
  if (!v) { errors.value.confirm = 'Please confirm your password.'; return }
  if (v !== formData.value.password) { errors.value.confirm = 'Passwords do not match.'; return }
  errors.value.confirm = null
}

const onUsernameInput = () => {
  touched.value.username = true
  validateUsername()
  usernameUnique.value = null
  if (errors.value.username === 'Username already taken.') errors.value.username = null
}
const onEmailInput = () => {
  touched.value.email = true
  validateEmail()
  emailUnique.value = null
  if (errors.value.email === 'Email already in use.') errors.value.email = null
}
const onPasswordInput = () => {
  touched.value.password = true
  validatePassword()
  validateConfirm()
}
const onConfirmInput = () => {
  touched.value.confirm = true
  validateConfirm()
}
const onAdminKeyInput = () => {
  touched.value.adminKey = true
}

const shouldShowError = (f) => touched.value[f] && !!errors.value[f]
const shouldShowValid = (f) => touched.value[f] && !errors.value[f] && String(formData.value[f]).trim() !== ''
const inputClass = (f) => ({
  'is-invalid': shouldShowError(f),
  'is-valid': shouldShowValid(f),
})

watch(() => formData.value.username, () => { usernameUnique.value = null })
watch(() => formData.value.email, () => { emailUnique.value = null })

const checkUsernameUniqueness = async (force = false) => {
  if (!force && !touched.value.username) return true
  validateUsername()
  if (errors.value.username) {
    usernameUnique.value = null
    return false
  }
  const key = formData.value.username.trim().toLowerCase()
  try {
    checkingUsername.value = true
    const snap = await getDoc(doc(db, 'usernames', key))
    const available = !snap.exists()
    usernameUnique.value = available
    if (!available) errors.value.username = 'Username already taken.'
    else if (errors.value.username === 'Username already taken.') errors.value.username = null
    return available
  } catch {
    usernameUnique.value = null
    return false
  } finally {
    checkingUsername.value = false
  }
}

const checkEmailUniqueness = async (force = false) => {
  if (!force && !touched.value.email) return true
  validateEmail()
  if (errors.value.email) {
    emailUnique.value = null
    return false
  }
  try {
    checkingEmail.value = true
    const snap = await getDoc(doc(db, 'emails', normalizedEmail.value))
    const available = !snap.exists()
    emailUnique.value = available
    if (!available) errors.value.email = 'Email already in use.'
    else if (errors.value.email === 'Email already in use.') errors.value.email = null
    return available
  } catch (err) {
    console.error('Firestore email check failed:', err)
    emailUnique.value = null
    return false
  } finally {
    checkingEmail.value = false
  }
}

const fieldsFilled = computed(() => ['username','email','password','confirm'].every(f => String(formData.value[f]).trim() !== ''))
const noSyncErrors = computed(() => Object.values(errors.value).every(v => v === null))
const canSubmit = computed(() =>
  !submitting.value &&
  !checkingUsername.value &&
  !checkingEmail.value &&
  fieldsFilled.value &&
  noSyncErrors.value &&
  usernameUnique.value === true &&
  emailUnique.value === true
)

const showToastAndGo = (msg, dest) => {
  toastMsg.value = msg
  const handler = () => {
    toastRef.value.removeEventListener('hidden.bs.toast', handler)
    router.push(dest)
  }
  toastRef.value.addEventListener('hidden.bs.toast', handler)
  toastInst.show()
}

const submitForm = async () => {
  Object.keys(touched.value).forEach(k => touched.value[k] = true)
  validateUsername(); validateEmail(); validatePassword(); validateConfirm()
  const uok = await checkUsernameUniqueness(true)
  const eok = await checkEmailUniqueness(true)
  if (!uok || !eok || Object.values(errors.value).some(e => e)) return

  submitError.value = ''
  submitting.value = true

  const unameLower = formData.value.username.trim().toLowerCase()
  const unameRaw   = formData.value.username.trim()
  const emailKey   = normalizedEmail.value
  const role       = adminKeyValid.value ? 'admin' : 'user'

  try {
    const cred = await createUserWithEmailAndPassword(auth, emailKey, formData.value.password)

    try {
      await setDoc(doc(db, 'usernames', unameLower), { uid: cred.user.uid })
      await setDoc(doc(db, 'emails', emailKey), { uid: cred.user.uid })
      await updateProfile(cred.user, { displayName: unameRaw })
      await setDoc(doc(db, 'users', cred.user.uid), {
        usernameLower: unameLower,
        usernameRaw: unameRaw,
        email: emailKey,
        role,
        createdAt: serverTimestamp()
      })

      showToastAndGo(`Welcome, ${unameRaw}!  ${role} created.`, '/login')

    } catch (firestoreErr) {
      console.error('Firestore setup failed:', firestoreErr)
      submitError.value = 'Account created, but failed to save user data.'
    }

  } catch (authErr) {
    const code = authErr?.code || ''
    console.error('Auth registration failed:', code)

    if (code === 'auth/email-already-in-use') {
      errors.value.email = 'Email already in use.'
      emailUnique.value = false
    } else if (code === 'auth/invalid-email') {
      errors.value.email = 'Invalid email.'
    } else {
      submitError.value = 'Registration failed. Please try again.'
    }
  } finally {
    submitting.value = false
  }
}

const goLogin = () => router.push('/login')
</script>


<style scoped>
.input-wrap { position: relative; }
.valid-check { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-weight: 700; line-height: 1; pointer-events: none; color: #198754; }
.is-valid { border-color: #198754 !important; }
.is-invalid { border-color: #dc3545 !important; }
:deep(.form-control.is-valid) { background-image: none !important; }
</style>
