import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'
import Login from './pages/Login'
import Settings from './pages/Settings'
import NotificationPage from './pages/Notification'
import SplashScreen from './pages/SplashScreen'

export default function App() {
  const { isAuthenticated, loadSettings, setCurrentTrack, setIsPlaying, setProgress, setShuffle, setRepeatMode } = useAppStore()

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

    return () => {
      window.electronAPI?.removeAllListeners('track-changed')
      window.electronAPI?.removeAllListeners('oauth-callback')
    }
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/splash"       element={<SplashScreen />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/settings"     element={<Settings />} />
        <Route path="/notification" element={<NotificationPage />} />
        <Route path="/"             element={<Navigate to="/splash" replace />} />
      </Routes>
    </HashRouter>
  )
}
