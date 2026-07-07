// Background.jsx — Fondo decorativo del tema Hogwarts: el Gran Comedor de
// noche. El castillo real (SVG trazado, no se puede desarmar en piezas como
// el ajolote) ahora vive dentro de un envoltorio interactivo — clickearlo
// "lanza un hechizo": el castillo tiembla/brilla y salen disparadas chispas
// y estrellas doradas. El cielo de fondo ganó luna con halo, murciélagos
// cruzando, estrellas fugaces y niebla mágica ondulando — no sólo estrellas
// fijas y velas como antes.
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'

const CAST_EMOJIS = ['✨', '⚡', '🌟', '💫', '✨', '⭐']

// Ráfaga de chispas/estrellas al "lanzar el hechizo" clickeando el castillo.
function CastBurst() {
  const particles = useMemo(() => Array.from({ length: 9 }, (_, i) => {
    const angle = (i / 9) * Math.PI * 2 + (Math.random() * 0.5 - 0.25)
    const dist = 42 + Math.random() * 36
    return {
      id: i,
      emoji: CAST_EMOJIS[i % CAST_EMOJIS.length],
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      rotate: Math.random() * 100 - 50,
      delay: i * 0.02,
      size: 12 + Math.random() * 9,
    }
  }), [])

  return (
    <>
      {particles.map(p => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.2, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: p.x, y: p.y - 18,
            scale: [0.2, 1.25, 1, 0.7],
            rotate: p.rotate,
          }}
          transition={{ duration: 0.95, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute', left: '50%', top: '42%',
            fontSize: p.size, pointerEvents: 'none', zIndex: 30,
            textShadow: '0 0 8px rgba(255,215,0,0.9)',
          }}
        >{p.emoji}</motion.span>
      ))}
    </>
  )
}

// ─── Castillo de Hogwarts (usa el SVG real de /public/assets/) ────────────────
// Contrato de siempre — width/opacity/className/style — más `interactive`
// (default true): clickearlo lanza un hechizo (temblor + brillo + chispas).
// Las instancias puramente decorativas de fondo pasan interactive={false}.
export function Mascot({ width = 220, opacity = 0.13, className = '', style = {}, interactive = true }) {
  const shake = useAnimation()
  const [bursts, setBursts] = useState([])
  const [glow, setGlow] = useState(false)

  const handleCast = useCallback(() => {
    shake.start({
      scale: [1, 1.06, 0.95, 1.03, 0.98, 1],
      rotate: [0, -2.5, 2.5, -1.2, 1, 0],
      transition: { duration: 0.6, ease: 'easeInOut' },
    })
    setGlow(true)
    setTimeout(() => setGlow(false), 650)
    const id = `${Date.now()}-${Math.random()}`
    setBursts(b => [...b, id])
    setTimeout(() => setBursts(b => b.filter(x => x !== id)), 980)
  }, [shake])

  const img = (
    <img
      src="./assets/hogwarts-transparent.svg"
      width={width}
      height={width}
      alt=""
      draggable={false}
      style={{
        pointerEvents: 'none',
        opacity,
        filter: glow
          ? 'sepia(1) hue-rotate(5deg) saturate(6) brightness(6.5) drop-shadow(0 0 18px rgba(255,215,0,0.85))'
          : 'sepia(1) hue-rotate(5deg) saturate(4) brightness(4.5)',
        objectFit: 'contain',
        display: 'block',
        transition: 'filter 0.25s ease',
      }}
    />
  )

  if (!interactive) {
    return (
      <div className={className} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }}>
        {img}
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', ...style }}
    >
      <motion.div
        onClick={handleCast}
        whileTap={{ scale: 0.93 }}
        animate={shake}
        initial={{ scale: 1, rotate: 0 }}
        role="button"
        tabIndex={0}
        aria-label="Lanzar un hechizo"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCast() } }}
        style={{ cursor: 'pointer', display: 'inline-flex' }}
      >
        {img}
      </motion.div>
      <AnimatePresence>
        {bursts.map(id => <CastBurst key={id} />)}
      </AnimatePresence>
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
  0%,100% { opacity:0; }
}
@keyframes tb-magic-ring {
  0%   { transform: rotate(0deg) scale(1);   opacity: 0.3; }
  50%  { transform: rotate(180deg) scale(1.05); opacity: 0.6; }
  100% { transform: rotate(360deg) scale(1);  opacity: 0.3; }
}

/* ── Nuevo: luna con halo respirando ── */
@keyframes hw-moon-glow {
  0%,100% { opacity: 0.55; transform: scale(1); }
  50%     { opacity: 0.85; transform: scale(1.08); }
}

/* ── Nuevo: murciélagos cruzando el cielo, aleteando ── */
@keyframes hw-bat-fly {
  0%   { transform: translateX(-30px) translateY(0px); opacity: 0; }
  8%   { opacity: 0.55; }
  92%  { opacity: 0.5; }
  100% { transform: translateX(calc(100vw + 30px)) translateY(-26px); opacity: 0; }
}
@keyframes hw-bat-flap {
  0%,100% { transform: scaleY(1); }
  50%     { transform: scaleY(0.55); }
}

/* ── Nuevo: estrellas fugaces — raras, rápidas ── */
@keyframes hw-shooting-star {
  0%, 88%, 100% { opacity: 0; transform: translate(0,0) rotate(35deg) scaleX(1); }
  89%           { opacity: 1; }
  93%           { opacity: 0; transform: translate(220px, 160px) rotate(35deg) scaleX(1.4); }
}

/* ── Nuevo: niebla/aurora mágica ondulando en lo alto ── */
@keyframes hw-aurora-drift {
  0%,100% { transform: translateX(-4%) scaleY(1);   opacity: 0.16; }
  50%     { transform: translateX(4%)  scaleY(1.2); opacity: 0.3;  }
}

/* ── Nuevo: brasas/chispas doradas subiendo (como burbujas, pero fuego) ── */
@keyframes hw-ember-rise {
  0%   { transform: translateY(0) translateX(0) scale(0.7); opacity: 0; }
  12%  { opacity: 0.9; }
  50%  { opacity: 0.5; }
  100% { transform: translateY(-380px) translateX(var(--ex,0px)) scale(0.3); opacity: 0; }
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

// Murciélagos — silueta simple de dos alas, cruzan a distintas alturas/velocidades
const BATS = [
  { top: '14%', dur: 16, delay: 0,  scale: 1   },
  { top: '30%', dur: 22, delay: 7,  scale: 0.75 },
  { top: '8%',  dur: 19, delay: 13, scale: 0.6  },
]

// Brasas doradas subiendo desde abajo, con wobble lateral
const EMBERS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: (i * 6.4) % 100,
  size: 2 + (i % 4) * 1.8,
  delay: (i * 0.4) % 9,
  dur: 7 + (i % 5) * 1.8,
  ex: ((i % 2 === 0) ? 1 : -1) * (8 + (i % 4) * 6),
}))

// Estrellas fugaces — posiciones fijas, ciclos largos y raros
const SHOOTING_STARS = [
  { top: '8%',  left: '15%', dur: 14, delay: 2  },
  { top: '18%', left: '55%', dur: 19, delay: 9  },
]

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

function Moon() {
  return (
    <div style={{ position:'absolute', top:'6%', right:'8%', zIndex:0, pointerEvents:'none' }}>
      <div style={{
        position:'absolute', inset:-18, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(255,244,214,0.35), transparent 70%)',
        animation:'hw-moon-glow 5s ease-in-out infinite',
      }} />
      <div style={{
        width:46, height:46, borderRadius:'50%',
        background:'radial-gradient(circle at 35% 30%, #FFFCEF, #F5E6C8 55%, #D9C48A 100%)',
        boxShadow:'0 0 24px rgba(255,244,214,0.5)', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', width:10, height:10, borderRadius:'50%', background:'rgba(180,160,120,0.25)', top:10, left:8 }} />
        <div style={{ position:'absolute', width:6, height:6, borderRadius:'50%', background:'rgba(180,160,120,0.2)', top:26, left:22 }} />
        <div style={{ position:'absolute', width:4, height:4, borderRadius:'50%', background:'rgba(180,160,120,0.2)', top:14, left:30 }} />
      </div>
    </div>
  )
}

function Bat({ top, dur, delay, scale }) {
  return (
    <div style={{
      position:'absolute', top, left:0, zIndex:0, pointerEvents:'none',
      animation:`hw-bat-fly ${dur}s ${delay}s linear infinite`,
      transform:`scale(${scale})`,
    }}>
      <svg width="22" height="12" viewBox="0 0 22 12" style={{ animation:`hw-bat-flap ${0.35 + (delay % 0.3)}s ease-in-out infinite` }}>
        <path d="M11 6 C8 0, 2 0, 0 4 C4 4, 7 5, 9 7 C7 5, 5 8, 2 9 C6 9, 9 8, 11 6 Z" fill="rgba(20,10,25,0.7)" />
        <path d="M11 6 C14 0, 20 0, 22 4 C18 4, 15 5, 13 7 C15 5, 17 8, 20 9 C16 9, 13 8, 11 6 Z" fill="rgba(20,10,25,0.7)" />
      </svg>
    </div>
  )
}

function ShootingStar({ top, left, dur, delay }) {
  return (
    <div style={{ position:'absolute', top, left, zIndex:0, pointerEvents:'none' }}>
      <div style={{
        width:70, height:2, borderRadius:2,
        background:'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,215,0,0.5), transparent)',
        boxShadow:'0 0 8px rgba(255,255,255,0.8)',
        animation:`hw-shooting-star ${dur}s ${delay}s ease-in infinite`,
      }} />
    </div>
  )
}

function Ember({ left, size, delay, dur, ex }) {
  return (
    <div style={{
      position:'absolute', bottom:-20, left:`${left}%`,
      width:size, height:size, borderRadius:'50%',
      background:'radial-gradient(circle at 35% 30%, #FFF6D6, #FFB74D 60%, transparent 90%)',
      boxShadow:`0 0 ${size*2}px rgba(255,180,0,0.6)`,
      pointerEvents:'none', zIndex:0,
      animation:`hw-ember-rise ${dur}s ${delay}s ease-in infinite`,
      '--ex': `${ex}px`,
    }} />
  )
}

// ─── Fondo decorativo completo (luna + murciélagos + fugaces + estrellas + runas + velas + brasas + castillo) ──
export default function HogwartsBackground() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Niebla mágica/aurora ondulando arriba de todo */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:'22%', zIndex:0, pointerEvents:'none',
        background:'linear-gradient(180deg, rgba(116,0,1,0.18), rgba(201,168,76,0.08), transparent)',
        animation:'hw-aurora-drift 10s ease-in-out infinite',
        filter:'blur(6px)',
      }} />

      <Moon />

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

      {/* Estrellas fugaces */}
      {SHOOTING_STARS.map((s, i) => <ShootingStar key={i} {...s} />)}

      {/* Murciélagos cruzando */}
      {BATS.map((b, i) => <Bat key={i} {...b} />)}

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

      {/* Brasas doradas subiendo */}
      {EMBERS.map(e => <Ember key={e.id} {...e} />)}

      {/* Velas laterales */}
      {SIDE_CANDLES.map((c,i) => <SideCandle key={i} {...c} />)}

      {/* Castillo grande de fondo — puramente decorativo, no roba clicks */}
      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', zIndex:0, pointerEvents:'none',
        animation:'tb-float-castle 8s ease-in-out infinite',
      }}>
        <Mascot width={340} opacity={0.08} interactive={false} />
      </div>
    </>
  )
}
