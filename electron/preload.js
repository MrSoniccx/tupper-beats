const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize:         ()      => ipcRenderer.send('window-minimize'),
  maximize:         ()      => ipcRenderer.send('window-maximize'),
  close:            ()      => ipcRenderer.send('window-close'),
  hideNotification: ()      => ipcRenderer.send('hide-notification'),
  showMainWindow:   ()      => ipcRenderer.send('show-main-window'),

  resetNotificationTimer:  () => ipcRenderer.send('reset-notification-timer'),
  resumeNotificationTimer: () => ipcRenderer.send('resume-notification-timer'),
  notificationHideReady:   () => ipcRenderer.send('notification-hide-ready'),

  storeGet:    (key, def)   => ipcRenderer.invoke('store-get', key, def),
  storeSet:    (key, value) => ipcRenderer.invoke('store-set', key, value),
  storeDelete: (key)        => ipcRenderer.invoke('store-delete', key),

  openAuthUrl:   (url)      => ipcRenderer.invoke('open-auth-url', url),
  saveTokens:    (tokens)   => ipcRenderer.invoke('save-tokens', tokens),
  logoutSpotify: ()         => ipcRenderer.invoke('logout-spotify'),

  getActiveTheme: ()        => ipcRenderer.invoke('get-active-theme'),
  setActiveTheme: (theme)   => ipcRenderer.invoke('set-active-theme', theme),
  // Sincronizar el tema al instante entre ventana principal y notificación
  onThemeChanged: (cb)      => ipcRenderer.on('theme-changed', (_, theme) => cb(theme)),

  updateNotificationSettings: (s) => ipcRenderer.send('update-notification-settings', s),

  checkForUpdates:  ()   => ipcRenderer.invoke('check-for-updates'),
  installUpdateNow: ()   => ipcRenderer.send('install-update-now'),
  onUpdateStatus:   (cb) => ipcRenderer.on('update-status', (_, data) => cb(data)),

  getQueue:          ()           => ipcRenderer.invoke('spotify-get-queue'),
  getSavedTracks:    (offset)     => ipcRenderer.invoke('spotify-get-saved-tracks', offset),
  getSavedAlbums:    (offset)     => ipcRenderer.invoke('spotify-get-saved-albums', offset),
  playTrack:         (uri)        => ipcRenderer.invoke('spotify-play-track', uri),
  getPlaylists:      (offset)     => ipcRenderer.invoke('spotify-get-playlists', offset),
  getPlaylistTracks: (id, offset) => ipcRenderer.invoke('spotify-get-playlist-tracks', id, offset),
  getAlbumTracks:    (id, offset) => ipcRenderer.invoke('spotify-get-album-tracks', id, offset),
  searchTracks:      (query)      => ipcRenderer.invoke('spotify-search-tracks', query),
  setShuffle:        (state)      => ipcRenderer.invoke('spotify-set-shuffle', state),
  setRepeat:         (state)      => ipcRenderer.invoke('spotify-set-repeat', state),
  addToQueue:        (uri)        => ipcRenderer.invoke('spotify-add-to-queue', uri),
  quitApp:           ()           => ipcRenderer.send('app-quit'),

  onTrackChanged:  (cb) => ipcRenderer.on('track-changed',             (_, data) => cb(data)),
  onOAuthCallback: (cb) => ipcRenderer.on('oauth-callback',            (_, url)  => cb(url)),
  onPrepareHide:   (cb) => ipcRenderer.on('prepare-hide-notification', ()        => cb()),
  onVolumeChanged: (cb) => ipcRenderer.on('volume-changed',            (_, vol)  => cb(vol)),

  broadcastVolume: (vol) => ipcRenderer.send('volume-changed', vol),

  // Sincronizar shuffle/repeat al instante entre ventana principal y notificación
  onPlaybackModeChanged: (cb) => ipcRenderer.on('playback-mode-changed', (_, data) => cb(data)),
  broadcastPlaybackMode: (data) => ipcRenderer.send('playback-mode-changed', data),

  // Sincronizar el modo manual de "Mis canciones" (cola local, sin tocar la
  // cola real de Spotify) entre ventana principal y notificación — mismo
  // patrón que playback-mode-changed. `data` es { uris, idx } o null.
  onLikedQueueChanged:  (cb)   => ipcRenderer.on('liked-queue-changed', (_, data) => cb(data)),
  broadcastLikedQueue:  (data) => ipcRenderer.send('liked-queue-changed', data),

  removeAllListeners: (ch) => ipcRenderer.removeAllListeners(ch),

  // Token válido (con auto-refresh via main process)
  getValidToken: ()    => ipcRenderer.invoke('get-valid-token'),

  // Manda un fallo de búsqueda/spotifyGet a la terminal de `npm run dev`
  // (el console.warn del renderer sólo se ve en el DevTools de esa ventana)
  logSpotifyError: (info) => ipcRenderer.send('log-spotify-error', info),

  // Pantallas disponibles para selector de notificación
  getDisplays:   ()    => ipcRenderer.invoke('get-displays'),
  setNotificationScreen: (idx) => ipcRenderer.send('set-notification-screen', idx),

  // Panel expandible de la notificación
  resizeNotification: (expanded) => ipcRenderer.send('resize-notification', expanded),
})
