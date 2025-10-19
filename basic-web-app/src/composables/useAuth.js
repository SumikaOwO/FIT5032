import { ref, computed } from 'vue'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/init'

const STORAGE_KEY = 'currentUser'
const ROLE_KEY = 'app:role'
const NAME_KEY = 'app:username'

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

const userRef = ref(readUser())

function setUserSession(session) {
  if (!session) {
    clearSession()
    return
  }
  const payload = {
    id: session.id,
    username: session.username,
    role: session.role,
  }
  userRef.value = payload
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  if (payload.role) localStorage.setItem(ROLE_KEY, payload.role)
  else localStorage.removeItem(ROLE_KEY)
  if (payload.username) localStorage.setItem(NAME_KEY, payload.username)
  else localStorage.removeItem(NAME_KEY)
}

function refreshFromStorage() {
  userRef.value = readUser()
}

function clearSession() {
  userRef.value = null
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(NAME_KEY)
}

async function signOutUser() {
  await signOut(auth)
  clearSession()
}

const isAuthed = computed(() => !!userRef.value)
const username = computed(() => userRef.value?.username || '')
const role = computed(() => userRef.value?.role || '')
const isAdmin = computed(() => role.value === 'admin')

export function useAuth() {
  return {
    currentUser: userRef,
    isAuthed,
    username,
    role,
    isAdmin,
    setUserSession,
    clearSession,
    refreshFromStorage,
    signOutUser,
  }
}
