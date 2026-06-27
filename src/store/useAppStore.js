import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  // Auth
  isAuthenticated: false,
  setAuthenticated: (val) => set({ isAuthenticated: val }),

  // Track actual
  currentTrack: null,
  setCurrentTrack: (track) => set({ currentTrack: track }),

  isPlaying: false,
  setIsPlaying: (val) => set({ isPlaying: val }),

  progress: 0,
  setProgress: (val) => set({ progress: val }),

  // Configuracion (sincronizada con electron-store)
  activeTheme: 'hogwarts',
  setActiveTheme: async (theme) => {
    set({ activeTheme: theme })
    await window.electronAPI?.setActiveTheme(theme)
  },

  notificationMode: 'normal',
  setNotificationMode: async (mode) => {
    set({ notificationMode: mode })
    await window.electronAPI?.storeSet('notificationMode', mode)
    window.electronAPI?.updateNotificationSettings({ mode })
  },

  notificationPosition: 'bottom-right',
  setNotificationPosition: async (position) => {
    set({ notificationPosition: position })
    await window.electronAPI?.storeSet('notificationPosition', position)
    window.electronAPI?.updateNotificationSettings({ position })
  },

  notificationAutoHide: 10,
  setNotificationAutoHide: async (seconds) => {
    set({ notificationAutoHide: seconds })
    await window.electronAPI?.storeSet('notificationAutoHide', seconds)
  },

  notificationScreen: 0,
  setNotificationScreen: async (idx) => {
    set({ notificationScreen: idx })
    await window.electronAPI?.storeSet('notificationScreen', idx)
    window.electronAPI?.setNotificationScreen?.(idx)
  },

  // Carga inicial desde electron-store
  loadSettings: async () => {
    if (!window.electronAPI) return
    const [theme, mode, position, autoHide, screen, hasToken] = await Promise.all([
      window.electronAPI.getActiveTheme(),
      window.electronAPI.storeGet('notificationMode', 'normal'),
      window.electronAPI.storeGet('notificationPosition', 'bottom-right'),
      window.electronAPI.storeGet('notificationAutoHide', 10),
      window.electronAPI.storeGet('notificationScreen', 0),
      window.electronAPI.storeGet('spotifyAccessToken', null),
    ])
    set({
      activeTheme: theme || 'hogwarts',
      notificationMode: mode,
      notificationPosition: position,
      notificationAutoHide: autoHide,
      notificationScreen: screen || 0,
      isAuthenticated: !!hasToken,
    })
  },

  // Cache permanente de canciones guardadas (nunca se borra, persiste en memoria)
  savedTracksCache: null,        // Array de tracks | null (nunca cargado aún)
  savedTracksCacheTotal: 0,
  savedTracksLoading: false,
  savedTracksProgress: null,     // { loaded, total } | null
  setSavedTracksCache: (tracks, total) => set({ savedTracksCache: tracks, savedTracksCacheTotal: total, savedTracksProgress: null, savedTracksLoading: false }),
  setSavedTracksLoading: (val) => set({ savedTracksLoading: val }),
  setSavedTracksProgress: (p) => set({ savedTracksProgress: p }),
  clearSavedTracksCache: () => set({ savedTracksCache: null, savedTracksCacheTotal: 0, savedTracksProgress: null }),

  // Volumen (sincronizado entre VolumeSliders del mismo proceso)
  volume: 70,
  setVolumeState: (vol) => set({ volume: vol }),
  muted: false,
  setMutedState: (muted) => set({ muted }),

  // Shuffle / Repeat (persiste mientras la app esta abierta)
  shuffle: false,
  setShuffle: (val) => set({ shuffle: val }),
  repeatMode: 'off', // 'off' | 'context' | 'track'
  setRepeatMode: (val) => set({ repeatMode: val }),

  // Spotify Client ID (guardado por el usuario)
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
