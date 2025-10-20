<template>
  <div class="healthy-places-page container-fluid py-4">
    <div class="row g-3">
      <div class="col-12 col-lg-8">
        <div class="map-wrapper">
          <div ref="mapRef" class="map-canvas"></div>
          <div v-if="mapErrorMessage" class="map-overlay alert alert-danger m-3">
            {{ mapErrorMessage }}
          </div>
        </div>
        <div class="route-panel card shadow-sm mt-3">
          <div class="card-body">
            <h2 class="h6 mb-3">Route details</h2>

            <div v-if="!hasActiveRoute" class="text-muted small">
              Select a place and tap "Get route" to display directions here.
            </div>

            <div v-else class="route-summary">
              <div class="btn-group mb-3" role="group">
                <button
                  v-for="mode in travelModes"
                  :key="mode"
                  type="button"
                  class="btn"
                  :class="selectedTravelMode === mode ? 'btn-primary' : 'btn-outline-primary'"
                  :disabled="!routeSummaries[mode]"
                  @click="selectedTravelMode = mode"
                >
                  {{ modeLabels[mode] }}
                </button>
              </div>

              <div
                v-for="entry in routeSummaryEntries"
                :key="entry.mode"
                class="route-summary-card border rounded p-3 mb-2"
                :class="{ 'is-active': selectedTravelMode === entry.mode }"
              >
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong>{{ modeLabels[entry.mode] }}</strong>
                  <span class="badge bg-light text-dark">
                    {{ entry.summary.distanceText }}
                  </span>
                </div>
                <div class="small text-secondary mb-1">
                  Estimated time: {{ entry.summary.durationText }}
                </div>
                <div v-if="entry.mode === 'WALKING' && entry.summary.caloriesText" class="small">
                  Approx. calories burned: {{ entry.summary.caloriesText }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-4">
        <aside class="panel card shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <form class="filters-form" @submit.prevent="onApplyFilters">
              <div class="mb-3">
                <h2 class="h5 mb-3">Find healthy places</h2>
                <label class="form-label" for="address-input">Search by address</label>
                <div class="address-row d-flex gap-2 flex-wrap">
                  <input
                    id="address-input"
                    ref="addressInputRef"
                    type="text"
                    class="form-control address-input"
                    v-model="addressQuery"
                    placeholder="Enter a location or suburb"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-primary btn-sm address-button"
                    :disabled="isRecentering"
                    @click="moveToUserLocation"
                  >
                    {{ isRecentering ? 'Locating...' : 'Move to my location' }}
                  </button>
                </div>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-12 col-md-6">
                  <label class="form-label" for="category-select">Category</label>
                  <select
                    id="category-select"
                    class="form-select"
                    v-model="selectedCategoryKey"
                  >
                    <option v-for="cat in categories" :key="cat.key" :value="cat.key">
                      {{ cat.label }}
                    </option>
                  </select>
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label" for="sort-select">Sort by</label>
                  <select id="sort-select" class="form-select" v-model="selectedSortKey">
                    <option v-for="opt in sortOptions" :key="opt.key" :value="opt.key">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-check mb-3">
                <input
                  id="open-now-check"
                  class="form-check-input"
                  type="checkbox"
                  v-model="openNowOnly"
                />
                <label class="form-check-label" for="open-now-check">
                  Only show places open now
                </label>
              </div>

              <button type="submit" class="btn btn-success w-100" :disabled="isLoading">
                {{ isLoading ? 'Searching...' : 'Apply Filters' }}
              </button>
            </form>

            <div class="results flex-grow-1 overflow-auto">
              <template v-if="errorMessage">
                <div class="alert alert-danger" role="alert">
                  {{ errorMessage }}
                </div>
              </template>
              <template v-else-if="searchResults.length">
                <ul class="list-group list-group-flush">
                  <li
                    v-for="place in paginatedResults"
                    :key="place.id"
                    class="list-group-item result-item"
                    :class="{ active: activePlaceId === place.id }"
                    role="button"
                    @click="focusPlace(place.id)"
                  >
                    <div class="result-header d-flex align-items-center">
                      <h3 class="h6 mb-0 flex-grow-1">{{ place.name }}</h3>
                      <div class="result-actions d-flex align-items-center gap-2 flex-shrink-0">
                        <button
                          v-if="activePlaceId === place.id"
                          type="button"
                          class="btn btn-sm btn-outline-success get-route-button"
                          :disabled="isRouteLoading"
                          @click.stop="startRouteTo(place)"
                        >
                          {{ isRouteLoading ? 'Preparing...' : 'Get route' }}
                        </button>
                        <span v-if="place.rating" class="badge bg-warning text-dark">
                          &#9733 {{ place.rating.toFixed(1) }}
                        </span>
                      </div>
                    </div>
                    <p class="text-muted mb-1 small">{{ place.address }}</p>
                    <div class="d-flex justify-content-between small text-secondary">
                      <span v-if="place.distanceMeters !== null">
                        {{ formatDistance(place.distanceMeters) }} away
                      </span>
                      <span v-if="place.openNow !== null">
                        {{ place.openNow ? 'Open now' : 'Closed now' }}
                      </span>
                    </div>
                  </li>
                </ul>
                <div
                  v-if="totalPages > 1"
                  class="results-pagination d-flex justify-content-between align-items-center mt-3"
                >
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    :disabled="currentPage === 1"
                    @click="goToPreviousPage"
                  >
                    &larr; Previous
                  </button>
                  <span class="small text-muted">
                    Page {{ currentPage }} of {{ totalPages }}
                  </span>
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    :disabled="currentPage === totalPages"
                    @click="goToNextPage"
                  >
                    Next &rarr;
                  </button>
                </div>
              </template>
              <template v-else>
                <div class="placeholder text-muted text-center py-4">
                  {{ isLoading ? 'Searching for places...' : 'Search results will appear here.' }}
                </div>
              </template>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'

const categories = [
  { key: 'park', label: 'Parks', type: 'park' },
  { key: 'gym', label: 'Gyms & Fitness', type: 'gym' },
  { key: 'supermarket', label: 'Organic Supermarkets', type: 'supermarket', keyword: 'organic grocery' },
  { key: 'market', label: 'Farmers Markets', type: 'store', keyword: 'farmers market' }
]

const sortOptions = [
  { key: 'relevance', label: 'Google Relevance' },
  { key: 'rating', label: 'Highest rating' },
  { key: 'distance', label: 'Nearest distance' }
]

const DEFAULT_CENTER = { lat: -37.8136, lng: 144.9631 }
const SEARCH_RADIUS_METERS = 4000
const RESULTS_PER_PAGE = 5
const WALKING_MET = 3.5
const AVERAGE_WALK_WEIGHT_KG = 70
const TRAVEL_MODES = ['DRIVING', 'WALKING']
const travelModes = TRAVEL_MODES

let googleMapsPromise

const mapRef = ref(null)
const addressInputRef = ref(null)
const addressQuery = ref('')
const selectedCategoryKey = ref(categories.length ? categories[0].key : '')
const selectedSortKey = ref(sortOptions[0].key)
const openNowOnly = ref(false)
const isLoading = ref(false)
const isRecentering = ref(false)
const errorMessage = ref('')
const mapErrorMessage = ref('')
const searchResults = ref([])
const activePlaceId = ref(null)
const currentPage = ref(1)
const totalPages = computed(() => {
  if (!searchResults.value.length) return 0
  return Math.ceil(searchResults.value.length / RESULTS_PER_PAGE)
})
const paginatedResults = computed(() => {
  if (!searchResults.value.length) return []
  const startIndex = (currentPage.value - 1) * RESULTS_PER_PAGE
  return searchResults.value.slice(startIndex, startIndex + RESULTS_PER_PAGE)
})
const currentCenter = ref({ ...DEFAULT_CENTER })
const selectedTravelMode = ref('DRIVING')
const isRouteLoading = ref(false)
const routeSummaries = reactive({
  DRIVING: null,
  WALKING: null
})
const routeDestination = ref(null)
const modeLabels = Object.freeze({
  DRIVING: 'Driving',
  WALKING: 'Walking'
})

const routeResponseStore = reactive({
  DRIVING: null,
  WALKING: null
})
let routeRequestCounter = 0

const availableModes = computed(() => travelModes.filter((mode) => Boolean(routeSummaries[mode])))
const hasActiveRoute = computed(() => availableModes.value.length > 0)
const routeSummaryEntries = computed(() =>
  availableModes.value.map((mode) => ({
    mode,
    summary: routeSummaries[mode]
  }))
)

watch(searchResults, () => {
  currentPage.value = 1
})

watch(totalPages, (nextTotal) => {
  if (!nextTotal) {
    currentPage.value = 1
    return
  }
  if (currentPage.value > nextTotal) {
    currentPage.value = nextTotal
  }
})

watch(selectedTravelMode, (mode) => {
  if (routeResponseStore[mode]) {
    renderRoute(mode)
  }
})

function goToPreviousPage() {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

function goToNextPage() {
  if (totalPages.value && currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

function startRouteTo(place) {
  if (!place) return
  focusPlace(place.id)
  clearRouteVisuals()
  routeDestination.value = {
    id: place.id,
    name: place.name,
    position: { ...place.position }
  }
  calculateAllRoutes()
}

async function calculateAllRoutes() {
  if (!routeDestination.value) return
  if (!directionsService || !window.google?.maps) {
    return
  }

  const requestId = ++routeRequestCounter
  isRouteLoading.value = true

  travelModes.forEach((mode) => {
    routeSummaries[mode] = null
    routeResponseStore[mode] = null
  })

  const origin = new window.google.maps.LatLng(currentCenter.value.lat, currentCenter.value.lng)
  const destination = new window.google.maps.LatLng(
    routeDestination.value.position.lat,
    routeDestination.value.position.lng
  )

  const results = await Promise.allSettled(
    travelModes.map((mode) => requestRoute(mode, origin, destination))
  )

  if (requestId !== routeRequestCounter) {
    isRouteLoading.value = false
    return
  }

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { mode, response } = result.value
      const summary = buildRouteSummary(response, mode)
      if (summary) {
        routeResponseStore[mode] = response
        routeSummaries[mode] = summary
      }
    }
  })

  const available = travelModes.filter((mode) => Boolean(routeSummaries[mode]))

  if (available.length) {
    if (!available.includes(selectedTravelMode.value)) {
      selectedTravelMode.value = available[0]
    } else {
      renderRoute(selectedTravelMode.value)
    }
  } else {
    routeDestination.value = null
    clearRouteVisuals()
  }

  isRouteLoading.value = false
}

function requestRoute(mode, origin, destination) {
  return new Promise((resolve, reject) => {
    const travelMode = window.google.maps.TravelMode?.[mode] || mode
    directionsService.route(
      {
        origin,
        destination,
        travelMode
      },
      (response, status) => {
        if (status === 'OK' && response?.routes?.length) {
          resolve({ mode, response })
        } else {
          reject({ mode, status })
        }
      }
    )
  })
}

function buildRouteSummary(response, mode) {
  if (!response?.routes?.length) return null
  const leg = response.routes[0]?.legs?.[0]
  if (!leg) return null

  const durationSeconds = leg.duration?.value ?? null
  let caloriesText = ''
  if (mode === 'WALKING' && durationSeconds) {
    const calories = WALKING_MET * AVERAGE_WALK_WEIGHT_KG * (durationSeconds / 3600)
    caloriesText = `${Math.round(calories)} kcal`
  }

  return {
    distanceText: leg.distance?.text || '--',
    durationText: leg.duration?.text || '--',
    caloriesText
  }
}

function renderRoute(mode) {
  if (!directionsRenderer || !routeResponseStore[mode]) return
  directionsRenderer.setDirections(routeResponseStore[mode])
}

function clearRouteVisuals() {
  selectedTravelMode.value = 'DRIVING'
  isRouteLoading.value = false
  routeRequestCounter += 1
  travelModes.forEach((mode) => {
    routeSummaries[mode] = null
    routeResponseStore[mode] = null
  })
  if (directionsRenderer) {
    directionsRenderer.set('directions', null)
  }
}

let mapInstance = null
let placesService = null
let autocomplete = null
let infoWindow = null
let directionsService = null
let directionsRenderer = null
let hasTriggeredInitialSearch = false
const markerStore = new Map()
let centerMarker = null

function loadGoogleMapsSdk() {
  if (window.google && window.google.maps) return Promise.resolve(window.google.maps)
  if (googleMapsPromise) return googleMapsPromise

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'))
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Failed to load Google Maps script'))
    document.head.appendChild(script)
  })

  return googleMapsPromise
}

function haversineDistanceMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const R = 6371000
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const deltaLat = toRad(b.lat - a.lat)
  const deltaLng = toRad(b.lng - a.lng)

  const sinLat = Math.sin(deltaLat / 2)
  const sinLng = Math.sin(deltaLng / 2)
  const value =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  const c = 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  return R * c
}

function formatDistance(meters) {
  if (meters === null || meters === undefined) return ''
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function clearMarkers() {
  markerStore.forEach((marker) => marker.setMap(null))
  markerStore.clear()
}

function updateCenterMarker(position) {
  if (!mapInstance) return
  if (!centerMarker) {
    centerMarker = new window.google.maps.Marker({
      map: mapInstance,
      position,
      zIndex: 9999,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: '#0d6efd',
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    })
  } else {
    centerMarker.setPosition(position)
  }
}

function focusPlace(placeId) {
  const targetIndex = searchResults.value.findIndex((p) => p.id === placeId)
  if (targetIndex === -1) return

  const target = searchResults.value[targetIndex]
  const targetPage = Math.floor(targetIndex / RESULTS_PER_PAGE) + 1
  if (targetPage !== currentPage.value) {
    currentPage.value = targetPage
  }

  activePlaceId.value = placeId
  if (!mapInstance) return

  mapInstance.panTo(target.position)
  if (mapInstance.getZoom() < 15) {
    mapInstance.setZoom(15)
  }

  const marker = markerStore.get(placeId)
  if (marker) {
    if (!infoWindow) {
      infoWindow = new window.google.maps.InfoWindow()
    }
    infoWindow.setContent(`
      <div class="info-window">
        <strong>${target.name}</strong><br/>
        <span style="font-size:12px;color:#555;">${target.address || ''}</span>
      </div>
    `)
    infoWindow.open({
      map: mapInstance,
      anchor: marker
    })
  }
}

function processResults(results) {
  clearMarkers()
  const mapped = []
  const category = categories.find((c) => c.key === selectedCategoryKey.value)

  results.forEach((place) => {
    if (!place.place_id || !place.geometry || !place.geometry.location) return
    if (category && Array.isArray(place.types) && !place.types.includes(category.type)) return

    const position = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    }
    const distanceMeters = haversineDistanceMeters(currentCenter.value, position)

    const marker = new window.google.maps.Marker({
      map: mapInstance,
      position: place.geometry.location,
      title: place.name
    })
    marker.addListener('click', () => focusPlace(place.place_id))
    markerStore.set(place.place_id, marker)

    mapped.push({
      id: place.place_id,
      name: place.name,
      rating: typeof place.rating === 'number' ? place.rating : null,
      address: place.vicinity || place.formatted_address || '',
      distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
      openNow: typeof place.opening_hours?.open_now === 'boolean' ? place.opening_hours.open_now : null,
      position
    })
  })

  if (selectedSortKey.value === 'rating') {
    mapped.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  } else if (selectedSortKey.value === 'distance') {
    mapped.sort((a, b) => {
      const distA = a.distanceMeters ?? Number.POSITIVE_INFINITY
      const distB = b.distanceMeters ?? Number.POSITIVE_INFINITY
      return distA - distB
    })
  }

  searchResults.value = mapped
  activePlaceId.value = null

  if (mapped.length && mapInstance) {
    const bounds = new window.google.maps.LatLngBounds()
    mapped.forEach((place) => bounds.extend(place.position))
    bounds.extend(currentCenter.value)
    mapInstance.fitBounds(bounds, 72)
  }
}

function onApplyFilters() {
  if (!mapInstance || !placesService) {
    errorMessage.value = 'Map is not ready yet. Please try again in a moment.'
    return
  }
  if (!selectedCategoryKey.value) {
    errorMessage.value = 'Please choose a category.'
    return
  }

  const category = categories.find((c) => c.key === selectedCategoryKey.value)
  if (!category) {
    errorMessage.value = 'Unsupported category.'
    return
  }

  routeDestination.value = null
  clearRouteVisuals()

  isLoading.value = true
  errorMessage.value = ''
  searchResults.value = []
  clearMarkers()

  const request = {
    location: new window.google.maps.LatLng(currentCenter.value.lat, currentCenter.value.lng),
    radius: SEARCH_RADIUS_METERS,
    type: category.type
  }
  if (category.keyword) {
    request.keyword = category.keyword
  }
  if (openNowOnly.value) {
    request.openNow = true
  }

  placesService.nearbySearch(request, (results, status) => {
    isLoading.value = false
    if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results || !results.length) {
      if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        errorMessage.value = 'No places found. Try a different category or location.'
      } else {
        errorMessage.value = 'Unable to fetch places right now. Please try again later.'
      }
      clearMarkers()
      searchResults.value = []
      return
    }
    processResults(results)
  })
}

function initAutocomplete(maps) {
  if (!addressInputRef.value) return
  autocomplete = new maps.places.Autocomplete(addressInputRef.value, {
    fields: ['geometry', 'formatted_address']
  })
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    if (!place || !place.geometry || !place.geometry.location) return
    addressQuery.value = place.formatted_address || addressQuery.value
    currentCenter.value = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    }
    updateCenterMarker(currentCenter.value)
    if (mapInstance) {
      mapInstance.panTo(currentCenter.value)
      mapInstance.setZoom(15)
    }
  })
}

function triggerInitialSearch() {
  if (hasTriggeredInitialSearch) return
  hasTriggeredInitialSearch = true
  onApplyFilters()
}

function tryUserGeolocation() {
  if (!navigator.geolocation) {
    triggerInitialSearch()
    return
  }

  const fallback = setTimeout(() => triggerInitialSearch(), 5000)

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      clearTimeout(fallback)
      currentCenter.value = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }
      updateCenterMarker(currentCenter.value)
      if (mapInstance) {
        mapInstance.setCenter(currentCenter.value)
        mapInstance.setZoom(14)
      }
      triggerInitialSearch()
    },
    () => {
      clearTimeout(fallback)
      triggerInitialSearch()
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  )
}

function initMap(maps) {
  if (!mapRef.value) {
    mapErrorMessage.value = 'Map container is missing.'
    return
  }
  mapErrorMessage.value = ''
  mapInstance = new maps.Map(mapRef.value, {
    center: DEFAULT_CENTER,
    zoom: 13,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  })
  placesService = new maps.places.PlacesService(mapInstance)
  infoWindow = new maps.InfoWindow()
  directionsService = new maps.DirectionsService()
  directionsRenderer = new maps.DirectionsRenderer({
    map: mapInstance,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#198754',
      strokeWeight: 5
    }
  })
  updateCenterMarker(DEFAULT_CENTER)
  initAutocomplete(maps)
  tryUserGeolocation()
}

function moveToUserLocation() {
  if (!navigator.geolocation) {
    mapErrorMessage.value = 'Geolocation is not supported by this browser.'
    return
  }
  isRecentering.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      isRecentering.value = false
      mapErrorMessage.value = ''
      const nextCenter = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }
      currentCenter.value = nextCenter
      updateCenterMarker(nextCenter)
      if (mapInstance) {
        mapInstance.panTo(nextCenter)
        if (mapInstance.getZoom() < 14) mapInstance.setZoom(14)
      }
      onApplyFilters()
    },
    (err) => {
      isRecentering.value = false
      mapErrorMessage.value = err?.message || 'Unable to retrieve your location.'
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  )
}

onMounted(() => {
  loadGoogleMapsSdk()
    .then((maps) => {
      initMap(maps)
    })
    .catch((err) => {
      mapErrorMessage.value = err.message || 'Failed to initialise Google Maps.'
    })
})

onUnmounted(() => {
  clearMarkers()
  if (infoWindow) {
    infoWindow.close()
    infoWindow = null
  }
  if (centerMarker) {
    centerMarker.setMap(null)
    centerMarker = null
  }
  if (directionsRenderer) {
    directionsRenderer.setMap(null)
    directionsRenderer = null
  }
  directionsService = null
  mapInstance = null
  placesService = null
  autocomplete = null
  hasTriggeredInitialSearch = false
})
</script>

<style scoped>
.map-wrapper {
  position: relative;
  min-height: 480px;
  border-radius: 14px;
  overflow: hidden;
  background: #f1f5f9;
}
.map-canvas {
  width: 100%;
  min-height: 480px;
}
.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
.panel {
  border-radius: 14px;
}
.results {
  border-top: 1px solid #e5e7eb;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}
.result-item {
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.result-item h3 {
  color: #1f2937;
}
.result-item.active,
.result-item:hover {
  background-color: #e8f5e9;
  color: inherit;
  border-color: #cdeadc;
}
.result-item.active h3,
.result-item.active p,
.result-item.active span {
  color: inherit;
}
.result-header {
  display: flex;
  align-items: center;
}
.result-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.get-route-button {
  white-space: nowrap;
}
.address-row {
  width: 100%;
  align-items: center;
}
.address-input {
  flex: 1 1 220px;
  min-width: 0;
}
.address-button {
  flex: 0 0 auto;
}
.results-pagination button {
  min-width: 110px;
}
.route-summary-card {
  background-color: #f8fafc;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.route-summary-card.is-active {
  border-color: #198754;
  box-shadow: 0 0 0 0.1rem rgba(25, 135, 84, 0.25);
}
</style>
