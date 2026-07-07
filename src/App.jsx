import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from './store/useAppStore'
import { applyThemeVars } from './themes'
import { ensureSavedTracksLoaded } from './lib/savedTracks'
import Login from './pages/Login'
import Settings from './pages/Settings'
import NotificationPage from './pages/Notification'
import SplashScreen from './pages/SplashScreen'

// La ventana de notificación carga este mismo bundle pero directo en la ruta
// "#/notification" (ver electron/main.js) — es un proceso de renderer aparte,
// con su propio store en memoria. La precarga de "Me gusta" y la barra de
// carga de arriba sólo tienen sentido en la ventana principal.
const isNotificationWindow = window.location.hash.startsWith('#/notification')

// ─── Barra de carga global ────────────────────────────────────────────────────
// Se muestra pegada arriba de TODA la app (no sólo dentro de "Mis canciones")
// mientras el cache de "Me gusta" sigue cargando — cubre el caso de que la
// precarga del splash no haya terminado a tiempo.
function TopLoadingBar() {
  const { savedTracksLoading, savedTracksProgress } = useAppStore()
  const pct = savedTracksProgress && savedTracksProgress.total > 0
    ? Math.min(100, Math.round((savedTracksProgress.loaded / savedTracksProgress.total) * 100))
    : null

  return (
    <AnimatePresence>
      {savedTracksLoading && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: 3,
            background: 'rgba(255,255,255,0.06)', zIndex: 9999, overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {pct !== null ? (
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(90deg, var(--tb-primary), var(--tb-accent))' }}
              animate={{ width: `${pct}%` }}
              transition={{ ease: 'linear' }}
            />
          ) : (
            <motion.div
              style={{ height: '100%', width: '30%', background: 'linear-gradient(90deg, var(--tb-primary), var(--tb-accent))' }}
              animate={{ x: ['-100%', '350%'] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const { isAuthenticated, activeTheme, loadSettings, setCurrentTrack, setIsPlaying, setProgress, setShuffle, setRepeatMode, setActiveThemeLocal, setLikedQueue } = useAppStore()

  // Aplica las variables CSS (--tb-*) del tema activo cada vez que cambia.
  // Es lo único que necesita saber sobre "temas" — el resto de la app sólo
  // consume var(--tb-xxx), nunca colores fijos.
  useEffect(() => {
    applyThemeVars(activeTheme)
  }, [activeTheme])

  useEffect(() => {
    loadSettings()

    // Escuchar cambios de canción desde el proceso main
    window.electronAPI?.onTrackChanged((track) => {
      if (!track._progressOnly) {
        setCurrentTrack(track)
      }
      setIsPlaying(track.isPlaying)
      setProgress(track.progress)
      // El polling trae shuffle/repeat en cada tick — mantiene sincronizados
      // los controles de esta ventana con la ventana de notificación y con Spotify.
      if (track.shuffle !== undefined) setShuffle(track.shuffle)
      if (track.repeat !== undefined) setRepeatMode(track.repeat)
    })

    // Escuchar callback OAuth
    window.electronAPI?.onOAuthCallback((url) => {
      // El componente Login escucha este evento también
      window.dispatchEvent(new CustomEvent('oauth-callback', { detail: url }))
    })

    // Cambio de tema disparado desde otra ventana (ej. Settings cambia el
    // tema mientras la notificación ya está abierta) — sólo actualiza el
    // estado local, sin volver a escribirlo en electron-store.
    window.electronAPI?.onThemeChanged((theme) => {
      setActiveThemeLocal(theme)
    })

    // Sincronizar el modo manual de "Mis canciones" entre ventana principal y
    // notificación — así el botón Siguiente/Anterior de CUALQUIERA de las dos
    // sabe si tiene que avanzar por la cola local o llamar a Spotify normal.
    window.electronAPI?.onLikedQueueChanged?.((data) => {
      setLikedQueue(data)
    })

    return () => {
      window.electronAPI?.removeAllListeners('track-changed')
      window.electronAPI?.removeAllListeners('oauth-callback')
      window.electronAPI?.removeAllListeners('theme-changed')
      window.electronAPI?.removeAllListeners('liked-queue-changed')
    }
  }, [])

  // Precarga "Me gusta" ni bien hay sesión — arranca en el splash y, si no
  // llega a terminar antes de navegar a Settings, sigue en segundo plano (la
  // TopLoadingBar de abajo se encarga de avisar que todavía está cargando).
  // También cubre el caso de un login recién hecho (isAuthenticated pasa a
  // true después del splash).
  useEffect(() => {
    if (isNotificationWindow) return
    if (!isAuthenticated) return
    ensureSavedTracksLoaded(useAppStore)
  }, [isAuthenticated])

  return (
    <>
      {!isNotificationWindow && <TopLoadingBar />}
      <HashRouter>
        <Routes>
          <Route path="/splash"       element={<SplashScreen />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/settings"     element={<Settings />} />
          <Route path="/notification" element={<NotificationPage />} />
          <Route path="/"             element={<Navigate to="/splash" replace />} />
        </Routes>
      </HashRouter>
    </>
  )
}
