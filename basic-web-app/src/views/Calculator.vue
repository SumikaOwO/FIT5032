<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1 class="text-center">Daily Calorie Calculator</h1>
        <p class="text-muted text-center">Based on the Mifflin-St Jeor equation. For educational purposes only.</p>

        <form @submit.prevent="submitForm" novalidate>
          <div class="row mb-3">
            <div class="col-md-6 col-sm-6">
              <label for="sex" class="form-label">Sex</label>
              <div class="input-wrap position-relative">
                <select
                  id="sex"
                  class="form-select"
                  v-model="formData.sex"
                  :class="inputClass('sex')"
                  @change="onSelectInput('sex')"
                  >
                  <option value="" disabled>Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <span v-if="shouldShowValid('sex')" class="valid-check">&#10004;</span>
              </div>
              <div v-if="errors.sex" class="text-danger mt-1">{{ errors.sex }}</div>
            </div>

            <div class="col-md-6 col-sm-6">
              <label for="age" class="form-label">Age</label>
              <div class="input-wrap position-relative">
                <input
                  id="age"
                  type="text"
                  inputmode="numeric"
                  class="form-control"
                  v-model="formData.age"
                  :class="inputClass('age')"
                  @input="onAgeInput"
                  autocomplete="off"
                />
                <span v-if="shouldShowValid('age')" class="valid-check">&#10004;</span>
              </div>
              <div v-if="errors.age" class="text-danger mt-1">{{ errors.age }}</div>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-6 col-sm-6">
              <label for="height" class="form-label">Height (cm)</label>
              <div class="input-wrap position-relative">
                <input
                  id="height"
                  type="text"
                  inputmode="decimal"
                  class="form-control"
                  v-model="formData.height"
                  :class="inputClass('height')"
                  @input="onHeightInput"
                  autocomplete="off"
                />
                <span v-if="shouldShowValid('height')" class="valid-check">&#10004;</span>
              </div>
              <div v-if="errors.height" class="text-danger mt-1">{{ errors.height }}</div>
            </div>

            <div class="col-md-6 col-sm-6">
              <label for="weight" class="form-label">Weight (kg)</label>
              <div class="input-wrap position-relative">
                <input
                  id="weight"
                  type="text"
                  inputmode="decimal"
                  class="form-control"
                  v-model="formData.weight"
                  :class="inputClass('weight')"
                  @input="onWeightInput"
                  autocomplete="off"
                />
                <span v-if="shouldShowValid('weight')" class="valid-check">&#10004;</span>
              </div>
              <div v-if="errors.weight" class="text-danger mt-1">{{ errors.weight }}</div>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-12">
              <label for="activity" class="form-label">Activity Level</label>
              <div class="input-wrap position-relative">
                <select
                  id="activity"
                  class="form-select"
                  v-model="formData.activity"
                  :class="inputClass('activity')"
                  @change="onSelectInput('activity')"
                >
                  <option value="" disabled>Select activity level...</option>
                  <option v-for="opt in activityOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
                <span v-if="shouldShowValid('activity')" class="valid-check">&#10004;</span>
              </div>
              <small class="text-muted d-block mt-1">
                Tips: TDEE = BMR * activity factor. Choose the one that best matches your weekly routine.
              </small>
              <div v-if="errors.activity" class="text-danger mt-1">{{ errors.activity }}</div>
            </div>
          </div>

          <div class="text-center">
            <button type="submit" class="btn btn-primary me-2">Calculate</button>
            <button type="button" class="btn btn-secondary" @click="clearForm">Clear</button>
          </div>
        </form>

        <div v-if="hasCalculated && result" class="mt-4 card">
          <div class="card-body">
            <h5 class="card-title">Result</h5>
            <p class="mb-1"><strong>BMR:</strong> {{ Math.round(result.bmr) }} kcal/day</p>
            <p class="mb-1"><strong>TDEE (maintenance):</strong> {{ Math.round(result.tdee) }} kcal/day</p>
          </div>
        </div>

        <div v-if="history.length" class="mt-4 card">
          <div class="card-body">
            <h5 class="card-title">History</h5>
            <ul class="list-group">
              <li
                v-for="item in history"
                :key="item.id"
                class="list-group-item"
              >
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <div class="fw-semibold">
                      Sex: {{ item.sex }}, Age: {{ item.age }}, Height: {{ item.height }} cm, Weight: {{ item.weight }} kg
                    </div>
                    <div class="small">
                      Activity: {{ item.activityLabel }}
                    </div>
                    <div class="small text-muted">
                      BMR: {{ item.bmr }} kcal, TDEE: {{ item.tdee }} kcal
                    </div>
                  </div>
                  <button class="btn btn-outline-danger btn-sm ms-3" @click="deleteHistory(item.id)" aria-label="Delete this record">Delete</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'calorieCalc:last'

const formData = ref({
  sex: '',
  age: '',
  height: '',
  weight: '',
  activity: ''
})

const errors = ref({
  sex: null,
  age: null,
  height: null,
  weight: null,
  activity: null
})

const touched = ref({
  sex: false,
  age: false,
  height: false,
  weight: false,
  activity: false
})

const result = ref(null)
const hasCalculated = ref(false)
const history = ref([])

const activityOptions = [
  { value: '1.2',   label: 'Sedentary (1.2) - little or no exercise' },
  { value: '1.375', label: 'Light (1.375) - exercise 1~3 days/week' },
  { value: '1.55',  label: 'Moderate (1.55) - exercise 3~5 days/week' },
  { value: '1.725', label: 'Very Active (1.725) - hard exercise 6~7 days/week' },
  { value: '1.9',   label: 'Extra Active (1.9) - physical job' }
]

const isPositiveInteger = (s) => /^[1-9]\d*$/.test(String(s).trim())
const isPositiveNumber = (s) => {
  const str = String(s).trim()
  if (!/^\d+(\.\d+)?$/.test(str)) return false
  const n = Number(str)
  return Number.isFinite(n) && n > 0
}

const validateSex = () => {
  if (!formData.value.sex) errors.value.sex = 'Please select sex.'
  else errors.value.sex = null
}

const validateActivity = () => {
  if (!formData.value.activity) errors.value.activity = 'Please select activity level.'
  else errors.value.activity = null
}

const validateAge = () => {
  const v = formData.value.age
  if (String(v).trim() === '') { errors.value.age = 'Age is required.'; return }
  if (!/^\d+$/.test(String(v).trim())) { errors.value.age = 'Only digits are allowed.'; return }
  if (!isPositiveInteger(v)) { errors.value.age = 'Age must be a positive integer.'; return }
  errors.value.age = null
}

const validateHeight = () => {
  const v = formData.value.height
  if (String(v).trim() === '') { errors.value.height = 'Height is required.'; return }
  if (!/^\d+(\.\d+)?$/.test(String(v).trim())) { errors.value.height = 'Enter a valid number.'; return }
  if (!isPositiveNumber(v)) { errors.value.height = 'Height must be greater than 0.'; return }
  errors.value.height = null
}

const validateWeight = () => {
  const v = formData.value.weight
  if (String(v).trim() === '') { errors.value.weight = 'Weight is required.'; return }
  if (!/^\d+(\.\d+)?$/.test(String(v).trim())) { errors.value.weight = 'Enter a valid number.'; return }
  if (!isPositiveNumber(v)) { errors.value.weight = 'Weight must be greater than 0.'; return }
  errors.value.weight = null
}

const onSelectInput = (field) => {
  touched.value[field] = true
  if (field === 'sex') validateSex()
  if (field === 'activity') validateActivity()
  hasCalculated.value = false
}

const onAgeInput = () => {
  touched.value.age = true
  validateAge()
  hasCalculated.value = false
}

const onHeightInput = () => {
  touched.value.height = true
  validateHeight()
  hasCalculated.value = false
}

const onWeightInput = () => {
  touched.value.weight = true
  validateWeight()
  hasCalculated.value = false
}

const shouldShowError = (field) => touched.value[field] && !!errors.value[field]
const shouldShowValid = (field) => touched.value[field] && !errors.value[field] && String(formData.value[field]).trim() !== ''

const inputClass = (field) => ({
  'is-invalid': shouldShowError(field),
  'is-valid': shouldShowValid(field)
})

const compute = () => {
  const { sex, age, height, weight, activity } = formData.value
  const a = Number(age), h = Number(height), w = Number(weight)
  let bmr = 0
  if (sex === 'male') bmr = 10 * w + 6.25 * h - 5 * a + 5
  if (sex === 'female') bmr = 10 * w + 6.25 * h - 5 * a - 161
  const tdee = bmr * Number(activity || 0)
  return { bmr, tdee }
}

const getActivityLabel = (value) => {
  const found = activityOptions.find(o => String(o.value) === String(value))
  return found ? found.label : value
}

const saveAll = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    form: formData.value,
    result: result.value,
    hasCalculated: hasCalculated.value,
    history: history.value
  }))
}

const submitForm = () => {
  Object.keys(touched.value).forEach(k => touched.value[k] = true)
  validateSex(); validateAge(); validateHeight(); validateWeight(); validateActivity()
  const ok = Object.values(errors.value).every(v => v === null)
  if (!ok) return
  result.value = compute()
  hasCalculated.value = true
  history.value.push({
    id: Date.now() + Math.random().toString(16).slice(2),
    sex: formData.value.sex,
    age: Number(formData.value.age),
    height: Number(formData.value.height),
    weight: Number(formData.value.weight),
    activity: formData.value.activity,
    activityLabel: getActivityLabel(formData.value.activity),
    bmr: Math.round(result.value.bmr),
    tdee: Math.round(result.value.tdee)
  })
  saveAll()
}

const deleteHistory = (id) => {
  history.value = history.value.filter(x => x.id !== id)
  saveAll()
}

const clearForm = () => {
  formData.value = { sex: '', age: '', height: '', weight: '', activity: '' }
  errors.value = { sex: null, age: null, height: null, weight: null, activity: null }
  touched.value = { sex: false, age: false, height: false, weight: false, activity: false }
  result.value = null
  hasCalculated.value = false
  saveAll()
}

onMounted(() => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    const saved = JSON.parse(raw)
    if (saved?.form) Object.assign(formData.value, saved.form)
    if (saved?.hasCalculated && saved?.result) {
      result.value = saved.result
      hasCalculated.value = true
    }
    if (Array.isArray(saved?.history)) history.value = saved.history
    Object.keys(touched.value).forEach(k => {
      touched.value[k] = String(formData.value[k] ?? '').trim() !== ''
    })
    if (touched.value.sex) validateSex()
    if (touched.value.age) validateAge()
    if (touched.value.height) validateHeight()
    if (touched.value.weight) validateWeight()
   if (touched.value.activity) validateActivity()
  }
})
</script>

<style scoped>
.input-wrap { position: relative; }
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
.is-valid { border-color: #198754 !important; }
.is-invalid { border-color: #dc3545 !important; }
:deep(.form-control.is-valid),
:deep(.form-select.is-valid) {background-image: none !important;}
</style>
