// useSpotifySearch.js — Hook único de búsqueda en Spotify con debounce.
//
// Antes había DOS implementaciones separadas de este mismo debounce+fetch:
// una en el buscador de Settings (GlobalSearch) y otra distinta en el panel
// de la notificación (con un reintento extra y un mensaje de error propio).
// Al vivir en dos archivos podían divergir con el tiempo — y de hecho lo
// hicieron: el buscador de la notificación mostraba un error explícito
// ("No se pudo conectar con Spotify") en casos donde Settings simplemente
// mostraba "Sin resultados" para el mismo fallo subyacente.
//
// Ahora ambos usan este único hook, así cualquier búsqueda de la app se
// comporta EXACTAMENTE igual — mismo debounce, mismo manejo de errores.
import { useState, useEffect, useRef } from 'react'
import { searchSpotify } from '../lib/spotifyAPI'

export function useSpotifySearch(query, { limit = 10, debounceMs = 380 } = {}) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    const q = query.trim()
    if (!q) { setResults([]); setLoading(false); setError(false); return }

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      setError(false)
      try {
        const items = await searchSpotify(q, limit)
        if (Array.isArray(items)) {
          setResults(items.map(i => ({
            uri: i.uri, name: i.name,
            artist: i.artists?.map(a => a.name).join(', ') || '',
            albumArt: i.album?.images?.[1]?.url || i.album?.images?.[0]?.url || '',
            duration: i.duration_ms,
          })))
          setError(false)
        } else {
          // searchSpotify devuelve null cuando algo falló (sin token, HTTP
          // no-ok, red). Revisa la consola (F12) — spotifyGet ahora loguea
          // el motivo exacto ahí.
          setResults([])
          setError(true)
        }
      } catch {
        setResults([])
        setError(true)
      }
      setLoading(false)
    }, debounceMs)

    return () => clearTimeout(timerRef.current)
  }, [query, limit, debounceMs])

  return { results, loading, error }
}
