import { useEffect, useState, useRef, useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import { getTheme } from '../themes'

export default function NotificationPage() {
  const { currentTrack, setCurrentTrack, setIsPlaying, setProgress, setShuffle, setRepeatMode, activeTheme } = useAppStore()
  const ThemeNotification = getTheme(activeTheme).Notification
  const [isVisible, setIsVisible] = useState(true)
  const shouldHideOnExit = useRef(false)

  useEffect(() => {
    window.electronAPI?.onTrackChanged((track) => {
      if (!track._progressOnly) {
        // Nueva canción — mostrar y limpiar flag de hide
        shouldHideOnExit.current = false
        setIsVisible(true)
        setCurrentTrack(track)
      }
      setIsPlaying(track.isPlaying)
      setProgress(track.progress)
      // Mismo estado de shuffle/repeat que la ventana principal, en cada tick del polling
      if (track.shuffle !== undefined) setShuffle(track.shuffle)
      if (track.repeat !== undefined) setRepeatMode(track.repeat)
    })

    // El main nos avisa que el timer de auto-hide expiró → animar salida
    window.electronAPI?.onPrepareHide(() => {
      shouldHideOnExit.current = true
      setIsVisible(false)
    })

    return () => {
      window.electronAPI?.removeAllListeners('track-changed')
      window.electronAPI?.removeAllListeners('prepare-hide-notification')
    }
  }, [])

  // Cuando el usuario pulsa X → animar salida y luego ocultar ventana
  const handleClose = useCallback(() => {
    shouldHideOnExit.current = true
    setIsVisible(false)
  }, [])

  // AnimatePresence llama onExitComplete cuando termina la animación de salida
  const handleExitComplete = useCallback(() => {
    if (shouldHideOnExit.current) {
      window.electronAPI?.notificationHideReady()
      shouldHideOnExit.current = false
    }
  }, [])

  return (
    <ThemeNotification
      track={currentTrack}
      isVisible={isVisible}
      onClose={handleClose}
      onExitComplete={handleExitComplete}
    />
  )
}
