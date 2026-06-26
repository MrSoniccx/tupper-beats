// spotify.js — Polling de Spotify API + controles de reproducción + biblioteca
const https = require('https')

let pollingInterval = null
let lastTrackId = null

// ─── Helper: fetch con HTTPS nativo ────────────────────────────────────────
function spotifyRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        // Parseo seguro: 204 No Content, HTML de error, o respuestas no-JSON
        // no deben crashear el proceso principal
        let parsed = null
        if (data && data.trim()) {
          try { parsed = JSON.parse(data) } catch { parsed = null }
        }
        resolve({ status: res.statusCode, body: parsed })
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

// ─── Refresh de token ──────────────────────────────────────────────────────
async function refreshAccessToken(store) {
  const refreshToken = store.get('spotifyRefreshToken')
  const clientId     = store.get('spotifyClientId')
  if (!refreshToken || !clientId) return null

  const params = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: refreshToken,
    client_id:     clientId,
  })

  const body = params.toString()
  const options = {
    hostname: 'accounts.spotify.com',
    path:     '/api/token',
    method:   'POST',
    headers: {
      'Content-Type':   'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  }

  const req = https.request(options)
  return new Promise((resolve) => {
    req.on('response', (res) => {
      let data = ''
      res.on('data', c => (data += c))
      res.on('end', () => {
        const json = JSON.parse(data)
        if (json.access_token) {
          store.set('spotifyAccessToken', json.access_token)
          store.set('spotifyTokenExpiry', Date.now() + json.expires_in * 1000)
          resolve(json.access_token)
        } else {
          resolve(null)
        }
      })
    })
    req.on('error', () => resolve(null))
    req.write(body)
    req.end()
  })
}

// ─── Obtener token válido ──────────────────────────────────────────────────
async function getValidToken(store) {
  const expiry = store.get('spotifyTokenExpiry', 0)
  const token  = store.get('spotifyAccessToken')

  if (!token) return null
  if (Date.now() < expiry - 60000) return token // Válido por más de 1 min

  return await refreshAccessToken(store)
}

// ─── Currently playing ─────────────────────────────────────────────────────
async function getCurrentlyPlaying(token) {
  const options = {
    hostname: 'api.spotify.com',
    path:     '/v1/me/player/currently-playing',
    method:   'GET',
    headers: { Authorization: `Bearer ${token}` },
  }
  try {
    const res = await spotifyRequest(options)
    if (res.status === 200 && res.body) return res.body
    return null
  } catch {
    return null
  }
}

// ─── Cola de reproducción ──────────────────────────────────────────────────
async function getQueue(store) {
  const token = await getValidToken(store)
  if (!token) return null
  const options = {
    hostname: 'api.spotify.com',
    path:     '/v1/me/player/queue',
    method:   'GET',
    headers:  { Authorization: `Bearer ${token}` },
  }
  try {
    const res = await spotifyRequest(options)
    if (res.status === 200 && res.body) return res.body
    return null
  } catch { return null }
}

// ─── Canciones guardadas ───────────────────────────────────────────────────
async function getSavedTracks(store, offset = 0) {
  const token = await getValidToken(store)
  if (!token) return null
  const options = {
    hostname: 'api.spotify.com',
    path:     `/v1/me/tracks?limit=50&offset=${offset}`,
    method:   'GET',
    headers:  { Authorization: `Bearer ${token}` },
  }
  try {
    const res = await spotifyRequest(options)
    if (res.status === 200 && res.body) return res.body
    return null
  } catch { return null }
}

// ─── Álbumes guardados ─────────────────────────────────────────────────────
async function getSavedAlbums(store, offset = 0) {
  const token = await getValidToken(store)
  if (!token) return null
  const options = {
    hostname: 'api.spotify.com',
    path:     `/v1/me/albums?limit=50&offset=${offset}`,
    method:   'GET',
    headers:  { Authorization: `Bearer ${token}` },
  }
  try {
    const res = await spotifyRequest(options)
    if (res.status === 200 && res.body) return res.body
    return null
  } catch { return null }
}

// ─── Reproducir track específico ──────────────────────────────────────────
async function playTrack(store, uri) {
  const token = await getValidToken(store)
  if (!token) return { error: 'No token' }
  const options = {
    hostname: 'api.spotify.com',
    path:     '/v1/me/player/play',
    method:   'PUT',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
  const body = JSON.stringify({ uris: [uri] })
  try {
    const res = await spotifyRequest(options, body)
    return { status: res.status }
  } catch (e) {
    return { error: e.message }
  }
}

// ─── Iniciar polling ───────────────────────────────────────────────────────
function startSpotifyPolling(store, onTrackChange) {
  stopSpotifyPolling()

  pollingInterval = setInterval(async () => {
    const token = await getValidToken(store)
    if (!token) return

    const data = await getCurrentlyPlaying(token)
    if (!data || !data.item) return

    const track = {
      id:        data.item.id,
      uri:       data.item.uri,
      name:      data.item.name,
      artist:    data.item.artists.map(a => a.name).join(', '),
      album:     data.item.album.name,
      albumArt:  data.item.album.images[0]?.url || '',
      duration:  data.item.duration_ms,
      progress:  data.progress_ms,
      isPlaying: data.is_playing,
      explicit:  data.item.explicit,
    }

    if (track.id !== lastTrackId) {
      lastTrackId = track.id
      onTrackChange(track)
    } else {
      onTrackChange({ ...track, _progressOnly: true })
    }
  }, 3000)
}

function stopSpotifyPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
  lastTrackId = null
}

// ─── Controles de reproducción ─────────────────────────────────────────────
async function playerControl(store, method, path, body = null) {
  const token = await getValidToken(store)
  if (!token) return { error: 'No token' }

  const options = {
    hostname: 'api.spotify.com',
    path,
    method,
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
  try {
    const res = await spotifyRequest(options, body)
    return { status: res.status }
  } catch (e) {
    return { error: e.message }
  }
}

module.exports = {
  startSpotifyPolling,
  stopSpotifyPolling,
  getValidToken,
  playerControl,
  getQueue,
  getSavedTracks,
  getSavedAlbums,
  playTrack,
  getUserPlaylists,
  getPlaylistTracks,
  getAlbumTracks,
  searchTracks,
  setShuffleState,
  setRepeatState,
  addToQueue,
}

// ─── Playlists del usuario ─────────────────────────────────────────────────
async function getUserPlaylists(store, offset = 0) {
  const token = await getValidToken(store)
  if (!token) return null
  const options = {
    hostname: 'api.spotify.com',
    path:     `/v1/me/playlists?limit=50&offset=${offset}`,
    method:   'GET',
    headers:  { Authorization: `Bearer ${token}` },
  }
  try {
    const res = await spotifyRequest(options)
    if (res.status === 200 && res.body) return res.body
    return null
  } catch { return null }
}

// ─── Tracks de una playlist ─────────────────────────────────────────────────
async function getPlaylistTracks(store, playlistId, offset = 0) {
  const token = await getValidToken(store)
  if (!token) return null
  const options = {
    hostname: 'api.spotify.com',
    path:     `/v1/playlists/${playlistId}/tracks?limit=100&offset=${offset}`,
    method:   'GET',
    headers:  { Authorization: `Bearer ${token}` },
  }
  try {
    const res = await spotifyRequest(options)
    if (res.status === 200 && res.body) return res.body
    return null
  } catch { return null }
}

// ─── Tracks de un álbum ────────────────────────────────────────────────────
async function getAlbumTracks(store, albumId, offset = 0) {
  const token = await getValidToken(store)
  if (!token) return null
  const options = {
    hostname: 'api.spotify.com',
    path:     `/v1/albums/${albumId}/tracks?limit=50&offset=${offset}`,
    method:   'GET',
    headers:  { Authorization: `Bearer ${token}` },
  }
  try {
    const res = await spotifyRequest(options)
    if (res.status === 200 && res.body) return res.body
    return null
  } catch { return null }
}

// ─── Búsqueda de canciones ─────────────────────────────────────────────────
async function searchTracks(store, query) {
  const token = await getValidToken(store)
  if (!token) return null
  const q = encodeURIComponent(query)
  const options = {
    hostname: 'api.spotify.com',
    path:     `/v1/search?q=${q}&type=track&limit=30`,
    method:   'GET',
    headers:  { Authorization: `Bearer ${token}` },
  }
  try {
    const res = await spotifyRequest(options)
    if (res.status === 200 && res.body) return res.body
    return null
  } catch { return null }
}

// ─── Shuffle ───────────────────────────────────────────────────────────────
async function setShuffleState(store, state) {
  const token = await getValidToken(store)
  if (!token) return { error: 'No token' }
  const options = {
    hostname: 'api.spotify.com',
    path:     `/v1/me/player/shuffle?state=${state}`,
    method:   'PUT',
    // Sin Content-Type ni body — Spotify devuelve 204 No Content
    headers:  { Authorization: `Bearer ${token}`, 'Content-Length': '0' },
  }
  try {
    const res = await spotifyRequest(options)
    return { status: res.statusCode }
  } catch (e) { return { error: e.message } }
}

// ─── Repeat ────────────────────────────────────────────────────────────────
// state: 'track' | 'context' | 'off'
async function setRepeatState(store, state) {
  const token = await getValidToken(store)
  if (!token) return { error: 'No token' }
  const options = {
    hostname: 'api.spotify.com',
    path:     `/v1/me/player/repeat?state=${state}`,
    method:   'PUT',
    // Sin Content-Type ni body — Spotify devuelve 204 No Content
    headers:  { Authorization: `Bearer ${token}`, 'Content-Length': '0' },
  }
  try {
    const res = await spotifyRequest(options)
    return { status: res.statusCode }
  } catch (e) { return { error: e.message } }
}

// ─── Add to queue ──────────────────────────────────────────────────────────
async function addToQueue(store, uri) {
  const token = await getValidToken(store)
  if (!token) return { error: 'No token' }
  const options = {
    hostname: 'api.spotify.com',
    path:     `/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
    method:   'POST',
    headers:  { Authorization: `Bearer ${token}`, 'Content-Length': '0' },
  }
  try {
    const res = await spotifyRequest(options)
    return { status: res.statusCode }
  } catch (e) { return { error: e.message } }
}
