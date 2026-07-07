// theme.js — Datos del tema Axolote (girly, rosado, cute)
// Mismo esquema exacto que src/themes/hogwarts/theme.js — sólo cambian los
// valores. Ningún componente de lógica (player, búsqueda, álbumes, playlists)
// necesita tocarse para que este tema funcione.
export const axolotlTheme = {
  name:        'Axolote',
  id:          'axolotl',
  description: 'Burbujas, brillo rosa y tu ajolotito favorito 🌺',
  emoji:       '🌸',

  colors: {
    primary:      '#FF6FA5',   // Rosa chicle
    primaryRgb:   '255,111,165',
    secondary:    '#B084F5',   // Lavanda
    secondaryRgb: '176,132,245',
    background:   '#2B1030',   // Cielo nocturno ciruela
    backgroundRgb:'43,16,48',
    surface:      '#FFE1EC',   // Rosa pastel (tarjetas claras)
    surfaceRgb:   '255,225,236',
    text:         '#5B2A45',   // Tinta ciruela oscura (sobre superficies claras)
    textRgb:      '91,42,69',
    textLight:    '#FFEAF3',   // Rosa casi blanco (texto sobre fondo oscuro)
    textLightRgb: '255,234,243',
    accent:       '#FF4FA3',   // Rosa brillante
    accentRgb:    '255,79,163',
    glow:         'rgba(255,111,165,0.6)',
  },

  fonts: {
    heading:       '"Baloo 2", cursive',
    headingImport: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&display=swap',
    body:          '"Inter", sans-serif',
  },

  gradients: {
    app:        'linear-gradient(160deg, #1a0620 0%, #2b1030 40%, #170515 100%)',
    sidebar:    'rgba(30,10,35,0.75)',
    titleBar:   'linear-gradient(90deg, rgba(35,10,40,0.98), rgba(45,15,50,0.98))',
    bottomBar:  'linear-gradient(180deg, rgba(35,10,40,0.97), rgba(20,5,25,0.99))',
    dropdown:   'linear-gradient(160deg, #2a0f30, #1f0a25)',
  },

  shadows: {
    gold:      '0 0 15px rgba(255,111,165,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
    magic:     '0 0 30px rgba(255,111,165,0.8), 0 0 60px rgba(255,111,165,0.4)',
    parchment: '0 8px 32px rgba(91,42,69,0.4)',
  },

  mascot: {
    emoji:  '🌸',
    src:    './assets/axolotl.svg',
    // El SVG del ajolote ya viene a todo color, no necesita tinte
    filter: 'none',
  },
}
