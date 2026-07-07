// Settings.jsx — Tema visual Hogwarts para la pantalla de configuración
// Exporta estilos y decoraciones que Settings.jsx puede consumir

import { motion } from 'framer-motion'
import { Mascot } from './Background'

// Insignia de la barra lateral — mascota + nombre del tema
export function SidebarBadge() {
  return (
    <div style={{ textAlign:'center', padding:'4px 0 14px',
      borderBottom:'1px solid rgba(var(--tb-primary-rgb),0.1)', marginBottom:8,
    }}>
      <motion.div animate={{ y:[0,-2,0] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}>
        <Mascot width={130} opacity={1} />
      </motion.div>
      <p style={{ fontFamily:'var(--tb-font-heading)', fontSize:13,
        color:'rgba(var(--tb-primary-rgb),0.6)', letterSpacing:1, marginTop:-4,
        textShadow:'0 0 12px rgba(var(--tb-primary-rgb),0.3)',
      }}>Hogwarts</p>
    </div>
  )
}

// Vela flotante decorativa para el Gran Comedor
export function FloatingCandle({ style, delay = 0 }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-0"
      style={style}
      animate={{
        y:       [0, -4, 0],
        opacity: [0.6, 1, 0.6],
        rotate:  [-1, 1, -1],
      }}
      transition={{
        duration: 2.5 + delay * 0.3,
        delay,
        repeat:   Infinity,
        ease:     'easeInOut',
      }}
    >
      {/* Llama */}
      <div style={{
        width: 6, height: 14,
        background: 'radial-gradient(ellipse at 40% 60%, #FFF8DC, #FFD700, #FF8C00)',
        borderRadius: '50% 50% 30% 30%',
        marginLeft: 3, marginBottom: 1,
        filter: 'blur(0.5px)',
        boxShadow: '0 0 8px #FFD700, 0 -4px 10px rgba(255,140,0,0.4)',
      }} />
      {/* Cera */}
      <div style={{
        width: 12, height: 28,
        background: 'linear-gradient(to bottom, #F5E6C8 0%, #DDD0A0 60%, #C8B870 100%)',
        borderRadius: 3,
        boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.1)',
      }} />
    </motion.div>
  )
}

// Fondo estilo Gran Comedor con velas flotantes
export function HogwartsBackground({ children }) {
  const candles = [
    { style: { left: '5%',  top: '10%' }, delay: 0 },
    { style: { left: '12%', top: '30%' }, delay: 0.4 },
    { style: { left: '8%',  top: '60%' }, delay: 0.8 },
    { style: { right: '5%', top: '15%' }, delay: 0.2 },
    { style: { right: '12%',top: '45%' }, delay: 0.6 },
    { style: { right: '7%', top: '70%' }, delay: 1 },
  ]

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(201,168,76,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(116,0,1,0.12) 0%, transparent 50%),
          linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)
        `,
      }}
    >
      {/* Velas flotantes de fondo */}
      {candles.map((c, i) => <FloatingCandle key={i} {...c} />)}

      {/* Ornamento de esquinas */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-12 h-12 pointer-events-none opacity-20`}
          style={{
            background: 'radial-gradient(circle, rgba(201,168,76,0.4), transparent 70%)',
          }}
        />
      ))}

      {children}
    </div>
  )
}

// Card estilo pergamino para secciones de Settings
export function ParchmentCard({ children, title, icon, className = '' }) {
  return (
    <motion.div
      className={`rounded-xl border ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(245,230,200,0.06) 0%, rgba(201,168,76,0.03) 100%)',
        borderColor: 'rgba(201,168,76,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(201,168,76,0.1)',
      }}
      whileHover={{ borderColor: 'rgba(201,168,76,0.35)' }}
      transition={{ duration: 0.2 }}
    >
      {title && (
        <div
          className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ borderColor: 'rgba(201,168,76,0.1)' }}
        >
          <span>{icon}</span>
          <span
            className="text-sm font-medium"
            style={{ color: '#C9A84C', fontFamily: '"Inter", sans-serif' }}
          >
            {title}
          </span>
        </div>
      )}
      <div className="p-4">{children}</div>
    </motion.div>
  )
}
