// savedTracks.js — Carga completa de "Me gusta" (todas las canciones guardadas)
// Vive en un módulo aparte (y no dentro de Settings.jsx) porque ahora se dispara
// desde DOS lugares: el loader inicial de la app (SplashScreen / App.jsx, para
// precargarlas ni bien arranca) y la pestaña "Mis canciones" de Settings (que
// sigue usando el mismo cache y el mismo botón "Actualizar").
//
// Usa IPC al proceso principal (getSavedTracks → getValidToken con auto-refresh
// real) en vez de spotifyGet directo — mismo motivo que ya explicaba el
// comentario original en Settings.jsx: evita tokens vencidos silenciosos.

async function fetchAllViaIPC(onProgress) {
  const all = []
  let offset = 0
  let total = Infinity
  while (offset < total) {
    const res = await window.electronAPI?.getSavedTracks?.(offset)
    if (!res?.items) break
    total = res.total ?? total
    const batch = res.items.filter(i => i.track).map(i => ({
      uri: i.track.uri, name: i.track.name,
      artist: i.track.artists.map(a => a.name).join(', '),
      albumArt: i.track.album?.images?.[1]?.url || i.track.album?.images?.[0]?.url || '',
      duration: i.track.duration_ms,
    }))
    all.push(...batch)
    offset += res.items.length
    if (onProgress) onProgress(all.length, total)
    if (res.items.length < 50) break
  }
  return { tracks: all, total: total === Infinity ? all.length : total }
}

// Promesa compartida a nivel de módulo — si el loader inicial y la pestaña
// "Mis canciones" piden la carga casi al mismo tiempo, la segunda llamada
// simplemente espera la misma promesa en vez de disparar una segunda tanda
// de requests a Spotify.
let loadingPromise = null

// `store` es el hook de zustand (useAppStore) — se le puede llamar
// `.getState()` / `.setState()` fuera de un componente sin problema.
export function ensureSavedTracksLoaded(store) {
  const { savedTracksCache, setSavedTracksCache, setSavedTracksLoading, setSavedTracksProgress } = store.getState()
  if (savedTracksCache !== null) return Promise.resolve(savedTracksCache)
  if (loadingPromise) return loadingPromise

  setSavedTracksLoading(true)
  setSavedTracksProgress({ loaded: 0, total: 0 })

  loadingPromise = fetchAllViaIPC((loaded, total) => {
    store.getState().setSavedTracksProgress({ loaded, total })
  }).then(({ tracks, total }) => {
    store.getState().setSavedTracksCache(tracks, total)
    return tracks
  }).catch((err) => {
    console.warn('[TupperBeats] ensureSavedTracksLoaded falló', err)
    store.getState().setSavedTracksLoading(false)
    throw err
  }).finally(() => {
    loadingPromise = null
  })

  return loadingPromise
}

export { fetchAllViaIPC }
