import { useState, useRef, useCallback, useEffect } from 'react'
import { useSpotifyControls } from './useSpotifyControls'
import useAppStore from '../store/useAppStore'

function formatTime(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

// Thumb posicionado correctamente: wrapper fijo + inner escalable
function SliderThumb({ pct, isDragging, color = '#F0C040' }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${pct}%`,
        top: '50%',
        // Centrar el thumb sin usar margin negativo que confunde la escala
        transform: 'translate(-50%, -50%)',
        width: 12,
        height: 12,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: color,
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          transition: 'transform 0.12s ease',
          transform: isDragging ? 'scale(1.5)' : 'scale(1)',
          transformOrigin: 'center center',
        }}
      />
    </div>
  )
}

export default function ProgressBar({ variant = 'default', className = '' }) {
  const { currentTrack, progress } = useAppStore()
  const { seek } = useSpotifyControls()
  const barRef     = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [localPct, setLocalPct] = useState(null)

  const duration = currentTrack?.duration || 1
  const pct      = dragging ? localPct : Math.min(100, (progress / duration) * 100)

  const getPct = useCallback((e) => {
    if (!barRef.current) return 0
    const rect = barRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  }, [])

  const onMouseDown = (e) => {
    e.preventDefault()
    setDragging(true)
    setLocalPct(getPct(e))

    const onMove = (ev) => setLocalPct(getPct(ev))
    const onUp   = (ev) => {
      const final = getPct(ev)
      seek((final / 100) * duration)
      setDragging(false)
      setLocalPct(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const trackH    = variant === 'wand' ? 6  : 4
  const fillColor = variant === 'wand'
    ? 'linear-gradient(90deg, #740001, #C9A84C, #F0C040)'
    : 'linear-gradient(90deg, #C9A84C, #F0C040)'

  return (
    <div className={className}>
      <div
        ref={barRef}
        onMouseDown={onMouseDown}
        className="relative cursor-pointer no-drag"
        style={{ height: trackH, borderRadius: trackH }}
      >
        {/* Track fondo */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: trackH,
        }} />
        {/* Fill */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${pct}%`,
          background: fillColor,
          borderRadius: trackH,
          transition: dragging ? 'none' : 'width 0.3s linear',
        }} />
        {/* Thumb — posicionado con wrapper independiente */}
        <SliderThumb pct={pct} isDragging={dragging} />
      </div>

      <div className="flex justify-between mt-1" style={{ fontSize: 10, color: 'rgba(245,230,200,0.4)' }}>
        <span>{formatTime((pct / 100) * duration)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}
