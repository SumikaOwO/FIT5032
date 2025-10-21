<template>
  <div class="admin-page container py-4">
    <header class="mb-4 d-flex flex-wrap justify-content-between align-items-start gap-3">
      <div>
        <h1 class="h3 fw-semibold">Administrator Console</h1>
        <p class="text-muted mb-0">
          Explore user activity and system incidents. Switch datasets to audit engagement trends or diagnose errors.
        </p>
      </div>
      <div class="btn-group" role="group" aria-label="Data view toggle">
        <button
          type="button"
          class="btn"
          :class="activeView === 'activity' ? 'btn-primary' : 'btn-outline-primary'"
          @click="activeView = 'activity'"
        >
          User Activity
        </button>
        <button
          type="button"
          class="btn"
          :class="activeView === 'incidents' ? 'btn-primary' : 'btn-outline-primary'"
          @click="activeView = 'incidents'"
        >
          Incident Reports
        </button>
      </div>
    </header>

    <section class="card shadow-sm">
      <div class="card-body">
        <h2 class="h5 mb-3">
          {{ activeView === 'activity' ? 'User Activity Log' : 'Incident Reports' }}
        </h2>

        <InteractiveTable
          v-if="activeView === 'activity'"
          :columns="actionColumns"
          :rows="actionRows"
          row-key="event_id"
          :page-size="10"
          :default-sort="{ key: 'timestampValue', order: 'desc' }"
        />
        <InteractiveTable
          v-else
          :columns="incidentColumns"
          :rows="incidentRows"
          row-key="incident_id"
          :page-size="10"
          :default-sort="{ key: 'timestampValue', order: 'desc' }"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InteractiveTable from '@/components/InteractiveTable.vue'
import actionRecords from '@/assets/json/action_record.json'
import failureRecords from '@/assets/json/failure_record.json'

const activeView = ref('activity')

const formatDateTime = (isoString) => {
  if (!isoString) return '-'
  const date = new Date(isoString)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

const actionRows = actionRecords.map((record) => ({
  ...record,
  timestampFormatted: formatDateTime(record.timestamp),
  timestampValue: new Date(record.timestamp).getTime()
}))

const roles = makeOptions(uniqueValues(actionRows, 'role'))
const features = makeOptions(uniqueValues(actionRows, 'feature_name'))
const actions = makeOptions(uniqueValues(actionRows, 'action'))

const idWidth = '10ch'
const timestampWidth = '22ch'
const userWidth = widthForField(actionRows, 'user_name')
const emailWidth = widthForField(actionRows, 'user_email')
const roleWidth = widthForField(actionRows, 'role')
const featureWidth = widthForField(actionRows, 'feature_name')
const actionWidth = widthForField(actionRows, 'action')
const durationWidth = widthForField(actionRows, 'duration_sec', { min: 16, max: 20 })

const actionColumns = [
  { key: 'event_id', label: 'ID', sortable: true, searchable: true, width: idWidth, align: 'left', placeholder: 'Search ID' },
  {
    key: 'timestampValue',
    label: 'Timestamp',
    sortable: true,
    searchable: true,
    placeholder: 'e.g. 2024.08.04 23:42',
    width: timestampWidth,
    formatter: (_, row) => row.timestampFormatted,
    filterAccessor: (row) => row.timestampFormatted
  },
  { key: 'user_name', label: 'User', searchable: true, width: userWidth },
  { key: 'user_email', label: 'Email', searchable: true, width: emailWidth },
  { key: 'role', label: 'Role', filterType: 'select', options: roles, sortable: false, width: roleWidth },
  { key: 'feature_name', label: 'Feature', filterType: 'select', options: features, sortable: false, width: featureWidth },
  { key: 'action', label: 'Action', filterType: 'select', options: actions, sortable: false, width: actionWidth },
  { key: 'duration_sec', label: 'Duration (sec)', sortable: true, align: 'left', width: durationWidth, formatter: (value) => (value ?? 0).toLocaleString()}
]

const incidentRows = failureRecords.map((record) => ({
  ...record,
  timestampFormatted: formatDateTime(record.timestamp),
  timestampValue: new Date(record.timestamp).getTime()
}))

const severityOptions = makeOptions(uniqueValues(incidentRows, 'severity_level'))
const statusOptions = makeOptions(uniqueValues(incidentRows, 'status'))
const incidentFeatures = makeOptions(uniqueValues(incidentRows, 'feature_name'))
const errorCodes = makeOptions(uniqueValues(incidentRows, 'error_code'))

const incidentIdWidth = widthForField(incidentRows, 'incident_id', { min: 10, max: 14 })
const incidentTimestampWidth = '22ch'
const incidentFeatureWidth = widthForField(incidentRows, 'feature_name', { min: 18, max: 26 })
const incidentSeverityWidth = widthForField(incidentRows, 'severity_level', { min: 12, max: 16 })
const incidentStatusWidth = widthForField(incidentRows, 'status', { min: 14, max: 18 })
const incidentErrorWidth = widthForField(incidentRows, 'error_code', { min: 18, max: 26 })
const incidentDeviceWidth = widthForField(incidentRows, 'device', { min: 18, max: 28 })
const incidentReporterWidth = widthForField(incidentRows, 'reported_by', { min: 20, max: 32 })

const incidentColumns = [
  { key: 'incident_id', label: 'ID', sortable: true, searchable: true, width: incidentIdWidth, align: 'left', placeholder: 'Search ID' },
  {
    key: 'timestampValue',
    label: 'Timestamp',
    sortable: true,
    searchable: true,
    placeholder: 'e.g. 2024.09.12 08:30',
    width: incidentTimestampWidth,
    formatter: (_, row) => row.timestampFormatted,
    filterAccessor: (row) => row.timestampFormatted
  },
  { key: 'feature_name', label: 'Feature', filterType: 'select', options: incidentFeatures, sortable: false, width: incidentFeatureWidth },
  { key: 'severity_level', label: 'Severity', filterType: 'select', options: severityOptions, sortable: false, width: incidentSeverityWidth },
  { key: 'status', label: 'Status', filterType: 'select', options: statusOptions, sortable: false, width: incidentStatusWidth },
  { key: 'error_code', label: 'Error Code', filterType: 'select', options: errorCodes, sortable: false, width: incidentErrorWidth },
  { key: 'device', label: 'Device', searchable: true, width: incidentDeviceWidth },
  { key: 'reported_by', label: 'Reported By', searchable: true, width: incidentReporterWidth }
]

function uniqueValues(rows, key) {
  return Array.from(new Set(rows.map((row) => row[key]))).filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)))
}

function makeOptions(values) {
  return values.map((value) => ({
    label: value,
    value
  }))
}

function widthForField(rows, key, { min = 10, max = 30, padding = 2 } = {}) {
  const longest = rows.reduce((acc, row) => {
    const value = row?.[key]
    const length = String(value ?? '').length
    return Math.max(acc, length)
  }, 0)
  const total = Math.min(Math.max(longest + padding, min), max)
  return `${total}ch`
}
</script>

<style scoped>
.admin-page {
  min-height: 60vh;
}
</style>
