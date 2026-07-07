import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { getTheme } from '../themes'

export default function SplashScreen() {
  const navigate = useNavigate()
  const { isAuthenticated, activeTheme, loadSettings } = useAppStore()
  const theme = getTheme(activeTheme).data

  useEffect(() => {
    const init = async () => {
      await loadSettings()
      const hasToken = await window.electronAPI?.storeGet('spotifyAccessToken', null)
      setTimeout(() => {
        navigate(hasToken ? '/settings' : '/login', { replace: true })
      }, 2200)
    }
    init()
  }, [])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-tb-bg relative overflow-hidden">
      {/* Partículas de fondo */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-tb-accent"
          style={{
            left: `${Math.random() * 100}%`,
            top:  `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Logo / título */}
      <motion.div
        className="text-center z-10"
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          className="text-7xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {theme.emoji}
        </motion.div>

        <motion.h1
          className="font-tb-heading text-5xl text-tb-accent mb-2"
          style={{ textShadow: '0 0 20px rgba(var(--tb-primary-rgb),0.8), 0 0 40px rgba(var(--tb-primary-rgb),0.4)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          TupperBeats
        </motion.h1>

        <motion.p
          className="text-tb-textlight/60 text-sm tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          ✨ Música mágica para Tupper ✨
        </motion.p>
      </motion.div>

      {/* Barra de carga */}
      <motion.div
        className="absolute bottom-12 w-48 h-0.5 bg-tb-textlight/20 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.div
          className="h-full bg-tb-accent rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ delay: 1, duration: 1.1, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  )
}
