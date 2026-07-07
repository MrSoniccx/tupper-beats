// Settings.jsx — Decoraciones del tema Axolote para la pantalla de configuración
import { motion } from 'framer-motion'
import { Mascot } from './Background'

// Insignia de la barra lateral — mascota + nombre del tema
export function SidebarBadge() {
  return (
    <div style={{ textAlign:'center', padding:'4px 0 14px',
      borderBottom:'1px solid rgba(var(--tb-primary-rgb),0.15)', marginBottom:8,
    }}>
      <motion.div animate={{ y:[0,-2,0] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}>
        <Mascot width={110} opacity={1} />
      </motion.div>
      <p style={{ fontFamily:'var(--tb-font-heading)', fontSize:14, fontWeight:700,
        color:'rgba(var(--tb-primary-rgb),0.75)', letterSpacing:0.5, marginTop:-2,
        textShadow:'0 0 12px rgba(var(--tb-primary-rgb),0.3)',
      }}>Axolote 🌸</p>
    </div>
  )
}
