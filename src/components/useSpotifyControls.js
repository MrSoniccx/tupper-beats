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
  const {
    isPlaying, setIsPlaying,
    shuffle, repeatMode,
    likedQueue, setLikedQueue, clearLikedQueue,
  } = useAppStore()

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

  // Sale del modo manual de "Mis canciones" y avisa a la otra ventana
  // (principal ↔ notificación) para que quede sincronizado.
  const exitLikedQueue = useCallback(() => {
    clearLikedQueue()
    window.electronAPI?.broadcastLikedQueue?.(null)
  }, [])

  // Reproduce una posición puntual DENTRO del modo manual — un solo track por
  // vez, sin tocar /me/player/queue (eso fue lo que rompía todo: encolar de a
  // cientos terminaba corrompiendo la cola real del dispositivo y dejaba la
  // app sin poder reproducir/avanzar nada más).
  const playLikedAt = useCallback(async (queueState, idx) => {
    const uri = queueState.uris[idx]
    if (!uri) return
    const res = await spotifyFetch('/me/player/play', 'PUT', { uris: [uri] })
    if (res.status === 204) setIsPlaying(true)
    const updated = { uris: queueState.uris, idx }
    setLikedQueue(updated)
    window.electronAPI?.broadcastLikedQueue?.(updated)
    return res
  }, [])

  // Arranca el modo manual — llamado desde Settings.jsx al tocar una canción
  // en "Mis canciones". `uris` es la lista completa (en su orden actual) y
  // `startIndex` la posición de la canción tocada.
  const startLikedQueue = useCallback(async (uris, startIndex) => {
    return playLikedAt({ uris, idx: startIndex }, startIndex)
  }, [playLikedAt])

  const next = useCallback(async () => {
    if (likedQueue) {
      const { uris, idx } = likedQueue
      let nextIdx
      if (shuffle && uris.length > 1) {
        do { nextIdx = Math.floor(Math.random() * uris.length) } while (nextIdx === idx)
      } else {
        nextIdx = idx + 1
        if (nextIdx >= uris.length) {
          if (repeatMode === 'off') return // fin de la lista — no hay más nada que hacer
          nextIdx = 0 // repetir contexto/canción → reinicia desde el principio
        }
      }
      await playLikedAt(likedQueue, nextIdx)
      return
    }
    await spotifyFetch('/me/player/next', 'POST')
  }, [likedQueue, shuffle, repeatMode, playLikedAt])

  const previous = useCallback(async () => {
    if (likedQueue) {
      const { uris, idx } = likedQueue
      let prevIdx
      if (shuffle && uris.length > 1) {
        do { prevIdx = Math.floor(Math.random() * uris.length) } while (prevIdx === idx)
      } else {
        prevIdx = idx - 1
        if (prevIdx < 0) {
          if (repeatMode === 'off') return
          prevIdx = uris.length - 1
        }
      }
      await playLikedAt(likedQueue, prevIdx)
      return
    }
    await spotifyFetch('/me/player/previous', 'POST')
  }, [likedQueue, shuffle, repeatMode, playLikedAt])

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
  // Se usa para TODO lo que no sea "Mis canciones" (playlists, álbumes,
  // búsqueda, búsqueda global) — por eso sale del modo manual acá.
  const playUri = useCallback(async (uri, offsetUri = null) => {
    exitLikedQueue()
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
  }, [exitLikedQueue])

  // Reproduce una canción dentro de un contexto (playlist/álbum)
  // context: URI del contexto, trackUri: URI del track específico
  const playTrackInContext = useCallback(async (contextUri, trackUri) => {
    exitLikedQueue()
    const body = {
      context_uri: contextUri,
      offset: { uri: trackUri },
      position_ms: 0,
    }
    const res = await spotifyFetch('/me/player/play', 'PUT', body)
    if (res.status === 204) setIsPlaying(true)
    return res
  }, [exitLikedQueue])

  // Avanza la COLA ACTUAL hasta la canción en la posición `index` (0 = la próxima
  // en cola), en vez de reemplazar la reproducción por esa canción sola.
  // La API de Spotify no tiene un endpoint para "saltar" directo a un punto de la
  // cola, así que se simula llamando "siguiente" repetidamente (index+1 veces) —
  // es el mismo truco que usa el propio Spotify cuando tocás una canción de tu cola.
  const playQueueIndex = useCallback(async (index) => {
    if (index === undefined || index === null || index < 0) return
    exitLikedQueue()
    for (let i = 0; i <= index; i++) {
      const res = await spotifyFetch('/me/player/next', 'POST')
      if (res?.error || (res?.status && res.status >= 400)) break
    }
    setIsPlaying(true)
  }, [exitLikedQueue])

  return { play, pause, togglePlay, next, previous, seek, setVolume, playUri, playTrackInContext, playQueueIndex, startLikedQueue }
}
