// Background.jsx — Fondo decorativo del tema Axolote: un acuario de verdad.
// Misma "forma" que themes/hogwarts/Background.jsx (mismo contrato: default =
// fondo completo, Mascot = ilustración reusable) — pero la decoración ya no es
// sólo burbujas + corazones: ahora hay luz caústica ondulando como si el sol
// atravesara el agua, algas meciéndose en el fondo, peces cruzando la pantalla
// y el ajolotito (ver AxolotlCreature.jsx) nadando de verdad, con branquias que
// ondulan y todo.
import AxolotlCreature from './AxolotlCreature'

// ─── Ajolotito (mismo contrato de siempre: width / opacity / className / style) ──
// Antes era un <img> plano — ahora es la criatura animada de AxolotlCreature,
// así que todo lo que ya usaba <Mascot /> (Settings, Notification, previews de
// tema) gana la animación gratis sin tocar ningún otro archivo.
export function Mascot({ width = 220, opacity = 0.16, className = '', style = {}, ...rest }) {
  return (
    <div className={className} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }}>
      <AxolotlCreature width={width} opacity={opacity} {...rest} />
    </div>
  )
}

// ─── Animaciones CSS globales del tema ─────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&display=swap');

@keyframes tb-bubble-rise {
  0%   { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
  10%  { opacity: 0.8; }
  45%  { transform: translateY(-190px) translateX(var(--bx,0px)) scale(1); }
  90%  { opacity: 0.5; }
  100% { transform: translateY(-420px) translateX(0px) scale(1.1); opacity: 0; }
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

/* ── Nuevo: luz caústica — bandas de luz onduladas como sol atravesando agua ── */
@keyframes ax-caustic-drift {
  0%   { transform: translate(-6%, -4%) rotate(0deg) scaleY(1);   opacity: 0.35; }
  50%  { transform: translate(4%, 3%)   rotate(3deg) scaleY(1.15); opacity: 0.6;  }
  100% { transform: translate(-6%, -4%) rotate(0deg) scaleY(1);   opacity: 0.35; }
}
@keyframes ax-caustic-drift-rev {
  0%   { transform: translate(5%, 3%) rotate(0deg) scaleY(1);    opacity: 0.28; }
  50%  { transform: translate(-4%, -3%) rotate(-3deg) scaleY(1.1); opacity: 0.5;  }
  100% { transform: translate(5%, 3%) rotate(0deg) scaleY(1);    opacity: 0.28; }
}

/* ── Nuevo: algas/coral meciéndose desde la base ── */
@keyframes ax-seaweed-sway {
  0%,100% { transform: rotate(-4deg); }
  50%     { transform: rotate(5deg); }
}

/* ── Nuevo: peces cruzando de un lado a otro ── */
@keyframes ax-fish-swim {
  0%   { transform: translateX(-40px) translateY(0px); opacity: 0; }
  8%   { opacity: 0.5; }
  92%  { opacity: 0.5; }
  100% { transform: translateX(calc(100vw + 40px)) translateY(-18px); opacity: 0; }
}

/* ── Nuevo: brillo de superficie del agua arriba de todo ── */
@keyframes ax-surface-glint {
  0%,100% { opacity: 0.18; transform: scaleX(1); }
  50%     { opacity: 0.4;  transform: scaleX(1.04); }
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

// Burbujas subiendo desde abajo — ahora con "wobble" lateral en vez de subir
// en línea recta, para que se sientan flotando en agua de verdad.
const BUBBLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: (i * 4.3) % 100,
  size: 3 + (i % 5) * 2.5,
  delay: (i * 0.3) % 8,
  dur: 6 + (i % 5) * 1.7,
  bx: ((i % 2 === 0) ? 1 : -1) * (10 + (i % 4) * 8),
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

// Rayos de luz caústica: un puñado de bandas diagonales translúcidas que se
// mecen lentamente — el efecto clásico de sol filtrándose por la superficie
// de un acuario. mixBlendMode:'screen' hace que sólo aclaren, nunca oscurezcan.
const CAUSTIC_RAYS = [
  { left: '4%',  width: 90,  delay: 0,   dur: 9,  rev: false },
  { left: '20%', width: 60,  delay: 1.4, dur: 11, rev: true  },
  { left: '46%', width: 110, delay: 0.6, dur: 10, rev: false },
  { left: '68%', width: 70,  delay: 2.1, dur: 8,  rev: true  },
  { left: '85%', width: 85,  delay: 1.1, dur: 12, rev: false },
]

function CausticRay({ left, width, delay, dur, rev }) {
  return (
    <div style={{
      position:'absolute', top:'-10%', left, width, height:'130%',
      background:'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,111,165,0.05) 55%, transparent 85%)',
      filter:'blur(6px)', mixBlendMode:'screen', pointerEvents:'none', zIndex:0,
      transformOrigin:'top center',
      animation:`${rev ? 'ax-caustic-drift-rev' : 'ax-caustic-drift'} ${dur}s ${delay}s ease-in-out infinite`,
    }} />
  )
}

// Algas/coral en las esquinas inferiores — se mecen como si la corriente las
// empujara. Formas simples (elipses estiradas) apiladas para dar volumen sin
// necesitar un SVG nuevo.
function Seaweed({ side = 'left', count = 4 }) {
  const base = side === 'left' ? { left: -6 } : { right: -6 }
  return (
    <div style={{ position:'absolute', bottom:-10, ...base, zIndex:0, pointerEvents:'none', display:'flex', gap:2, alignItems:'flex-end' }}>
      {Array.from({ length: count }, (_, i) => {
        const h = 60 + (i % 3) * 26
        const hue = i % 2 === 0 ? 'rgba(176,132,245,0.22)' : 'rgba(255,111,165,0.18)'
        return (
          <div key={i} style={{
            width: 10, height: h, borderRadius: '50% 50% 20% 20% / 60% 60% 10% 10%',
            background: `linear-gradient(180deg, ${hue}, rgba(43,16,48,0.05))`,
            transformOrigin: 'bottom center',
            animation: `ax-seaweed-sway ${3.4 + i * 0.5}s ${i * 0.3}s ease-in-out infinite alternate`,
          }} />
        )
      })}
    </div>
  )
}

// Peces decorativos — silueta simple, cruzan la pantalla muy sutiles, a dos
// profundidades distintas (más rápido y opaco = más "cerca").
function Fish({ top, dur, delay, scale = 1, flip = false }) {
  return (
    <div style={{
      position:'absolute', top, left: 0, zIndex:0, pointerEvents:'none',
      animation: `ax-fish-swim ${dur}s ${delay}s linear infinite`,
      transform: `scale(${scale}) ${flip ? 'scaleY(-1)' : ''}`,
    }}>
      <svg width="26" height="14" viewBox="0 0 26 14" style={{ filter:'drop-shadow(0 0 4px rgba(255,111,165,0.35))' }}>
        <ellipse cx="14" cy="7" rx="10" ry="5.5" fill="rgba(255,143,193,0.55)" />
        <path d="M4 7 L0 2 L0 12 Z" fill="rgba(255,143,193,0.5)" />
        <circle cx="19" cy="5.5" r="1.1" fill="#3A2233" opacity="0.6" />
      </svg>
    </div>
  )
}

// ─── Fondo decorativo completo (acuario: caústicas + algas + burbujas + peces + ajolote) ──
export default function AxolotlBackground() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Luz caústica ondulando */}
      {CAUSTIC_RAYS.map((r, i) => <CausticRay key={i} {...r} />)}

      {/* Brillo de superficie arriba de todo */}
      <div style={{
        position:'absolute', top:0, left:'10%', right:'10%', height:2, zIndex:0, pointerEvents:'none',
        background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
        animation:'ax-surface-glint 5s ease-in-out infinite',
      }} />

      {/* Algas en ambas esquinas inferiores */}
      <Seaweed side="left" count={4} />
      <Seaweed side="right" count={3} />

      {/* Burbujas */}
      {BUBBLES.map(b => <Bubble key={b.id} {...b} />)}

      {/* Peces cruzando a dos profundidades */}
      <Fish top="22%" dur={26} delay={0}  scale={1}   />
      <Fish top="58%" dur={34} delay={9}  scale={0.8} flip />
      <Fish top="40%" dur={30} delay={18} scale={1.15} />

      {/* Corazoncitos muy sutiles */}
      {HEART_POSITIONS.map((pos, i) => (
        <div key={i} style={{
          position:'absolute', fontSize:11, pointerEvents:'none', zIndex:0,
          animation:`tb-heart-pulse ${3+i*0.5}s ${i*0.4}s ease-in-out infinite`,
          ...pos,
        }}>{HEARTS[i % HEARTS.length]}</div>
      ))}

      {/* Ajolotito nadando lento por el fondo, más cerca de la cámara.
          interactive=false: es puramente decorativo y vive detrás del
          contenido real, no queremos que robe clicks pensados para la UI. */}
      <div style={{ position:'absolute', bottom:-6, left:'50%', transform:'translateX(-50%)', zIndex:0, pointerEvents:'none' }}>
        <Mascot width={320} opacity={0.13} swim interactive={false} />
      </div>

      {/* Un segundo ajolotito pequeñito, nadando de fondo, más lejos */}
      <div style={{ position:'absolute', bottom:40, left:'12%', zIndex:0, pointerEvents:'none' }}>
        <Mascot width={70} opacity={0.1} swim interactive={false} />
      </div>
    </>
  )
}
