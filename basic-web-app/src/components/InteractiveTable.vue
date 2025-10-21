<template>
  <div class="interactive-table">
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-1">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :style="columnStyle(col)"
              scope="col"
            >
              <button
                v-if="col.sortable"
                class="btn btn-link px-0 fw-semibold text-decoration-none"
                type="button"
                @click="toggleSort(col)"
                :aria-sort="ariaSort(col)"
              >
                {{ col.label }}
                <span class="sort-indicator" aria-hidden="true">
                  <span v-if="sortState.key === col.key && sortState.order === 'asc'">&#9650;</span>
                  <span v-else-if="sortState.key === col.key && sortState.order === 'desc'">&#9660;</span>
                </span>
              </button>
              <span v-else class="fw-semibold">{{ col.label }}</span>
            </th>
          </tr>
          <tr v-if="hasColumnFilters" class="filters-row">
            <th
              v-for="col in columns"
              :key="col.key"
              :style="columnStyle(col)"
            >
              <template v-if="col.filterType === 'select' && Array.isArray(col.options)">
                <select
                  class="form-select form-select-sm"
                  v-model="columnFilters[col.key]"
                  @change="onFiltersChanged"
                >
                  <option value="">All</option>
                  <option
                    v-for="opt in col.options"
                    :key="opt.value ?? opt"
                    :value="opt.value ?? opt"
                  >
                    {{ opt.label ?? opt }}
                  </option>
                </select>
              </template>
              <template v-else-if="col.searchable">
                <input
                  type="text"
                  class="form-control form-control-sm"
                  v-model="columnFilters[col.key]"
                  :placeholder="col.placeholder || `Search ${col.label}`"
                  @input="onFiltersChanged"
                />
              </template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in paginatedRows" :key="row[rowKey]" @click="$emit('row-click', row)" role="button">
            <td
              v-for="col in columns"
              :key="col.key"
              :style="columnStyle(col)"
            >
              <slot
                :name="`cell-${col.key}`"
                :row="row"
                :value="row[col.key]"
              >
                {{ formatValue(col, row[col.key], row) }}
              </slot>
            </td>
          </tr>
          <tr v-if="!paginatedRows.length">
            <td :colspan="columns.length" class="text-center text-muted py-4">
              <slot name="empty">No records match your filters.</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
      <div class="text-muted small">
        Showing
        <strong>{{ displayRange.start }}</strong>
        -
        <strong>{{ displayRange.end }}</strong>
        of
        <strong>{{ filteredRows.length }}</strong>
        entries
      </div>
      <nav aria-label="Table pagination">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button
              class="page-link"
              type="button"
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
            >
              &lsaquo;
            </button>
          </li>
          <li
            v-for="page in visiblePages"
            :key="page"
            class="page-item"
            :class="{ active: page === currentPage }"
          >
            <button class="page-link" type="button" @click="goToPage(page)">
              {{ page }}
            </button>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button
              class="page-link"
              type="button"
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
            >
              &rsaquo;
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, toRef, watch, watchEffect } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  rows: {
    type: Array,
    default: () => []
  },
  pageSize: {
    type: Number,
    default: 10
  },
  rowKey: {
    type: String,
    default: 'id'
  },
  defaultSort: {
    type: Object,
    default: () => ({ key: '', order: 'asc' })
  },
  visiblePageCount: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['row-click'])

const rowsRef = toRef(props, 'rows')
const columnsRef = toRef(props, 'columns')

const columnFilters = reactive({})

const sortState = reactive({
  key: props.defaultSort?.key || '',
  order: props.defaultSort?.order || 'asc'
})

const currentPage = ref(1)

const hasColumnFilters = computed(() =>
  columnsRef.value.some((col) => col.searchable || col.filterType === 'select')
)

watchEffect(() => {
  columnsRef.value.forEach((col) => {
    if (columnFilters[col.key] === undefined) {
      columnFilters[col.key] = ''
    }
  })
})

const filteredRows = computed(() => {
  const cols = columnsRef.value
  const filters = columnFilters

  return rowsRef.value.filter((row) => {
    return cols.every((col) => {
      const filterValue = filters[col.key]
      if (!filterValue) return true
      const cellValue = getFilterValue(col, row)
      if (col.filterType === 'select') {
        return String(cellValue) === String(filterValue)
      }
      if (col.searchable) {
        return String(cellValue ?? '')
          .toLowerCase()
          .includes(String(filterValue).toLowerCase())
      }
      return true
    })
  })
})

const sortedRows = computed(() => {
  const { key, order } = sortState
  if (!key) return filteredRows.value.slice()

  const column = columnsRef.value.find((col) => (col.sortKey || col.key) === key)
  return filteredRows.value.slice().sort((a, b) => {
    const aVal = getSortValue(column, a, key)
    const bVal = getSortValue(column, b, key)
    if (aVal === bVal) return 0
    if (aVal === undefined || aVal === null) return order === 'asc' ? -1 : 1
    if (bVal === undefined || bVal === null) return order === 'asc' ? 1 : -1

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal
    }
    return order === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / props.pageSize)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return sortedRows.value.slice(start, start + props.pageSize)
})

const displayRange = computed(() => {
  if (!sortedRows.value.length) {
    return { start: 0, end: 0 }
  }
  const start = (currentPage.value - 1) * props.pageSize + 1
  const end = Math.min(currentPage.value * props.pageSize, sortedRows.value.length)
  return { start, end }
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const max = props.visiblePageCount
  const pages = []

  if (total <= max) {
    for (let i = 1; i <= total; i += 1) pages.push(i)
    return pages
  }

  let start = Math.max(1, currentPage.value - Math.floor(max / 2))
  let end = start + max - 1

  if (end > total) {
    end = total
    start = total - max + 1
  }

  for (let i = start; i <= end; i += 1) pages.push(i)
  return pages
})

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

function toggleSort(col) {
  if (!col.sortable) return
  const key = col.sortKey || col.key
  if (sortState.key !== key) {
    sortState.key = key
    sortState.order = 'asc'
  } else {
    sortState.order = sortState.order === 'asc' ? 'desc' : 'asc'
  }
}

function ariaSort(col) {
  const key = col.sortKey || col.key
  if (sortState.key !== key) return 'none'
  return sortState.order === 'asc' ? 'ascending' : 'descending'
}

function columnStyle(col) {
  const style = {}
  if (col.align) style.textAlign = col.align
  if (col.width) style.width = typeof col.width === 'number' ? `${col.width}px` : col.width
  return style
}

function formatValue(col, value, row) {
  if (typeof col.formatter === 'function') {
    return col.formatter(value, row)
  }
  return value ?? '-'
}

function onFiltersChanged() {
  currentPage.value = 1
}

function getSortValue(col, row, fallbackKey) {
  if (col?.sortAccessor) {
    return col.sortAccessor(row)
  }
  const key = col?.sortKey || fallbackKey
  return row?.[key]
}

function getFilterValue(col, row) {
  if (col?.filterAccessor) {
    return col.filterAccessor(row)
  }
  const key = col?.filterKey || col?.key
  return row?.[key]
}

watch(rowsRef, () => {
  currentPage.value = 1
})

watchEffect(() => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

defineExpose({
  getFilteredRows: () => sortedRows.value.slice()
})
</script>

<style scoped>
.interactive-table {
  width: 100%;
}

table {
  border-collapse: separate;
  border-spacing: 0 8px;
  table-layout: fixed;
}

table thead th {
  vertical-align: middle;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
  padding: 0.75rem 1rem;
}

.filters-row th {
  background: #f8fafc;
  padding: 0.5rem 1rem;
}

.filters-row .form-control,
.filters-row .form-select {
  width: 100%;
  min-width: 0;
}

.filters-row input,
.filters-row select {
  width: 100%;
}

.table td {
  white-space: nowrap;
  padding: 0.75rem 1rem;
}

.table-responsive {
  overflow-x: auto;
}

.pagination .page-link {
  cursor: pointer;
}

.sort-indicator {
  display: inline-flex;
  width: 0.75rem;
  justify-content: center;
  margin-left: 0.25rem;
}
</style>
