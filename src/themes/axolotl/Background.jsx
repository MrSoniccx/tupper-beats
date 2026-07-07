// Background.jsx — Fondo decorativo del tema Axolote (burbujas, corazones, ajolote)
// Misma "forma" que themes/hogwarts/Background.jsx (mismo contrato: default =
// fondo completo, Mascot = ilustración reusable) — sólo cambia la decoración.
import { motion } from 'framer-motion'

// ─── Ajolotito (usa el SVG de /public/assets/axolotl.svg) ─────────────────────
export function Mascot({ width = 220, opacity = 0.16, className = '', style = {} }) {
  return (
    <div className={className} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }}>
      <img
        src="./assets/axolotl.svg"
        width={width}
        height={width}
        alt=""
        draggable={false}
        style={{
          pointerEvents: 'none',
          opacity,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  )
}

// ─── Animaciones CSS globales del tema ─────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&display=swap');

@keyframes tb-bubble-rise {
  0%   { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
  10%  { opacity: 0.8; }
  90%  { opacity: 0.5; }
  100% { transform: translateY(-420px) translateX(var(--bx,0px)) scale(1.1); opacity: 0; }
}
@keyframes tb-heart-pulse {
  0%,100% { opacity:0.12; transform:scale(1) rotate(-4deg); }
  50%     { opacity:0.55; transform:scale(1.35) rotate(4deg); }
}
@keyframes tb-float-castle {
  0%,100% { transform: translateY(0px) rotate(0deg); }
  50%     { transform: translateY(-6px) rotate(-0.3deg); }
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
  0%,100% { opacity:0.06; }
  50%     { opacity:0.22; }
}
@keyframes tb-lightning {
  0%,100% { opacity:0; }
}
@keyframes tb-magic-ring {
  0%   { transform: rotate(0deg) scale(1);   opacity: 0.3; }
  50%  { transform: rotate(180deg) scale(1.05); opacity: 0.6; }
  100% { transform: rotate(360deg) scale(1);  opacity: 0.3; }
}

/* Scrollbar cute */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(var(--tb-primary-rgb),0.35); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(var(--tb-primary-rgb),0.6); }

/* Inputs */
input::placeholder { color: rgba(var(--tb-primary-rgb),0.35); }
input { caret-color: var(--tb-accent); }
`

// Burbujas subiendo desde abajo
const BUBBLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: (i * 4.6) % 100,
  size: 3 + (i % 5) * 2.5,
  delay: (i * 0.35) % 7,
  dur: 6 + (i % 5) * 1.6,
  bx: ((i % 2 === 0) ? 1 : -1) * (8 + (i % 4) * 6),
}))

// Corazoncitos flotando muy sutiles a los costados
const HEARTS = ['🩷','💗','✨','🩷','💗','✨']
const HEART_POSITIONS = [
  { t:'10%', l:'3%' }, { t:'34%', l:'2%' }, { t:'62%', l:'4%' },
  { t:'16%', r:'3%' }, { t:'46%', r:'2%' }, { t:'72%', r:'4%' },
]

function Bubble({ left, size, delay, dur, bx }) {
  return (
    <div style={{
      position:'absolute', bottom:-20, left:`${left}%`,
      width:size, height:size, borderRadius:'50%',
      background:'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(255,143,193,0.25) 70%)',
      border:'1px solid rgba(255,255,255,0.35)',
      pointerEvents:'none', zIndex:0,
      animation:`tb-bubble-rise ${dur}s ${delay}s ease-in infinite`,
      '--bx': `${bx}px`,
    }} />
  )
}

// ─── Fondo decorativo completo (burbujas + corazones + ajolote) ──────────────
export default function AxolotlBackground() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {/* Burbujas */}
      {BUBBLES.map(b => <Bubble key={b.id} {...b} />)}
      {/* Corazoncitos muy sutiles */}
      {HEART_POSITIONS.map((pos, i) => (
        <div key={i} style={{
          position:'absolute', fontSize:11, pointerEvents:'none', zIndex:0,
          animation:`tb-heart-pulse ${3+i*0.5}s ${i*0.4}s ease-in-out infinite`,
          ...pos,
        }}>{HEARTS[i % HEARTS.length]}</div>
      ))}
      {/* Ajolote grande de fondo */}
      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', zIndex:0,
        animation:'tb-float-castle 8s ease-in-out infinite',
      }}>
        <Mascot width={320} opacity={0.1} />
      </div>
    </>
  )
}
