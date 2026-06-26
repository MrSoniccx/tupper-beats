// tray.js — Utilidades para el ícono de la bandeja del sistema
// El tray se gestiona directamente en main.js, este módulo exporta helpers

module.exports = {
  buildTrayMenu: (mainWindow, notificationWindow, app) => {
    const { Menu } = require('electron')
    return Menu.buildFromTemplate([
      { label: '🎵 TupperBeats', enabled: false },
      { type: 'separator' },
      {
        label: '⚙️ Configuración',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show()
            mainWindow.focus()
          }
        },
      },
      {
        label: '🔇 Ocultar notificación',
        click: () => {
          if (notificationWindow && !notificationWindow.isDestroyed()) {
            notificationWindow.hide()
          }
        },
      },
      { type: 'separator' },
      {
        label: '❌ Cerrar TupperBeats',
        click: () => app.quit(),
      },
    ])
  },
}
