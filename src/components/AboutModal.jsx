import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { getTheme } from '../themes'

export default function AboutModal({ open, onClose }) {
  const { activeTheme } = useAppStore()
  const theme = getTheme(activeTheme).data
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative max-w-sm w-full mx-6 rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2a1a08 0%, var(--tb-bg) 100%)',
              border: '1px solid rgba(var(--tb-primary-rgb),0.5)',
              boxShadow: '0 0 40px rgba(var(--tb-primary-rgb),0.3), 0 20px 60px rgba(0,0,0,0.6)',
            }}
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Partículas */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 3, height: 3,
                  background: 'var(--tb-primary)',
                  left: `${10 + i * 11}%`,
                  bottom: 0,
                }}
                animate={{ y: [0, -140], opacity: [0, 0.9, 0], scale: [0.5, 1.2, 0] }}
                transition={{ duration: 2 + i * 0.3, delay: i * 0.2, repeat: Infinity, ease: 'easeOut' }}
              />
            ))}

            <div className="relative z-10 p-8 text-center">
              {/* Mascota animada */}
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                {theme.emoji}
              </motion.div>

              {/* Título */}
              <h2
                className="text-3xl mb-2"
                style={{
                  fontFamily: 'var(--tb-font-heading)',
                  color: 'var(--tb-primary)',
                  textShadow: '0 0 20px rgba(var(--tb-primary-rgb),0.8)',
                }}
              >
                TupperBeats
              </h2>

              <p className="text-tb-textlight/40 text-xs mb-6 tracking-widest uppercase">Versión 1.0.0</p>

              {/* Separador */}
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-tb-primary to-transparent mx-auto mb-6" />

              {/* Mensaje de cumpleaños */}
              <div
                className="rounded-xl p-4 mb-6"
                style={{
                  background: 'rgba(var(--tb-textLight-rgb),0.06)',
                  border: '1px solid rgba(var(--tb-primary-rgb),0.2)',
                }}
              >
                <p className="text-tb-textlight/80 text-sm leading-relaxed">
                  Para mi mejor amiga <strong className="text-tb-accent">Tupper</strong> 💜
                </p>
                <p className="text-tb-textlight/60 text-sm leading-relaxed mt-2">
                  Que cada canción que escuches suene tan especial como tú ✨
                </p>
                <p className="text-tb-textlight/50 text-sm mt-3">
                  <strong className="text-tb-accent">¡Feliz cumpleaños!</strong> 🎂 {theme.emoji}
                </p>
              </div>

              <p className="text-tb-textlight/30 text-xs mb-4">
                Hecho con amor por <span className="text-tb-accent">MrSoniccx</span>
              </p>

              <motion.button
                onClick={onClose}
                className="px-6 py-2 rounded-xl text-sm font-medium text-tb-bg no-drag"
                style={{ background: 'linear-gradient(135deg, var(--tb-primary), var(--tb-accent))' }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(var(--tb-primary-rgb),0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                ✨ ¡Gracias!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
