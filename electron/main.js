const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen, shell, dialog } = require('electron')
const path = require('path')
const Store = require('electron-store')
const log  = require('electron-log')
const { autoUpdater } = require('electron-updater')
const { startSpotifyPolling, stopSpotifyPolling, getQueue, getSavedTracks, getSavedAlbums, playTrack, getUserPlaylists, getPlaylistTracks, getAlbumTracks, searchTracks, setShuffleState, setRepeatState, addToQueue } = require('./spotify')

const store = new Store()
const isDev = process.env.NODE_ENV === 'development'

// ─── Logger ────────────────────────────────────────────────────────────────
log.transports.file.level = 'info'
autoUpdater.logger = log
autoUpdater.autoDownload   = true   // descarga en segundo plano
autoUpdater.autoInstallOnAppQuit = true  // instala al cerrar

const startDeepLinkUrl = process.argv.find(arg => arg.startsWith('tupperbeats://'))
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()

let mainWindow        = null
let notificationWindow = null
let tray              = null

// ─── Ventana principal ──────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900, height: 650, minWidth: 800, minHeight: 580,
    frame: false, transparent: false, backgroundColor: '#1A1A2E',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
    show: false, titleBarStyle: 'hidden',
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (startDeepLinkUrl) handleOAuthCallback(startDeepLinkUrl)
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── Ventana de notificación ────────────────────────────────────────────────
function createNotificationWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const ww = 380, wh = 160
  const position = store.get('notificationPosition', 'bottom-right')
  const margin = 16
  let x, y
  switch (position) {
    case 'top-left':    x = margin;       y = margin; break
    case 'top-right':   x = sw-ww-margin; y = margin; break
    case 'bottom-left': x = margin;       y = sh-wh-margin; break
    default:            x = sw-ww-margin; y = sh-wh-margin; break
  }

  notificationWindow = new BrowserWindow({
    width: ww, height: wh, x, y,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
    show: false,
  })

  const notifUrl = isDev
    ? 'http://localhost:5173/#/notification'
    : `file://${path.join(__dirname, '../dist/index.html')}#/notification`
  notificationWindow.loadURL(notifUrl)
  updateNotificationLevel()
  notificationWindow.on('closed', () => { notificationWindow = null })
}

function updateNotificationLevel() {
  if (!notificationWindow) return
  const mode = store.get('notificationMode', 'normal')
  if (mode === 'always')      notificationWindow.setAlwaysOnTop(true, 'screen-saver')
  else if (mode === 'normal') notificationWindow.setAlwaysOnTop(true, 'floating')
  else                        notificationWindow.setAlwaysOnTop(false)
}

// ─── Tray ────────────────────────────────────────────────────────────────────
function createTray() {
  // Usar icon.png (tray-icon.svg no es soportado por nativeImage en Windows)
  const iconPath = path.join(__dirname, '../public/icon.png')
  let trayIcon
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    if (trayIcon.isEmpty()) throw new Error('empty')
  } catch {
    trayIcon = nativeImage.createEmpty()
  }
  tray = new Tray(trayIcon)
  const contextMenu = Menu.buildFromTemplate([
    { label: '🎵 TupperBeats', enabled: false },
    { type: 'separator' },
    { label: '⚙️ Configuración', click: () => { if (mainWindow) mainWindow.show(); else createMainWindow() } },
    { label: '🔇 Ocultar notificación', click: () => notificationWindow?.hide() },
    { type: 'separator' },
    { label: '🔄 Verificar actualizaciones', click: () => autoUpdater.checkForUpdates() },
    { type: 'separator' },
    { label: '❌ Cerrar', click: () => app.quit() },
  ])
  tray.setToolTip('TupperBeats 🎵✨')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    if (mainWindow) mainWindow.show(); else createMainWindow()
  })
}

// ─── Auto-updater events ────────────────────────────────────────────────────
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    log.info('Verificando actualizaciones...')
    mainWindow?.webContents.send('update-status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Actualización disponible:', info.version)
    mainWindow?.webContents.send('update-status', {
      status: 'available',
      version: info.version,
      releaseDate: info.releaseDate,
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('No hay actualizaciones. Versión actual:', info.version)
    mainWindow?.webContents.send('update-status', {
      status: 'up-to-date',
      version: info.version,
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    const pct = Math.round(progress.percent)
    log.info(`Descargando actualización: ${pct}%`)
    mainWindow?.webContents.send('update-status', {
      status: 'downloading',
      percent: pct,
      bytesPerSecond: progress.bytesPerSecond,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Actualización descargada:', info.version)
    mainWindow?.webContents.send('update-status', {
      status: 'downloaded',
      version: info.version,
    })
  })

  autoUpdater.on('error', (err) => {
    log.error('Error en auto-updater:', err.message)
    mainWindow?.webContents.send('update-status', {
      status: 'error',
      message: err.message,
    })
  })
}

// ─── App lifecycle ──────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (isDev) {
    app.setAsDefaultProtocolClient('tupperbeats', process.execPath, [path.resolve(process.argv[1])])
  } else {
    app.setAsDefaultProtocolClient('tupperbeats')
  }

  createMainWindow()
  createNotificationWindow()
  createTray()
  setupAutoUpdater()

  // Verificar actualizaciones al iniciar (solo en producción, 6s de delay para que la app cargue)
  if (!isDev) {
    setTimeout(() => {
      log.info('Verificando actualizaciones al inicio...')
      autoUpdater.checkForUpdates().catch(err => log.warn('No se pudo verificar actualizaciones:', err.message))
    }, 6000)
  }

  // Iniciar polling de Spotify si hay token
  const token = store.get('spotifyAccessToken')
  if (token) {
    startSpotifyPolling(store, (track) => {
      notificationWindow?.webContents.send('track-changed', track)
      mainWindow?.webContents.send('track-changed', track)
      if (!track._progressOnly) showNotification()
    })
  }
})

app.on('window-all-closed', () => {})

app.on('second-instance', (event, commandLine) => {
  const url = commandLine.find(arg => arg.startsWith('tupperbeats://'))
  if (url) setTimeout(() => handleOAuthCallback(url), 500)
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show(); mainWindow.focus()
  }
})

app.on('open-url', (event, url) => {
  event.preventDefault()
  if (url.startsWith('tupperbeats://')) setTimeout(() => handleOAuthCallback(url), 500)
})

function handleOAuthCallback(url) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('oauth-callback', url)
}

// ─── Notificación flotante ──────────────────────────────────────────────────
let hideTimer = null

function showNotification() {
  const mode = store.get('notificationMode', 'normal')
  if (mode === 'disabled') return
  if (notificationWindow && !notificationWindow.isDestroyed()) {
    notificationWindow.showInactive()
    clearTimeout(hideTimer)
    const autoHide = store.get('notificationAutoHide', 10)
    if (autoHide > 0) {
      hideTimer = setTimeout(() => {
        if (notificationWindow && !notificationWindow.isDestroyed()) {
          notificationWindow.webContents.send('prepare-hide-notification')
          setTimeout(() => notificationWindow?.hide(), 600)
        }
      }, autoHide * 1000)
    }
  }
}

// ─── IPC: ventana ────────────────────────────────────────────────────────────
ipcMain.on('window-minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
ipcMain.on('window-maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  win?.isMaximized() ? win.unmaximize() : win?.maximize()
})
ipcMain.on('window-close', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  if (win === mainWindow) win?.hide(); else win?.close()
})
ipcMain.on('hide-notification', () => { clearTimeout(hideTimer); notificationWindow?.hide() })
ipcMain.on('show-main-window', () => { if (mainWindow) mainWindow.show(); else createMainWindow() })

// ─── IPC: hover timer de notificación ─────────────────────────────────────
ipcMain.on('reset-notification-timer', () => { clearTimeout(hideTimer); hideTimer = null })
ipcMain.on('resume-notification-timer', () => {
  clearTimeout(hideTimer)
  const autoHide = store.get('notificationAutoHide', 10)
  if (autoHide > 0) {
    hideTimer = setTimeout(() => {
      if (notificationWindow && !notificationWindow.isDestroyed()) {
        notificationWindow.webContents.send('prepare-hide-notification')
        setTimeout(() => notificationWindow?.hide(), 600)
      }
    }, autoHide * 1000)
  }
})
ipcMain.on('notification-hide-ready', () => { clearTimeout(hideTimer); notificationWindow?.hide() })

// ─── IPC: store ───────────────────────────────────────────────────────────
ipcMain.handle('store-get',    (_, key, def) => store.get(key, def))
ipcMain.handle('store-set',    (_, key, val) => { store.set(key, val); return true })
ipcMain.handle('store-delete', (_, key)      => { store.delete(key); return true })
ipcMain.handle('open-auth-url', (_, url)     => { shell.openExternal(url) })

// ─── IPC: Spotify auth ────────────────────────────────────────────────────
ipcMain.handle('save-tokens', (_, tokens) => {
  store.set('spotifyAccessToken',  tokens.access_token)
  store.set('spotifyRefreshToken', tokens.refresh_token)
  store.set('spotifyTokenExpiry',  Date.now() + tokens.expires_in * 1000)
  startSpotifyPolling(store, (track) => {
    notificationWindow?.webContents.send('track-changed', track)
    mainWindow?.webContents.send('track-changed', track)
    if (!track._progressOnly) showNotification()
  })
  return true
})

ipcMain.handle('logout-spotify', () => {
  stopSpotifyPolling()
  store.delete('spotifyAccessToken')
  store.delete('spotifyRefreshToken')
  store.delete('spotifyTokenExpiry')
  return true
})

// ─── IPC: temas y settings ────────────────────────────────────────────────
ipcMain.handle('get-active-theme', () => store.get('activeTheme', 'hogwarts'))
ipcMain.handle('set-active-theme', (_, theme) => { store.set('activeTheme', theme); return true })
ipcMain.on('update-notification-settings', (_, settings) => {
  if (settings.mode)     { store.set('notificationMode', settings.mode); updateNotificationLevel() }
  if (settings.position) { store.set('notificationPosition', settings.position) }
})

// ─── IPC: auto-updater ───────────────────────────────────────────────────
ipcMain.handle('check-for-updates', async () => {
  if (isDev) return { current: app.getVersion(), status: 'dev-mode' }
  try {
    const result = await autoUpdater.checkForUpdates()
    return { current: app.getVersion(), latest: result?.updateInfo?.version }
  } catch (e) {
    return { error: e.message }
  }
})

// El usuario confirmó que quiere instalar ahora → reiniciar y aplicar
ipcMain.on('install-update-now', () => {
  autoUpdater.quitAndInstall(false, true)
})

// ─── IPC: biblioteca Spotify ──────────────────────────────────────────────
ipcMain.handle('spotify-get-queue',           ()           => getQueue(store))
ipcMain.handle('spotify-get-saved-tracks',    (_, offset)  => getSavedTracks(store, offset || 0))
ipcMain.handle('spotify-get-saved-albums',    (_, offset)  => getSavedAlbums(store, offset || 0))
ipcMain.handle('spotify-play-track',          (_, uri)     => playTrack(store, uri))
ipcMain.handle('spotify-get-playlists',       (_, offset)  => getUserPlaylists(store, offset || 0))
ipcMain.handle('spotify-get-playlist-tracks', (_, id, off) => getPlaylistTracks(store, id, off || 0))
ipcMain.handle('spotify-get-album-tracks',    (_, id, off) => getAlbumTracks(store, id, off || 0))
ipcMain.handle('spotify-search-tracks',       (_, q)       => searchTracks(store, q))
ipcMain.handle('spotify-set-shuffle',         (_, state)   => setShuffleState(store, state))
ipcMain.handle('spotify-set-repeat',          (_, state)   => setRepeatState(store, state))
ipcMain.handle('spotify-add-to-queue',        (_, uri)     => addToQueue(store, uri))

// IPC: cerrar app completamente
ipcMain.on('app-quit', () => app.quit())

// IPC: sincronizar volumen entre ventanas
ipcMain.on('volume-changed', (event, vol) => {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed() && win.webContents.id !== event.sender.id) {
      win.webContents.send('volume-changed', vol)
    }
  })
})
