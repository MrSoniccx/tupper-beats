// Background.jsx — Fondo decorativo del tema Hogwarts (castillo, estrellas, runas, velas)
// Extraído de pages/Settings.jsx para que el fondo sea 100% intercambiable por tema.
import { motion } from 'framer-motion'

// ─── Castillo de Hogwarts (usa el SVG real de /public/assets/) ────────────────
export function Mascot({ width = 220, opacity = 0.13, className = '', style = {} }) {
  return (
    <div className={className} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }}>
      <img
        src="./assets/hogwarts-transparent.svg"
        width={width}
        height={width}
        alt=""
        draggable={false}
        style={{
          pointerEvents: 'none',
          opacity,
          filter: 'sepia(1) hue-rotate(5deg) saturate(4) brightness(4.5)',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  )
}

// ─── Animaciones CSS globales del tema ─────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap');

@keyframes tb-candle {
  0%,100% { transform: scaleX(1) rotate(0deg); opacity:.85; }
  35%     { transform: scaleX(0.65) rotate(2.5deg); opacity:1; }
  70%     { transform: scaleX(1.15) rotate(-1.5deg); opacity:.9; }
}
@keyframes tb-star-pulse {
  0%,100% { opacity:0.06; transform:scale(1); }
  50%     { opacity:0.6; transform:scale(1.6); }
}
@keyframes tb-float-castle {
  0%,100% { transform: translateY(0px) rotate(0deg); }
  50%     { transform: translateY(-6px) rotate(0.3deg); }
}
@keyframes tb-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes tb-glow-pulse {
  0%,100% { box-shadow: 0 0 20px rgba(var(--tb-primary-rgb),0.15), 0 0 60px rgba(var(--tb-primary-rgb),0.05); }
  50%     { box-shadow: 0 0 40px rgba(var(--tb-primary-rgb),0.3),  0 0 80px rgba(var(--tb-primary-rgb),0.12); }
}
@keyframes tb-border-glow {
  0%,100% { border-color: rgba(var(--tb-primary-rgb),0.2); }
  50%     { border-color: rgba(var(--tb-accent-rgb),0.5); }
}
@keyframes tb-rune-fade {
  0%,100% { opacity:0.04; }
  50%     { opacity:0.18; }
}
@keyframes tb-lightning {
  0%,90%,100% { opacity:0; }
  92%         { opacity:0.7; }
  94%         { opacity:0; }
  96%         { opacity:0.4; }
}
@keyframes tb-magic-ring {
  0%   { transform: rotate(0deg) scale(1);   opacity: 0.3; }
  50%  { transform: rotate(180deg) scale(1.05); opacity: 0.6; }
  100% { transform: rotate(360deg) scale(1);  opacity: 0.3; }
}

/* Scrollbar mágico */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(var(--tb-primary-rgb),0.3); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(var(--tb-primary-rgb),0.55); }

/* Inputs */
input::placeholder { color: rgba(var(--tb-primary-rgb),0.3); }
input { caret-color: var(--tb-accent); }
`

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i, top: (Math.sin(i * 137.5) * 40 + 50), left: (i * 7.3) % 100,
  size: (i % 3 === 0) ? 2 : 1,
  delay: (i * 0.22) % 5, dur: 2.5 + (i % 4) * 0.7,
}))

const SIDE_CANDLES = [
  { left: '1.5%', top: '12%', delay: 0,   dur: 2.8, h: 24 },
  { left: '1.5%', top: '38%', delay: 0.6, dur: 3.1, h: 20 },
  { left: '1.5%', top: '64%', delay: 1.2, dur: 2.6, h: 26 },
  { right:'1.5%', top: '18%', delay: 0.3, dur: 3.0, h: 22 },
  { right:'1.5%', top: '48%', delay: 0.9, dur: 2.7, h: 24 },
  { right:'1.5%', top: '74%', delay: 1.5, dur: 3.3, h: 20 },
]

const RUNES = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ']

function SideCandle({ style, delay, dur, h }) {
  return (
    <motion.div style={{ position:'absolute', pointerEvents:'none', zIndex:0, ...style }}
      animate={{ y:[0,-6,0], opacity:[0.45,0.85,0.45] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease:'easeInOut' }}
    >
      <div style={{ width:5, height:11,
        background:'radial-gradient(ellipse at 40% 60%, #fffde7, #FFD700 50%, #FF8C00)',
        borderRadius:'50% 50% 28% 28%', marginLeft:3, marginBottom:1,
        boxShadow:'0 0 8px #FFD700, 0 -4px 10px rgba(255,140,0,0.5)',
        animation:`tb-candle ${dur*0.4}s ease-in-out infinite`,
      }} />
      <div style={{ width:10, height:h,
        background:'linear-gradient(to bottom, #F5E6C8, #D4BF8A 60%, #B8A060)',
        borderRadius:3, boxShadow:'inset -2px 0 3px rgba(0,0,0,0.15)',
      }} />
    </motion.div>
  )
}

// ─── Fondo decorativo completo (estrellas + runas + velas + castillo) ─────────
export default function HogwartsBackground() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {/* Estrellas */}
      {STARS.map(s => (
        <div key={s.id} style={{
          position:'absolute', top:`${s.top}%`, left:`${s.left}%`,
          width:s.size, height:s.size, borderRadius:'50%',
          background:'#FFD700', pointerEvents:'none', zIndex:0,
          boxShadow:`0 0 ${s.size*2}px #FFD700`,
          animation:`tb-star-pulse ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
      {/* Runas muy sutiles */}
      {RUNES.slice(0,8).map((r,i) => (
        <div key={i} style={{
          position:'absolute',
          top: `${15 + i*12}%`,
          left: i % 2 === 0 ? '0.5%' : undefined,
          right: i % 2 === 1 ? '0.5%' : undefined,
          fontSize:9, color:'var(--tb-primary)', pointerEvents:'none', fontFamily:'serif',
          animation:`tb-rune-fade ${3+i*0.5}s ${i*0.4}s ease-in-out infinite`,
          zIndex:0,
        }}>{r}</div>
      ))}
      {/* Velas laterales */}
      {SIDE_CANDLES.map((c,i) => <SideCandle key={i} {...c} />)}
      {/* Castillo grande de fondo */}
      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', zIndex:0,
        animation:'tb-float-castle 8s ease-in-out infinite',
      }}>
        <Mascot width={340} opacity={0.08} />
      </div>
    </>
  )
}
