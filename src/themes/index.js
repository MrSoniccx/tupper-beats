// index.js — Registro central de temas
//
// Para agregar un tema nuevo:
//   1. Crear src/themes/<id>/theme.js, Background.jsx, Notification.jsx, Settings.jsx
//      (copiar los de "axolotl" como plantilla — mismos exports, mismo contrato).
//   2. Importarlo y agregarlo al objeto THEMES de abajo.
//   3. Listo — aparece automáticamente en Settings → Temas y en toda la app,
//      sin tocar ninguna función del reproductor, búsqueda, álbumes o playlists.
import { hogwartsTheme } from './hogwarts/theme'
import HogwartsBackground, { Mascot as HogwartsMascot } from './hogwarts/Background'
import HogwartsNotification from './hogwarts/Notification'
import { SidebarBadge as HogwartsSidebarBadge } from './hogwarts/Settings'

import { axolotlTheme } from './axolotl/theme'
import AxolotlBackground, { Mascot as AxolotlMascot } from './axolotl/Background'
import AxolotlNotification from './axolotl/Notification'
import { SidebarBadge as AxolotlSidebarBadge } from './axolotl/Settings'

export const THEMES = {
  hogwarts: {
    data: hogwartsTheme,
    Background: HogwartsBackground,
    Notification: HogwartsNotification,
    SidebarBadge: HogwartsSidebarBadge,
    Mascot: HogwartsMascot,
    available: true,
  },
  axolotl: {
    data: axolotlTheme,
    Background: AxolotlBackground,
    Notification: AxolotlNotification,
    SidebarBadge: AxolotlSidebarBadge,
    Mascot: AxolotlMascot,
    available: true,
  },
}

export const DEFAULT_THEME_ID = 'hogwarts'

export function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME_ID]
}

export function listThemes() {
  return Object.values(THEMES)
}

// Aplica los tokens de un tema como variables CSS globales en :root.
// Cualquier componente "core" (compartido entre temas) las usa vía
// var(--tb-xxx) / rgba(var(--tb-xxx-rgb), alpha) en vez de colores fijos.
export function applyThemeVars(themeId) {
  const theme = getTheme(themeId).data
  const root = document.documentElement.style
  const c = theme.colors

  root.setProperty('--tb-primary',        c.primary)
  root.setProperty('--tb-primary-rgb',    c.primaryRgb)
  root.setProperty('--tb-secondary',      c.secondary)
  root.setProperty('--tb-secondary-rgb',  c.secondaryRgb)
  root.setProperty('--tb-bg',             c.background)
  root.setProperty('--tb-bg-rgb',         c.backgroundRgb)
  root.setProperty('--tb-surface',        c.surface)
  root.setProperty('--tb-surface-rgb',    c.surfaceRgb)
  root.setProperty('--tb-text',           c.text)
  root.setProperty('--tb-text-rgb',       c.textRgb)
  root.setProperty('--tb-textLight',      c.textLight)
  root.setProperty('--tb-textLight-rgb',  c.textLightRgb)
  root.setProperty('--tb-accent',         c.accent)
  root.setProperty('--tb-accent-rgb',     c.accentRgb)
  root.setProperty('--tb-glow',           c.glow)

  root.setProperty('--tb-font-heading',   theme.fonts.heading)
  root.setProperty('--tb-font-body',      theme.fonts.body)

  root.setProperty('--tb-gradient-app',       theme.gradients.app)
  root.setProperty('--tb-gradient-sidebar',   theme.gradients.sidebar)
  root.setProperty('--tb-gradient-titlebar',  theme.gradients.titleBar)
  root.setProperty('--tb-gradient-bottombar', theme.gradients.bottomBar)
  root.setProperty('--tb-gradient-dropdown',  theme.gradients.dropdown)

  ensureFontLink(themeId, theme.fonts.headingImport)
}

// Inyecta (una sola vez por tema) el <link> de Google Fonts que necesita el
// heading font del tema activo, sin acumular <link> duplicados.
function ensureFontLink(themeId, href) {
  if (!href) return
  const id = 'tb-theme-font'
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('link')
    el.id = id
    el.rel = 'stylesheet'
    document.head.appendChild(el)
  }
  if (el.dataset.theme !== themeId) {
    el.href = href
    el.dataset.theme = themeId
  }
}
