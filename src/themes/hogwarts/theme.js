// theme.js — Datos del tema Hogwarts (colores, fuentes, gradientes, mascota)
// Este objeto alimenta las variables CSS globales (--tb-*) que consumen TODOS
// los componentes "core" de la app (Card, TrackRow, PlayerControls, etc).
// Para crear un tema nuevo: copiar este archivo, cambiar los valores, y
// registrar el tema en src/themes/index.js — ningún componente de lógica
// (player, búsqueda, álbumes, playlists) necesita tocarse.
export const hogwartsTheme = {
  name:        'Hogwarts',
  id:          'hogwarts',
  description: 'El Gran Comedor te espera, bruja ✨',
  emoji:       '🏰',

  colors: {
    primary:      '#C9A84C',   // Dorado
    primaryRgb:   '201,168,76',
    secondary:    '#740001',   // Granate
    secondaryRgb: '116,0,1',
    background:   '#1A1A2E',   // Negro mágico
    backgroundRgb:'26,26,46',
    surface:      '#F5E6C8',   // Pergamino
    surfaceRgb:   '245,230,200',
    text:         '#3B1A08',   // Tinta oscura
    textRgb:      '59,26,8',
    textLight:    '#F5E6C8',   // Crema (texto claro sobre fondo oscuro)
    textLightRgb: '245,230,200',
    accent:       '#F0C040',   // Oro brillante
    accentRgb:    '240,192,64',
    glow:         'rgba(201,168,76,0.6)',
  },

  fonts: {
    heading:       '"UnifrakturMaguntia", cursive',
    headingImport: 'https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap',
    body:          '"Inter", sans-serif',
  },

  // Gradientes de fondo grandes — cada uno es un string CSS completo
  gradients: {
    app:        'linear-gradient(160deg, #06030f 0%, #0d0920 40%, #080614 100%)',
    sidebar:    'rgba(6,3,15,0.75)',
    titleBar:   'linear-gradient(90deg, rgba(8,4,20,0.98), rgba(14,10,30,0.98))',
    bottomBar:  'linear-gradient(180deg, rgba(8,4,20,0.97), rgba(4,2,10,0.99))',
    dropdown:   'linear-gradient(160deg, #100c22, #0d0920)',
  },

  shadows: {
    gold:      '0 0 15px rgba(201,168,76,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
    magic:     '0 0 30px rgba(201,168,76,0.8), 0 0 60px rgba(201,168,76,0.4)',
    parchment: '0 8px 32px rgba(59,26,8,0.4)',
  },

  mascot: {
    emoji: '🏰',
    src:   './assets/hogwarts-transparent.svg',
    // El SVG del castillo es negro puro — este filtro lo tiñe de dorado
    filter: 'sepia(1) hue-rotate(5deg) saturate(4) brightness(4.5)',
  },
}
