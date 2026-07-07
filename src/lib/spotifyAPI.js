// spotifyAPI.js — Capa de fetch directo al API de Spotify desde el renderer
// Usa window.fetch() igual que useSpotifyControls.js (sin IPC al proceso principal)
// Esto evita problemas de JSON.parse, crashes del main process, y lentencia de IPC.

const BASE = 'https://api.spotify.com/v1'

async function getToken() {
  // Usa el main process para obtener un token válido (con auto-refresh)
  // Fallback a storeGet por si el IPC aún no está listo
  try {
    const valid = await window.electronAPI?.getValidToken?.()
    if (valid) return valid
  } catch {}
  return window.electronAPI?.storeGet('spotifyAccessToken', null)
}

// ─── GET genérico ────────────────────────────────────────────────────────────
// Nota de depuración: antes esta función devolvía `null` en TODOS los casos de
// falla (sin token, HTTP no-ok, excepción de red) sin dejar ningún rastro —
// eso hacía imposible saber, con los mismos síntomas para el usuario, si el
// problema real era un token vencido (401), falta de permisos (403), rate
// limit (429) u otra cosa.
//
// El console.warn de acá solo se ve en el DevTools de ESA ventana (Settings o
// notificación tienen cada una el suyo) — no en la terminal de `npm run dev`.
// Por eso también mandamos el detalle por IPC al proceso principal, que sí
// imprime en esa terminal, etiquetado con qué ventana lo disparó.
function reportSpotifyError(path, reason, detail) {
  console.warn(`[TupperBeats] spotifyGet(${path}): ${reason}`, detail ?? '')
  try { window.electronAPI?.logSpotifyError?.({ path, reason, detail: detail ? String(detail).slice(0, 300) : '' }) } catch {}
}

export async function spotifyGet(path) {
  const token = await getToken()
  if (!token) {
    reportSpotifyError(path, 'sin token disponible')
    return null
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      // 'no-store': la ventana principal y la de notificación comparten la
      // misma sesión/caché HTTP de Chromium (no usan `partition` separados).
      // Sin esto, una respuesta vacía/abortada que quede cacheada para una
      // URL de búsqueda (ej. por la vieja lógica de reintento, que pegaba el
      // mismo fetch dos veces seguidas) puede quedar servida desde caché en
      // el próximo intento — 200 "ok" pero con body vacío — para SIEMPRE,
      // aunque el token y la red estén perfectamente bien. Esto es exactamente
      // lo que loguearon los tests: notificación -> "searchSpotify devolvió
      // null" sin ningún HTTP-error de por medio, porque nunca llegó a
      // pegarle a la red — vino de una entrada de caché vacía.
      cache: 'no-store',
    })
    if (!res.ok) {
      let body = ''
      try { body = await res.text() } catch {}
      reportSpotifyError(path, `HTTP ${res.status}`, body)
      return null
    }
    const text = await res.text()
    if (!text.trim()) {
      // Para /me/player esto es normal (204 = sin dispositivo activo). Para
      // cualquier otro endpoint (como /search) es anómalo — lo reportamos
      // igual para que quede visible en la terminal si vuelve a pasar.
      if (res.status !== 204) reportSpotifyError(path, `respuesta vacía inesperada (HTTP ${res.status})`)
      return { status: res.status }
    }
    return JSON.parse(text)
  } catch (err) {
    reportSpotifyError(path, 'excepción de red', err?.message || err)
    return null
  }
}

// ─── POST / PUT sin body ─────────────────────────────────────────────────────
export async function spotifyPost(path, method = 'POST') {
  const token = await getToken()
  if (!token) return null
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    })
    return { status: res.status }
  } catch {
    return null
  }
}

// ─── Biblioteca ───────────────────────────────────────────────────────────────
export async function fetchSavedTracks(offset = 0) {
  return spotifyGet(`/me/tracks?limit=50&offset=${offset}`)
}

export async function fetchSavedAlbums(offset = 0) {
  return spotifyGet(`/me/albums?limit=50&offset=${offset}`)
}

export async function fetchPlaylists(offset = 0) {
  return spotifyGet(`/me/playlists?limit=50&offset=${offset}`)
}

export async function fetchPlaylistTracks(playlistId, offset = 0) {
  return spotifyGet(`/playlists/${playlistId}/items?limit=10&offset=${offset}`)
}

export async function fetchAlbumTracks(albumId, offset = 0) {
  return spotifyGet(`/albums/${albumId}/tracks?limit=50&offset=${offset}`)
}

// ─── Cola ─────────────────────────────────────────────────────────────────────
export async function fetchQueue() {
  return spotifyGet('/me/player/queue')
}

export async function addToQueue(uri) {
  return spotifyPost(`/me/player/queue?uri=${encodeURIComponent(uri)}`)
}

// ─── Búsqueda ─────────────────────────────────────────────────────────────────
export async function searchSpotify(query, limit = 30) {
  const q = encodeURIComponent(query.trim())
  const data = await spotifyGet(`/search?q=${q}&type=track&limit=${limit}`)
  const items = data?.tracks?.items ?? null
  // Log de confirmación — así en la terminal se ve, para cada ventana, si la
  // búsqueda realmente llegó a Spotify y cuántos resultados trajo (o si
  // "items" quedó null porque spotifyGet ya falló antes, cuyo motivo se
  // reportó arriba en reportSpotifyError).
  try {
    window.electronAPI?.logSpotifyError?.({
      path: `/search?q=${q}`,
      reason: items ? `OK — ${items.length} resultados` : 'searchSpotify devolvió null',
      detail: '',
    })
  } catch {}
  return items
}

// ─── Estado del reproductor (shuffle, repeat, volumen) ───────────────────────
export async function fetchPlayerState() {
  const data = await spotifyGet('/me/player')
  if (!data || data.status) return null // status-only = 204 (sin dispositivo activo)
  return {
    shuffle:   data.shuffle_state  ?? false,
    repeat:    data.repeat_state   ?? 'off', // 'off' | 'context' | 'track'
    volume:    data.device?.volume_percent ?? 70,
    isPlaying: data.is_playing     ?? false,
  }
}

// ─── Shuffle / Repeat ─────────────────────────────────────────────────────────
export async function setShuffle(state) {
  return spotifyPost(`/me/player/shuffle?state=${state}`, 'PUT')
}

export async function setRepeat(state) {
  return spotifyPost(`/me/player/repeat?state=${state}`, 'PUT')
}

// ─── Volumen ──────────────────────────────────────────────────────────────────
export async function setVolume(volumePercent) {
  return spotifyPost(`/me/player/volume?volume_percent=${Math.floor(volumePercent)}`, 'PUT')
}

// ─── Carga TODAS las canciones guardadas (paginación automática) ──────────────
export async function fetchAllSavedTracks(onProgress) {
  const all = []
  let offset = 0
  let total = Infinity
  while (offset < total) {
    const res = await fetchSavedTracks(offset)
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
  return all
}

// ─── Carga TODAS las canciones de una playlist (paginación automática) ────────
export async function fetchAllPlaylistTracks(playlistId, onProgress) {
  const all = []
  let offset = 0
  let total = Infinity
  while (offset < total) {
    const res = await spotifyGet(`/playlists/${playlistId}/tracks?limit=100&offset=${offset}`)
    if (!res?.items) break
    total = res.total ?? total
    const batch = res.items
      .filter(i => i.track && i.track.uri)
      .map(i => ({
        uri: i.track.uri, name: i.track.name,
        artist: i.track.artists?.map(a => a.name).join(', ') || '',
        albumArt: i.track.album?.images?.[1]?.url || i.track.album?.images?.[0]?.url || '',
        duration: i.track.duration_ms,
      }))
    all.push(...batch)
    offset += res.items.length
    if (onProgress) onProgress(all.length, total)
    if (res.items.length < 100) break
  }
  return all
}
