import { motion } from 'framer-motion'
import { IconPlay, IconPause, IconSkipNext, IconSkipPrev } from './Icons'
import { useSpotifyControls } from './useSpotifyControls'
import useAppStore from '../store/useAppStore'

export default function PlayerControls({ size = 'md', className = '' }) {
  const { isPlaying } = useAppStore()
  const { togglePlay, next, previous } = useSpotifyControls()

  const cfg = {
    sm: { side: 28, play: 34, icon: 12, playIcon: 14 },
    md: { side: 36, play: 44, icon: 14, playIcon: 18 },
    lg: { side: 40, play: 52, icon: 16, playIcon: 22 },
  }[size] || { side: 36, play: 44, icon: 14, playIcon: 18 }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.button
        onClick={previous}
        className="flex items-center justify-center rounded-full text-white/60 hover:text-white no-drag transition-colors"
        style={{ width: cfg.side, height: cfg.side }}
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.88 }}
        title="Anterior"
      >
        <IconSkipPrev size={cfg.icon} />
      </motion.button>

      <motion.button
        onClick={togglePlay}
        className="flex items-center justify-center rounded-full text-tb-bg no-drag"
        style={{
          width: cfg.play, height: cfg.play,
          background: 'linear-gradient(135deg, var(--tb-accent), var(--tb-primary))',
          boxShadow: '0 2px 12px rgba(var(--tb-primary-rgb),0.5)',
        }}
        whileHover={{ scale: 1.08, boxShadow: '0 0 24px rgba(var(--tb-primary-rgb),0.8)' }}
        whileTap={{ scale: 0.92 }}
        title={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        {isPlaying
          ? <IconPause size={cfg.playIcon} />
          : <IconPlay size={cfg.playIcon} />
        }
      </motion.button>

      <motion.button
        onClick={next}
        className="flex items-center justify-center rounded-full text-white/60 hover:text-white no-drag transition-colors"
        style={{ width: cfg.side, height: cfg.side }}
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.88 }}
        title="Siguiente"
      >
        <IconSkipNext size={cfg.icon} />
      </motion.button>
    </div>
  )
}
