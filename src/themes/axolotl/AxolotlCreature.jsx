// AxolotlCreature.jsx — El ajolotito, pero VIVO (y ahora, acariciable).
//
// En vez del <img src="axolotl.svg" /> estático de siempre, esto es el mismo
// dibujo recreado como SVG inline con cada parte como su propia pieza animable:
// las branquias ondulan como algas bajo el agua, la colita se mece, parpadea,
// el sonrojo late suave y todo el cuerpo flota como si nadara. Se anima solo
// con Framer Motion — nada de spritesheets ni de dependencias nuevas.
//
// Además: clickearlo es "acariciarlo" — hace un bounce/squish de mimo y suelta
// una ráfaga de corazones y destellos alrededor. Es puramente decorativo (no
// dispara nada más en la app), así que funciona en cualquier lugar donde se
// use <Mascot /> sin que nadie más tenga que saber que existe.
//
// Contrato: mismo que el viejo Mascot — { width, opacity, className, style } —
// más dos props nuevas, opcionales: `interactive` (default true — poné false
// para las instancias puramente decorativas de fondo) y `swim`/`paused` que
// ya existían. Nada de esto rompe a quien sólo pasaba width/opacity.
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'

const EASE = [0.45, 0.05, 0.25, 1]
const PET_EMOJIS = ['🩷', '💗', '✨', '💖', '✨', '🩷', '💗']

// Una "ondulación" de rama de branquia: rotación pequeña e independiente
// alrededor de su punto de anclaje a la cabeza, con fase propia para que las
// tres ramas de cada lado no se muevan al unísono (se ve como agua fluyendo).
function GillFrond({ d, cx, cy, origin, duration, delay, flip = false }) {
  const swing = flip ? [0, 5, 0, -4, 0] : [0, -5, 0, 4, 0]
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: origin }}
      animate={{ rotate: swing }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d={d} stroke="#FF6FA5" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx={cx} cy={cy} r="6" fill="#FF9DCB" />
    </motion.g>
  )
}

// Ráfaga de corazones/destellos que sale disparada del centro al acariciarlo.
// Se genera una sola vez por instancia (useMemo) para que no "salte" de
// posición si el componente se re-renderiza mientras la animación corre.
function PetBurst() {
  const particles = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 + (Math.random() * 0.5 - 0.25)
    const dist = 40 + Math.random() * 34
    return {
      id: i,
      emoji: PET_EMOJIS[i % PET_EMOJIS.length],
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      rotate: Math.random() * 70 - 35,
      delay: i * 0.025,
      size: 13 + Math.random() * 9,
    }
  }), [])

  return (
    <>
      {particles.map(p => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.25, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: p.x,
            y: p.y - 22,
            scale: [0.25, 1.2, 1, 0.75],
            rotate: p.rotate,
          }}
          transition={{ duration: 0.9, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute', left: '50%', top: '42%',
            fontSize: p.size, pointerEvents: 'none', zIndex: 30,
            filter: 'drop-shadow(0 0 4px rgba(255,111,165,0.5))',
          }}
        >{p.emoji}</motion.span>
      ))}
    </>
  )
}

export default function AxolotlCreature({
  width = 220,
  opacity = 1,
  className = '',
  style = {},
  swim = false,        // true = versión decorativa que nada de lado a lado (para fondos)
  paused = false,       // true = congela animaciones costosas (para previews en miniatura)
  interactive = true,   // false = puramente decorativo, sin click ni cursor (fondos)
}) {
  const height = Math.round(width * (220 / 240))
  const squish = useAnimation()
  const [bursts, setBursts] = useState([])

  const handlePet = useCallback(() => {
    squish.start({
      scale: [1, 0.78, 1.2, 0.93, 1.04, 1],
      transition: { duration: 0.65, ease: 'easeInOut' },
    })
    const id = `${Date.now()}-${Math.random()}`
    setBursts(b => [...b, id])
    setTimeout(() => setBursts(b => b.filter(x => x !== id)), 950)
  }, [squish])

  const bodyAnimate = paused ? {} : {
    y: [0, -5, 0, 3, 0],
    rotate: swim ? [0, -2.5, 0, 2.5, 0] : [-1.2, 1.2, -1.2],
  }
  const bodyTransition = paused ? {} : {
    y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
    rotate: { duration: swim ? 3.4 : 5, repeat: Infinity, ease: 'easeInOut' },
  }

  const creature = (
    <motion.div animate={squish} initial={{ scale: 1 }} style={{ display: 'inline-flex' }}>
      <motion.div
        className={className}
        style={{ display: 'inline-flex', opacity, ...style }}
        animate={bodyAnimate}
        transition={bodyTransition}
      >
        <svg viewBox="0 0 240 220" width={width} height={height} style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id="axo-body-live" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#FFD3EA" />
              <stop offset="100%" stopColor="#FFA9D6" />
            </radialGradient>
          </defs>

          {/* ── Cola: se mece como si empujara agua ── */}
          <motion.path
            d="M60 165 Q20 175 15 145 Q35 150 55 150 Z"
            fill="url(#axo-body-live)"
            style={{ transformBox: 'fill-box', transformOrigin: '92% 15%' }}
            animate={paused ? {} : { rotate: [0, -11, 0, 9, 0] }}
            transition={paused ? {} : { duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* ── Patitas: pequeño remo, como nadando ── */}
          {[
            { cx: 95,  cy: 178, rx: 12, ry: 8, origin: '50% 0%',  d: 3.1, delay: 0.1  },
            { cx: 150, cy: 178, rx: 12, ry: 8, origin: '50% 0%',  d: 3.3, delay: 0.3  },
          ].map((l, i) => (
            <motion.ellipse key={`back-leg-${i}`} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} fill="#FF9DCB"
              style={{ transformBox: 'fill-box', transformOrigin: l.origin }}
              animate={paused ? {} : { rotate: [0, i === 0 ? -8 : 8, 0] }}
              transition={paused ? {} : { duration: l.d, delay: l.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
          <motion.ellipse cx="82" cy="150" rx="10" ry="7" fill="#FF9DCB" transform="rotate(-18 82 150)"
            style={{ transformBox: 'fill-box', transformOrigin: '70% 30%' }}
            animate={paused ? {} : { rotate: [-18, -26, -18] }}
            transition={paused ? {} : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.ellipse cx="168" cy="150" rx="10" ry="7" fill="#FF9DCB" transform="rotate(18 168 150)"
            style={{ transformBox: 'fill-box', transformOrigin: '30% 30%' }}
            animate={paused ? {} : { rotate: [18, 26, 18] }}
            transition={paused ? {} : { duration: 2.9, delay: 0.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* ── Cuerpo ── */}
          <ellipse cx="122" cy="140" rx="62" ry="46" fill="url(#axo-body-live)" />
          <ellipse cx="122" cy="158" rx="38" ry="20" fill="#FFE7F5" />

          {/* ── Branquias — ramas independientes, como algas en la corriente ── */}
          {!paused && (
            <>
              <GillFrond d="M78 78 Q48 68 38 46"   cx={38} cy={46}  origin="100% 100%" duration={2.6} delay={0}   />
              <GillFrond d="M82 90 Q50 88 36 72"    cx={36} cy={72}  origin="100% 100%" duration={3.1} delay={0.25} />
              <GillFrond d="M86 103 Q54 108 40 100" cx={40} cy={100} origin="100% 50%"  duration={2.8} delay={0.5} />

              <GillFrond d="M166 78 Q196 68 206 46"   cx={206} cy={46}  origin="0% 100%" duration={2.7} delay={0.1}  flip />
              <GillFrond d="M162 90 Q194 88 208 72"    cx={208} cy={72}  origin="0% 100%" duration={3.2} delay={0.35} flip />
              <GillFrond d="M158 103 Q190 108 204 100" cx={204} cy={100} origin="0% 50%"  duration={2.9} delay={0.6}  flip />
            </>
          )}
          {paused && (
            <>
              <g stroke="#FF6FA5" strokeWidth="7" strokeLinecap="round" fill="none">
                <path d="M78 78 Q48 68 38 46" /><path d="M82 90 Q50 88 36 72" /><path d="M86 103 Q54 108 40 100" />
                <path d="M166 78 Q196 68 206 46" /><path d="M162 90 Q194 88 208 72" /><path d="M158 103 Q190 108 204 100" />
              </g>
              {[[38,46],[36,72],[40,100],[206,46],[208,72],[204,100]].map(([cx,cy],i) => (
                <circle key={i} cx={cx} cy={cy} r="6" fill="#FF9DCB" />
              ))}
            </>
          )}

          {/* ── Cabeza ── */}
          <ellipse cx="122" cy="82" rx="54" ry="46" fill="url(#axo-body-live)" />

          {/* ── Sonrojo — late muy suave, como cuando algo le encanta ── */}
          <motion.g
            animate={paused ? {} : { opacity: [0.4, 0.7, 0.4] }}
            transition={paused ? {} : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ellipse cx="90"  cy="95" rx="11" ry="7" fill="#FF6FA5" opacity="0.45" />
            <ellipse cx="154" cy="95" rx="11" ry="7" fill="#FF6FA5" opacity="0.45" />
          </motion.g>

          {/* ── Ojos — parpadeo real de vez en cuando ── */}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            animate={paused ? {} : { scaleY: [1, 1, 1, 0.08, 1, 1, 1, 1, 1, 0.08, 1] }}
            transition={paused ? {} : { duration: 5.5, repeat: Infinity, ease: EASE, times: [0, 0.32, 0.4, 0.44, 0.5, 0.6, 0.68, 0.86, 0.9, 0.94, 1] }}
          >
            <circle cx="102" cy="78" r="8" fill="#3A2233" />
            <circle cx="142" cy="78" r="8" fill="#3A2233" />
            <circle cx="99"  cy="75" r="2.6" fill="#FFFFFF" />
            <circle cx="139" cy="75" r="2.6" fill="#FFFFFF" />
          </motion.g>

          {/* ── Sonrisa ── */}
          <path d="M112 96 Q122 104 132 96" stroke="#B24E7A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </svg>
      </motion.div>
    </motion.div>
  )

  if (!interactive) return creature

  return (
    <motion.div
      onClick={handlePet}
      whileTap={{ scale: 0.9 }}
      role="button"
      tabIndex={0}
      aria-label="Acariciar al ajolote"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePet() } }}
      style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }}
    >
      {creature}
      <AnimatePresence>
        {bursts.map(id => <PetBurst key={id} />)}
      </AnimatePresence>
    </motion.div>
  )
}
