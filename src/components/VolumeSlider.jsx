import { useState, useRef, useCallback } from 'react'
import { IconVolumeHigh, IconVolumeLow, IconVolumeMute } from './Icons'
import { useSpotifyControls } from './useSpotifyControls'

export default function VolumeSlider({ className = '' }) {
  const { setVolume } = useSpotifyControls()
  const [vol,   setVol]   = useState(70)
  const [muted, setMuted] = useState(false)
  const [hover, setHover] = useState(false)
  const prevVol = useRef(70)
  const barRef  = useRef(null)
  const [dragging, setDragging] = useState(false)

  const getPct = useCallback((e) => {
    if (!barRef.current) return 0
    const rect = barRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  }, [])

  const applyVolume = (pct) => {
    setVol(Math.round(pct))
    setVolume(Math.round(pct))
    setMuted(false)
  }

  const onMouseDown = (e) => {
    e.preventDefault()
    setDragging(true)
    applyVolume(getPct(e))

    const onMove = (ev) => applyVolume(getPct(ev))
    const onUp   = (ev) => {
      applyVolume(getPct(ev))
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const toggleMute = () => {
    if (muted) { setVolume(prevVol.current); }
    else       { prevVol.current = vol; setVolume(0); }
    setMuted(!muted)
  }

  const displayVol = muted ? 0 : vol
  const VolumeIcon = displayVol === 0 ? IconVolumeMute : displayVol < 50 ? IconVolumeLow : IconVolumeHigh

  return (
    <div className={`flex items-center gap-1.5 no-drag ${className}`}>
      <button
        onClick={toggleMute}
        className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
        title={muted ? 'Activar sonido' : 'Silenciar'}
      >
        <VolumeIcon size={13} />
      </button>

      <div
        ref={barRef}
        onMouseDown={onMouseDown}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="relative cursor-pointer"
        style={{ width: 64, height: 4, borderRadius: 4 }}
      >
        {/* Track */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 4,
        }} />
        {/* Fill */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${displayVol}%`,
          background: 'linear-gradient(90deg, #C9A84C, #F0C040)',
          borderRadius: 4,
          transition: dragging ? 'none' : 'width 0.1s ease',
        }} />
        {/* Thumb — wrapper fijo + inner escalable */}
        <div style={{
          position: 'absolute',
          left: `${displayVol}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 10, height: 10,
          pointerEvents: 'none',
        }}>
          <div style={{
            width: '100%', height: '100%',
            borderRadius: '50%',
            background: '#F0C040',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            transition: 'transform 0.12s ease, opacity 0.12s ease',
            transform: (hover || dragging) ? 'scale(1.4)' : 'scale(1)',
            opacity: (hover || dragging) ? 1 : 0.7,
            transformOrigin: 'center center',
          }} />
        </div>
      </div>
    </div>
  )
}
