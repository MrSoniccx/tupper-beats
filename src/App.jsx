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

const isNotificationWindow = window.location.hash.startsWith('#/notification')

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

  useEffect(() => {
    applyThemeVars(activeTheme)
  }, [activeTheme])

  useEffect(() => {
    loadSettings()

    window.electronAPI?.onTrackChanged((track) => {
      if (!track._progressOnly) {
        setCurrentTrack(track)
      }
      setIsPlaying(track.isPlaying)
      setProgress(track.progress)
      if (track.shuffle !== undefined) setShuffle(track.shuffle)
      if (track.repeat !== undefined) setRepeatMode(track.repeat)
    })

    window.electronAPI?.onOAuthCallback((url) => {
      window.dispatchEvent(new CustomEvent('oauth-callback', { detail: url }))
    })

    window.electronAPI?.onThemeChanged((theme) => {
      setActiveThemeLocal(theme)
    })

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
