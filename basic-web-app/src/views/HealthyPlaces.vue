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
      </div>

      <div class="col-12 col-lg-4">
        <aside class="panel card shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <form class="filters-form" @submit.prevent="onApplyFilters">
              <div class="mb-3">
                <h2 class="h5 mb-3">Find healthy places</h2>
                <label class="form-label" for="address-input">Search by address</label>
                <input
                  id="address-input"
                  ref="addressInputRef"
                  type="text"
                  class="form-control"
                  v-model="addressQuery"
                  placeholder="Enter a location or suburb"
                />
                <small class="text-muted d-block mt-2">
                  Allow location access to centre the map around you. Otherwise, we will start in Melbourne CBD.
                </small>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm mt-2"
                  :disabled="isRecentering"
                  @click="moveToUserLocation"
                >
                  {{ isRecentering ? 'Locating...' : 'Move to my location' }}
                </button>
              </div>

              <div class="mb-3">
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

              <div class="mb-3">
                <label class="form-label" for="sort-select">Sort by</label>
                <select id="sort-select" class="form-select" v-model="selectedSortKey">
                  <option v-for="opt in sortOptions" :key="opt.key" :value="opt.key">
                    {{ opt.label }}
                  </option>
                </select>
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
                    v-for="place in searchResults"
                    :key="place.id"
                    class="list-group-item result-item"
                    :class="{ active: activePlaceId === place.id }"
                    role="button"
                    @click="focusPlace(place.id)"
                  >
                    <div class="d-flex justify-content-between">
                      <h3 class="h6 mb-1">{{ place.name }}</h3>
                      <span v-if="place.rating" class="badge bg-warning text-dark">
                        &#9733 {{ place.rating.toFixed(1) }}
                      </span>
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
import { ref, onMounted, onUnmounted } from 'vue'

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
const currentCenter = ref({ ...DEFAULT_CENTER })

let mapInstance = null
let placesService = null
let autocomplete = null
let infoWindow = null
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
  const target = searchResults.value.find((p) => p.id === placeId)
  if (!target || !mapInstance) return

  activePlaceId.value = placeId
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
.result-item.active,
.result-item:hover {
  background-color: #e8f5e9;
}
</style>

