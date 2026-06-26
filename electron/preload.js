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

  onTrackChanged:  (cb) => ipcRenderer.on('track-changed',             (_, data) => cb(data)),
  onOAuthCallback: (cb) => ipcRenderer.on('oauth-callback',            (_, url)  => cb(url)),
  onPrepareHide:   (cb) => ipcRenderer.on('prepare-hide-notification', ()        => cb()),

  removeAllListeners: (ch) => ipcRenderer.removeAllListeners(ch),
})
