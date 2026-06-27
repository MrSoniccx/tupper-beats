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
export async function spotifyGet(path) {
  const token = await getToken()
  if (!token) return null
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const text = await res.text()
    if (!text.trim()) return { status: res.status } // 204 No Content
    return JSON.parse(text)
  } catch {
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
  return spotifyGet(`/playlists/${playlistId}/tracks?limit=1&offset=${offset}`)
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
  return data?.tracks?.items ?? null
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
