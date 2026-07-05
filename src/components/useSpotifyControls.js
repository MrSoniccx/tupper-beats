// Hook para controles de Spotify desde el renderer
// Las llamadas van directamente al API de Spotify con el token del store
import { useCallback } from 'react'
import useAppStore from '../store/useAppStore'

const BASE = 'https://api.spotify.com/v1'

async function spotifyFetch(path, method = 'GET', body = null) {
  const token = await window.electronAPI?.storeGet('spotifyAccessToken', null)
  if (!token) return { error: 'No token' }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== null ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  })

  return { status: res.status }
}

export function useSpotifyControls() {
  const { isPlaying, setIsPlaying } = useAppStore()

  const play = useCallback(async () => {
    await spotifyFetch('/me/player/play', 'PUT', {})
    setIsPlaying(true)
  }, [])

  const pause = useCallback(async () => {
    await spotifyFetch('/me/player/pause', 'PUT')
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(async () => {
    if (isPlaying) await pause()
    else await play()
  }, [isPlaying])

  const next = useCallback(async () => {
    await spotifyFetch('/me/player/next', 'POST')
  }, [])

  const previous = useCallback(async () => {
    await spotifyFetch('/me/player/previous', 'POST')
  }, [])

  const seek = useCallback(async (positionMs) => {
    await spotifyFetch(`/me/player/seek?position_ms=${Math.floor(positionMs)}`, 'PUT')
  }, [])

  const setVolume = useCallback(async (volumePercent) => {
    await spotifyFetch(`/me/player/volume?volume_percent=${Math.floor(volumePercent)}`, 'PUT')
  }, [])

  // Reproduce un URI de Spotify:
  //   spotify:track:xxx   → uris array  (inicia sólo esa canción)
  //   spotify:album:xxx   → context_uri (inicia el álbum desde el principio)
  //   spotify:playlist:xxx→ context_uri
  const playUri = useCallback(async (uri, offsetUri = null) => {
    let body
    if (uri.startsWith('spotify:track:')) {
      body = { uris: [uri] }
    } else {
      body = { context_uri: uri }
      // Si se pasa un offset (URI de una canción dentro del contexto) se respeta
      if (offsetUri) {
        body.offset = { uri: offsetUri }
      }
    }
    const res = await spotifyFetch('/me/player/play', 'PUT', body)
    if (res.status === 204) setIsPlaying(true)
    return res
  }, [])

  // Reproduce una canción dentro de un contexto (playlist/álbum)
  // context: URI del contexto, trackUri: URI del track específico
  const playTrackInContext = useCallback(async (contextUri, trackUri) => {
    const body = {
      context_uri: contextUri,
      offset: { uri: trackUri },
      position_ms: 0,
    }
    const res = await spotifyFetch('/me/player/play', 'PUT', body)
    if (res.status === 204) setIsPlaying(true)
    return res
  }, [])

  // Avanza la COLA ACTUAL hasta la canción en la posición `index` (0 = la próxima
  // en cola), en vez de reemplazar la reproducción por esa canción sola.
  // La API de Spotify no tiene un endpoint para "saltar" directo a un punto de la
  // cola, así que se simula llamando "siguiente" repetidamente (index+1 veces) —
  // es el mismo truco que usa el propio Spotify cuando tocás una canción de tu cola.
  const playQueueIndex = useCallback(async (index) => {
    if (index === undefined || index === null || index < 0) return
    for (let i = 0; i <= index; i++) {
      const res = await spotifyFetch('/me/player/next', 'POST')
      if (res?.error || (res?.status && res.status >= 400)) break
    }
    setIsPlaying(true)
  }, [])

  return { play, pause, togglePlay, next, previous, seek, setVolume, playUri, playTrackInContext, playQueueIndex }
}
