import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  // ─── Auth ───────────────────────────────────────────────────────────────
  isAuthenticated: false,
  setAuthenticated: (val) => set({ isAuthenticated: val }),

  // ─── Track actual ───────────────────────────────────────────────────────
  currentTrack: null,
  setCurrentTrack: (track) => set({ currentTrack: track }),

  isPlaying: false,
  setIsPlaying: (val) => set({ isPlaying: val }),

  progress: 0,
  setProgress: (val) => set({ progress: val }),

  // ─── Configuración (sincronizada con electron-store) ────────────────────
  activeTheme: 'hogwarts',
  setActiveTheme: async (theme) => {
    set({ activeTheme: theme })
    await window.electronAPI?.setActiveTheme(theme)
  },

  notificationMode: 'normal',       // 'always' | 'normal' | 'disabled'
  setNotificationMode: async (mode) => {
    set({ notificationMode: mode })
    await window.electronAPI?.storeSet('notificationMode', mode)
    window.electronAPI?.updateNotificationSettings({ mode })
  },

  notificationPosition: 'bottom-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  setNotificationPosition: async (position) => {
    set({ notificationPosition: position })
    await window.electronAPI?.storeSet('notificationPosition', position)
    window.electronAPI?.updateNotificationSettings({ position })
  },

  notificationAutoHide: 10, // segundos (0 = nunca)
  setNotificationAutoHide: async (seconds) => {
    set({ notificationAutoHide: seconds })
    await window.electronAPI?.storeSet('notificationAutoHide', seconds)
  },

  // ─── Carga inicial desde electron-store ─────────────────────────────────
  loadSettings: async () => {
    if (!window.electronAPI) return
    const [theme, mode, position, autoHide, hasToken] = await Promise.all([
      window.electronAPI.getActiveTheme(),
      window.electronAPI.storeGet('notificationMode', 'normal'),
      window.electronAPI.storeGet('notificationPosition', 'bottom-right'),
      window.electronAPI.storeGet('notificationAutoHide', 10),
      window.electronAPI.storeGet('spotifyAccessToken', null),
    ])
    set({
      activeTheme: theme || 'hogwarts',
      notificationMode: mode,
      notificationPosition: position,
      notificationAutoHide: autoHide,
      isAuthenticated: !!hasToken,
    })
  },

  // ─── Spotify Client ID (guardado por el usuario) ─────────────────────────
  spotifyClientId: '',
  setSpotifyClientId: async (id) => {
    set({ spotifyClientId: id })
    await window.electronAPI?.storeSet('spotifyClientId', id)
  },
  loadClientId: async () => {
    const id = await window.electronAPI?.storeGet('spotifyClientId', '')
    set({ spotifyClientId: id || '' })
  },
}))

export default useAppStore
