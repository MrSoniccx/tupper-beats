import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PlayerControls from '../../components/PlayerControls'
import ProgressBar from '../../components/ProgressBar'
import VolumeSlider from '../../components/VolumeSlider'
import { IconClose } from '../../components/Icons'


const GLOBAL_CSS = `
@keyframes tb-candle {
  0%,100% { transform: scaleX(1) rotate(0deg); opacity: .85; }
  35%     { transform: scaleX(0.65) rotate(2.5deg); opacity: 1; }
  70%     { transform: scaleX(1.15) rotate(-1.5deg); opacity: .9; }
}
@keyframes tb-spark {
  0%   { transform: translateY(0) translateX(0) scale(0.3) rotate(0deg); opacity:0; }
  8%   { opacity: 1; }
  80%  { opacity: 0.6; }
  100% { transform: translateY(-130px) translateX(var(--sx,0px)) scale(0.05) rotate(180deg); opacity:0; }
}
@keyframes tb-star-pulse {
  0%,100% { opacity: 0.12; transform: scale(1) rotate(0deg); }
  50%     { opacity: 0.75; transform: scale(1.5) rotate(15deg); }
}
@keyframes tb-rune-fade {
  0%,100% { opacity: 0.05; }
  50%     { opacity: 0.22; }
}
@keyframes tb-border-march {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes tb-outer-ring {
  0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.35), 0 0 12px rgba(201,168,76,0.15); }
  50%     { box-shadow: 0 0 0 4px rgba(201,168,76,0.12), 0 0 20px rgba(201,168,76,0.25); }
}
@keyframes tb-hover-glow {
  0%,100% { box-shadow: 0 0 0 2px rgba(240,192,64,0.7), 0 0 24px rgba(201,168,76,0.4), 0 6px 40px rgba(0,0,0,0.7); }
  50%     { box-shadow: 0 0 0 2.5px rgba(240,192,64,1),   0 0 38px rgba(201,168,76,0.7), 0 6px 40px rgba(0,0,0,0.7); }
}
@keyframes tb-shimmer-sweep {
  0%   { transform: translateX(-120%) skewX(-14deg); }
  100% { transform: translateX(500%)  skewX(-14deg); }
}
@keyframes tb-lightning {
  0%,90%,100% { opacity: 0; }
  92%         { opacity: 0.8; }
  94%         { opacity: 0; }
  96%         { opacity: 0.5; }
}
@keyframes tb-magic-ring {
  0%   { transform: rotate(0deg) scale(1.05); opacity: 0.3; }
  50%  { opacity: 0.6; }
  100% { transform: rotate(360deg) scale(1.05); opacity: 0.3; }
}
`

const SPARKS = [
  { id:0,  l:7,   sz:3, d:0,   dr:4.2, c:'#FFD700', sx:-10, shape:'circle'  },
  { id:1,  l:17,  sz:2, d:0.6, dr:3.8, c:'#F0C040', sx:14,  shape:'diamond' },
  { id:2,  l:29,  sz:3, d:1.3, dr:5.1, c:'#C9A84C', sx:-6,  shape:'circle'  },
  { id:3,  l:41,  sz:2, d:2.0, dr:4.6, c:'#FFD700', sx:9,   shape:'star'    },
  { id:4,  l:53,  sz:3, d:0.4, dr:3.5, c:'#C9A84C', sx:-14, shape:'circle'  },
  { id:5,  l:65,  sz:2, d:1.7, dr:4.8, c:'#F0C040', sx:7,   shape:'diamond' },
  { id:6,  l:76,  sz:3, d:0.9, dr:4.0, c:'#FFD700', sx:-8,  shape:'circle'  },
  { id:7,  l:87,  sz:2, d:2.4, dr:5.3, c:'#C9A84C', sx:16,  shape:'star'    },
  { id:8,  l:23,  sz:2, d:3.0, dr:3.9, c:'#F0C040', sx:-5,  shape:'circle'  },
  { id:9,  l:59,  sz:3, d:1.1, dr:4.4, c:'#C9A84C', sx:11,  shape:'diamond' },
  { id:10, l:34,  sz:2, d:2.7, dr:4.7, c:'#FFD700', sx:-13, shape:'circle'  },
  { id:11, l:71,  sz:2, d:0.4, dr:5.0, c:'#C9A84C', sx:6,   shape:'star'    },
]

// ─── Castillo de Hogwarts miniatura ─────────────────────────────────────────
function MiniCastle({ opacity = 0.18, width = 90 }) {
  // hogwarts-transparent.svg ya no tiene el rect de fondo blanco
  // sepia+hue-rotate convierte el negro del castillo en dorado
  return (
    <img
      src="./assets/hogwarts-transparent.svg"
      width={width}
      height={width}
      alt=""
      draggable={false}
      style={{
          pointerEvents: 'none',
          opacity: 1,
          filter: 'sepia(1) hue-rotate(5deg) saturate(4) brightness(4.5)',
          objectFit: 'contain',
          display: 'block',
        }}
    />
  )
}
function Spark({ s }) {
  const isCircle  = s.shape === 'circle'
  const isDiamond = s.shape === 'diamond'
  const isStar    = s.shape === 'star'
  return (
    <div style={{
      position: 'absolute', left: `${s.l}%`, bottom: 2,
      width: s.sz, height: s.sz,
      borderRadius: isCircle ? '50%' : isDiamond ? '2px' : '50%',
      background: s.c,
      transform: isDiamond ? 'rotate(45deg)' : undefined,
      pointerEvents: 'none',
      boxShadow: `0 0 ${s.sz * 2}px ${s.c}, 0 0 ${s.sz}px rgba(255,255,255,0.6)`,
      animation: `tb-spark ${s.dr}s ${s.d}s ease-out infinite`,
      '--sx': `${s.sx}px`,
    }} />
  )
}

// ─── Estrellas fijas ─────────────────────────────────────────────────────────
const STARS = [
  { id:0, t:10, l:12, sz:1.5, d:0,   dr:2.5 },
  { id:1, t:20, l:68, sz:1,   d:0.8, dr:3.2 },
  { id:2, t:42, l:87, sz:1.5, d:1.4, dr:2.8 },
  { id:3, t:62, l:4,  sz:1,   d:0.3, dr:3.6 },
  { id:4, t:78, l:48, sz:1.5, d:2.1, dr:2.3 },
  { id:5, t:32, l:38, sz:1,   d:1.0, dr:4.0 },
  { id:6, t:55, l:75, sz:1.5, d:0.5, dr:3.0 },
  { id:7, t:15, l:55, sz:1,   d:1.8, dr:2.6 },
]

// ─── Runas mágicas decorativas ───────────────────────────────────────────────
const RUNES = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ']
const RUNE_POSITIONS = [
  { t:'12%', l:'2%' }, { t:'50%', l:'2%' }, { t:'80%', l:'2%' },
  { t:'12%', r:'2%' }, { t:'50%', r:'2%' }, { t:'80%', r:'2%' },
  { t:'12%', r:'2%' }, { t:'50%', r:'2%' }, { t:'80%', r:'2%' },
  { t:'12%', r:'2%' }, { t:'50%', r:'2%' }, { t:'80%', r:'2%' },
]

// ─── Velas decorativas ───────────────────────────────────────────────────────
const CANDLES = [{ right: 10, bottom: 5 }, { left: 10, bottom: 5 }]

function Candle({ style }) {
  return (
    <div style={{ position: 'absolute', pointerEvents: 'none', ...style }}>
      {/* Halo de luz */}
      <div style={{
        position: 'absolute', top: -8, left: -6, width: 22, height: 22,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,180,0,0.2), transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Llama */}
      <div style={{
        width: 6, height: 13,
        background: 'radial-gradient(ellipse at 40% 60%, #fffde7, #FFD700 45%, #FF6B00)',
        borderRadius: '50% 50% 28% 28%',
        marginLeft: 3, marginBottom: 1,
        boxShadow: '0 0 8px #FFD700, 0 -4px 10px rgba(255,120,0,0.5)',
        animation: 'tb-candle 1.9s ease-in-out infinite',
      }} />
      {/* Cuerpo */}
      <div style={{
        width: 11, height: 24,
        background: 'linear-gradient(to bottom, #F5E6C8 0%, #D4BF8A 60%, #B8A060 100%)',
        borderRadius: 3,
        boxShadow: 'inset -2px 0 3px rgba(0,0,0,0.2), inset 1px 0 2px rgba(255,255,255,0.1)',
      }} />
    </div>
  )
}

// ─── Esquinas ornamentales HP ────────────────────────────────────────────────
// rotate: '0deg' = top-left, '90deg' = top-right, '-90deg' = bottom-left, '180deg' = bottom-right
function Corner({ pos, rotate = '0deg', isHovered }) {
  const c = isHovered ? '#F0C040' : '#C9A84C'
  const op = isHovered ? 0.9 : 0.5
  return (
    <div style={{ position: 'absolute', width: 22, height: 22, pointerEvents: 'none', opacity: op, transition: 'opacity 0.3s', ...pos }}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ transform: `rotate(${rotate})`, transformOrigin: 'center center' }}>
        <path d="M3 19 L3 7 Q3 3 7 3 L19 3" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <circle cx="3" cy="3" r="2" fill={c} opacity="0.7"/>
        <path d="M3 8 L8 3" stroke={c} strokeWidth="0.8" opacity="0.5"/>
        <circle cx="3" cy="19" r="1" fill={c} opacity="0.4"/>
        <circle cx="19" cy="3" r="1" fill={c} opacity="0.4"/>
      </svg>
    </div>
  )
}

// ─── Medallón de álbum ───────────────────────────────────────────────────────
function AlbumMedallion({ src }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Anillo exterior pulsante */}
      <div style={{
        position: 'absolute', inset: -5,
        borderRadius: '50%',
        border: '1px solid rgba(201,168,76,0.4)',
        animation: 'tb-outer-ring 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      {/* Segundo anillo */}
      <div style={{
        position: 'absolute', inset: -10,
        borderRadius: '50%',
        border: '0.5px solid rgba(201,168,76,0.1)',
        pointerEvents: 'none',
      }} />
      {/* Foto */}
      <motion.div
        key={src}
        initial={{ scale: 0.65, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        style={{
          width: 58, height: 58, borderRadius: '50%', overflow: 'hidden',
          border: '2px solid rgba(201,168,76,0.7)',
          boxShadow: '0 0 22px rgba(201,168,76,0.5), 0 2px 14px rgba(0,0,0,0.6)',
          background: '#2a1a08', position: 'relative',
        }}
      >
        {src
          ? <img src={src} alt="Album" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
        }
        {/* Reflejo */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.2), transparent 55%)', pointerEvents: 'none' }} />
      </motion.div>
    </div>
  )
}

// ─── Nombre + artista ────────────────────────────────────────────────────────
function TrackInfo({ name, artist, trackId }) {
  return (
    <div style={{ minWidth: 0, flex: 1 }}>
      <motion.p
        key={`n-${trackId}`}
        initial={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.06, type: 'spring', stiffness: 300, damping: 28 }}
        style={{ fontSize: 13, fontWeight: 700, color: '#F0C040', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 0 14px rgba(240,192,64,0.5)', letterSpacing: '0.01em' }}
      >{name}</motion.p>
      <motion.p
        key={`a-${trackId}`}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.13, type: 'spring', stiffness: 280 }}
        style={{ fontSize: 11, color: 'rgba(245,230,200,0.52)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2, letterSpacing: '0.02em' }}
      >{artist}</motion.p>
    </div>
  )
}


// ─── Mini controles de aleatorio y loop ──────────────────────────────────────
function ModeButtons() {
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off') // 'off' | 'context' | 'track'

  useEffect(() => {
    // Sincronizar estado inicial con el store (via fetchPlayerState del renderer)
    const sync = async () => {
      try {
        const token = await window.electronAPI?.getValidToken?.()
        if (!token) return
        const res = await fetch('https://api.spotify.com/v1/me/player', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const data = await res.json()
        setShuffle(!!data.shuffle_state)
        setRepeat(data.repeat_state || 'off')
      } catch {}
    }
    sync()
  }, [])

  const toggleShuffle = async () => {
    const next = !shuffle
    setShuffle(next)
    try {
      const token = await window.electronAPI?.getValidToken?.()
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${next}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      })
    } catch {}
  }

  const cycleRepeat = async () => {
    const next = repeat === 'off' ? 'context' : repeat === 'context' ? 'track' : 'off'
    setRepeat(next)
    try {
      const token = await window.electronAPI?.getValidToken?.()
      await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${next}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      })
    } catch {}
  }

  const btn = (active, onClick, label, title) => (
    <motion.button onClick={onClick} title={title}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px',
        borderRadius: 6, fontSize: 10,
        color: active ? '#F0C040' : 'rgba(245,230,200,0.28)',
        transition: 'color 0.18s',
        display: 'flex', alignItems: 'center', gap: 2,
      }}
      whileHover={{ color: active ? '#FFD700' : 'rgba(245,230,200,0.7)' }}
      whileTap={{ scale: 0.85 }}
    >
      {active && <span style={{ width:4, height:4, borderRadius:'50%', background:'#F0C040', display:'inline-block', boxShadow:'0 0 6px #F0C040', flexShrink:0 }} />}
      {label}
    </motion.button>
  )

  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {btn(shuffle, toggleShuffle, '⇀⇁', 'Aleatorio')}
      {btn(repeat !== 'off', cycleRepeat,
        repeat === 'track' ? '↻¹' : '↻',
        repeat === 'off' ? 'Sin repetir' : repeat === 'context' ? 'Repitiendo playlist' : 'Repitiendo canción'
      )}
    </div>
  )
}

// ─── Panel expandible (cola + búsqueda rápida) ───────────────────────────────
function ExpandedPanel({ onPlayUri, onAddToQueue }) {
  const [queue, setQueue] = useState(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120)
    // Cargar cola actual
    window.electronAPI?.getQueue?.().then(res => {
      const items = res?.queue ?? []
      setQueue(items.slice(0, 8).map(i => ({
        uri: i.uri, name: i.name,
        artist: i.artists?.map(a => a.name).join(', ') || '',
        albumArt: i.album?.images?.[1]?.url || i.album?.images?.[0]?.url || '',
      })))
    }).catch(() => setQueue([]))
    return () => clearTimeout(timerRef.current)
  }, [])

  // Búsqueda con debounce vía IPC
  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!search.trim()) { setSearchResults(null); return }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await window.electronAPI?.searchTracks?.(search.trim())
        const items = res?.tracks?.items ?? []
        setSearchResults(items.slice(0, 6).map(i => ({
          uri: i.uri, name: i.name,
          artist: i.artists?.map(a => a.name).join(', ') || '',
          albumArt: i.album?.images?.[1]?.url || i.album?.images?.[0]?.url || '',
        })))
      } catch { setSearchResults([]) }
      setSearching(false)
    }, 380)
  }, [search])

  const showQueue = !search.trim()
  const items = showQueue ? (queue || []) : (searchResults || [])

  return (
    <div style={{
      flex: 1, overflow: 'hidden',
      background: 'linear-gradient(160deg, #0d0720 0%, #0b0b1e 100%)',
      borderRadius: '14px 14px 0 0',
      borderBottom: '1px solid rgba(201,168,76,0.12)',
      display: 'flex', flexDirection: 'column',
      padding: '8px 8px 4px',
    }}>
      {/* Buscador rápido */}
      <div style={{ position: 'relative', marginBottom: 6, flexShrink: 0 }}>
        <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'rgba(201,168,76,0.45)', pointerEvents: 'none' }}>🔍</span>
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar canción..."
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '5px 8px 5px 22px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(201,168,76,0.22)',
            borderRadius: 8, outline: 'none',
            fontSize: 11, color: 'rgba(245,230,200,0.9)',
            fontFamily: 'inherit',
          }}
        />
        {searching && (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 10, height: 10, border: '2px solid rgba(201,168,76,0.2)',
              borderTopColor: '#C9A84C', borderRadius: '50%' }}
          />
        )}
      </div>

      <p style={{ fontSize: 8, color: 'rgba(201,168,76,0.38)', letterSpacing: 1, marginBottom: 3, flexShrink: 0 }}>
        {showQueue ? 'SIGUIENTE EN COLA' : 'RESULTADOS'}
      </p>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {showQueue && queue === null && (
          <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(245,230,200,0.25)', padding: '10px 0' }}>Cargando cola...</p>
        )}
        {showQueue && queue !== null && queue.length === 0 && (
          <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(245,230,200,0.25)', padding: '10px 0' }}>Cola vacía</p>
        )}
        {!showQueue && !searching && searchResults?.length === 0 && (
          <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(245,230,200,0.25)', padding: '10px 0' }}>Sin resultados</p>
        )}
        {items.map((t, i) => (
          <div key={t.uri + i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px', borderRadius: 7 }}>
            {t.albumArt
              ? <img src={t.albumArt} alt="" style={{ width: 26, height: 26, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 26, height: 26, borderRadius: 4, background: 'rgba(201,168,76,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🎵</div>
            }
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 10, color: '#F5E6C8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
              <p style={{ fontSize: 9, color: 'rgba(245,230,200,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.artist}</p>
            </div>
            {/* Acciones: reproducir + agregar a cola */}
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              <motion.button onClick={() => onAddToQueue(t.uri)} title="Añadir a cola"
                style={{ background: 'none', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 5, cursor: 'pointer',
                  color: 'rgba(201,168,76,0.5)', fontSize: 9, padding: '2px 5px', lineHeight: 1 }}
                whileHover={{ color: '#F0C040', borderColor: 'rgba(201,168,76,0.6)', background: 'rgba(201,168,76,0.08)' }}
                whileTap={{ scale: 0.85 }}
              >+cola</motion.button>
              <motion.button onClick={() => onPlayUri(t.uri)} title="Reproducir ahora"
                style={{ background: 'none', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 5, cursor: 'pointer',
                  color: 'rgba(201,168,76,0.5)', fontSize: 9, padding: '2px 5px', lineHeight: 1 }}
                whileHover={{ color: '#F0C040', borderColor: 'rgba(201,168,76,0.6)', background: 'rgba(201,168,76,0.08)' }}
                whileTap={{ scale: 0.85 }}
              >▶</motion.button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function HogwartsNotification({ track, isVisible, onClose, onExitComplete }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpand = useCallback(() => {
    const next = !isExpanded
    setIsExpanded(next)
    window.electronAPI?.resizeNotification?.(next)
    if (!next) {
      // Al colapsar, reanudar el timer si estaba corriendo
      window.electronAPI?.resumeNotificationTimer?.()
    } else {
      // Al expandir, detener el timer para que no se oculte
      window.electronAPI?.resetNotificationTimer?.()
    }
  }, [isExpanded])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    window.electronAPI?.resetNotificationTimer()
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (!isExpanded) window.electronAPI?.resumeNotificationTimer()
  }, [isExpanded])

  const handlePlayUri = useCallback(async (uri) => {
    try { await window.electronAPI?.playTrack?.(uri) } catch {}
  }, [])

  const handleAddToQueue = useCallback(async (uri) => {
    try { await window.electronAPI?.addToQueue?.(uri) } catch {}
  }, [])


  const cardVariants = {
    initial: { y: 55, x: 8, opacity: 0, scale: 0.8, filter: 'blur(10px)', rotateX: 12 },
    animate: {
      y: 0, x: 0, opacity: 1, scale: 1, filter: 'blur(0px)', rotateX: 0,
      transition: { type: 'spring', stiffness: 270, damping: 25, mass: 0.85, filter: { duration: 0.4 } },
    },
    exit: {
      y: 35, x: 15, opacity: 0, scale: 0.85, filter: 'blur(8px)',
      transition: { duration: 0.4, ease: [0.4, 0, 0.6, 1] },
    },
  }

  const borderColor = isHovered ? 'rgba(240,192,64,0.95)' : 'rgba(201,168,76,0.5)'
  const glowStyle   = isHovered ? { animation: 'tb-hover-glow 1.6s ease-in-out infinite' } : { boxShadow: '0 0 0 1px rgba(201,168,76,0.06) inset, 0 6px 36px rgba(0,0,0,0.75), 0 0 22px rgba(201,168,76,0.14)' }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div
        style={{ width: '100%', height: '100%', background: 'transparent', overflow: 'hidden', perspective: 900 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
          {isVisible && track && (
            <motion.div
              key={track.id}
              variants={cardVariants}
              initial="initial" animate="animate" exit="exit"
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              {/* Panel expandido — encima, en flujo normal */}
              <AnimatePresence>
                {isExpanded && (
                  <ExpandedPanel
                    onPlayUri={handlePlayUri}
                    onAddToQueue={handleAddToQueue}
                  />
                )}
              </AnimatePresence>

              {/* ── Card principal — siempre 160px al fondo ── */}
              <div style={{
                width: '100%', height: 160, flexShrink: 0,
                position: 'relative', overflow: 'hidden', borderRadius: 14,
                background: `
                  radial-gradient(ellipse at 5% 0%,   rgba(201,168,76,0.18) 0%, transparent 50%),
                  radial-gradient(ellipse at 95% 100%, rgba(116,0,1,0.28)   0%, transparent 50%),
                  radial-gradient(ellipse at 50% 50%, rgba(30,15,55,0.4)    0%, transparent 70%),
                  linear-gradient(148deg, #1c1008 0%, #14112a 52%, #0b0b1e 100%)
                `,
                border: `1.5px solid ${borderColor}`,
                transition: 'border-color 0.3s ease',
                ...glowStyle,
              }}>

                {/* Partículas / chispas mágicas */}
                {SPARKS.map(s => <Spark key={s.id} s={s} />)}

                {/* Estrellas del cielo */}
                {STARS.map(s => (
                  <div key={s.id} style={{
                    position: 'absolute', top: `${s.t}%`, left: `${s.l}%`,
                    width: s.sz, height: s.sz, borderRadius: '50%',
                    background: '#FFD700', pointerEvents: 'none',
                    boxShadow: `0 0 ${s.sz * 2}px #FFD700`,
                    animation: `tb-star-pulse ${s.dr}s ${s.d}s ease-in-out infinite`,
                  }} />
                ))}

                {/* Runas de fondo — muy sutiles */}
                {RUNE_POSITIONS.map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', fontSize: 10, color: '#C9A84C',
                    pointerEvents: 'none', fontFamily: 'serif',
                    animation: `tb-rune-fade ${2.5 + i * 0.4}s ${i * 0.3}s ease-in-out infinite`,
                    ...pos,
                  }}>
                    {RUNES[i % RUNES.length]}
                  </div>
                ))}

                {/* Velas */}
                {CANDLES.map((c, i) => <Candle key={i} style={c} />)}

                {/* Esquinas ornamentales */}
                <Corner pos={{ top: 4, left: 4 }}    rotate="0deg"    isHovered={isHovered} />
                <Corner pos={{ top: 4, right: 4 }}   rotate="90deg"   isHovered={isHovered} />
                <Corner pos={{ bottom: 4, left: 4 }} rotate="-90deg"  isHovered={isHovered} />
                <Corner pos={{ bottom: 4, right: 4 }} rotate="180deg" isHovered={isHovered} />

                {/* Línea superior dorada */}
                <div style={{
                  position: 'absolute', top: 0, left: 18, right: 18, height: 1,
                  background: isHovered
                    ? 'linear-gradient(90deg, transparent, rgba(240,192,64,0.9), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)',
                  transition: 'background 0.3s',
                }} />

                {/* Línea inferior dorada */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 26, right: 26, height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)',
                }} />

                {/* Símbolo HP arriba al centro */}
                <motion.div
                  animate={{ opacity: isHovered ? [0.6, 1, 0.6] : [0.2, 0.45, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#C9A84C', letterSpacing: 5, pointerEvents: 'none', fontFamily: 'serif' }}
                >✦ ⚡ ✦</motion.div>

                {/* Relámpago decorativo (parpadea raramente) */}
                <div style={{
                  position: 'absolute', top: '18%', right: '8%', fontSize: 11,
                  color: '#FFD700', pointerEvents: 'none', opacity: 0,
                  animation: 'tb-lightning 8s 2s ease-in-out infinite',
                  textShadow: '0 0 8px #FFD700',
                }}>⚡</div>

                {/* Shimmer sweep al entrar */}
                <motion.div
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 0 }}
                  transition={{ delay: 0.05, duration: 0.75 }}
                  style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 18, borderRadius: 14, overflow: 'hidden' }}
                >
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, width: '35%',
                    background: 'linear-gradient(90deg, transparent, rgba(240,192,64,0.18), transparent)',
                    animation: 'tb-shimmer-sweep 0.75s 0.05s ease-out forwards',
                  }} />
                </motion.div>

                {/* Shimmer de hover continuo en el borde */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none', zIndex: 22,
                      border: '1px solid rgba(240,192,64,0.4)',
                      boxShadow: 'inset 0 0 24px rgba(201,168,76,0.08)',
                    }}
                  />
                )}

                {/* ── Castillo de Hogwarts decorativo ── */}
                <div style={{
                  position: 'absolute', top: 10, right: 20, zIndex: 5,
                  pointerEvents: 'none', opacity: 0.7,
                }}>
                  <MiniCastle width={88} opacity={0.28} />
                </div>

                {/* ── Layout interior ── */}
                <div style={{
                  position: 'relative', zIndex: 12,
                  display: 'flex', alignItems: 'center',
                  padding: '11px 13px 10px',
                  gap: 12, height: '100%',
                }}>
                  <AlbumMedallion src={track.albumArt} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                      <TrackInfo name={track.name} artist={track.artist} trackId={track.id} />
                      {/* Botón cerrar */}
                      <motion.button
                        onClick={onClose} className="no-drag"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,230,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4, marginLeft: 6, flexShrink: 0 }}
                        whileHover={{ color: 'rgba(245,230,200,0.9)', backgroundColor: 'rgba(255,255,255,0.07)', scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                      >
                        <IconClose size={11} />
                      </motion.button>
                    </div>

                    <ProgressBar variant="wand" className="mb-2" />

                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22 }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <PlayerControls size="sm" />
                        <ModeButtons />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <VolumeSlider />
                        {/* Botón expandir/colapsar — visible al hacer hover */}
                        {/* <AnimatePresence>
                          {isHovered && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              onClick={toggleExpand}
                              title={isExpanded ? 'Colapsar' : 'Ver cola y buscar'}
                              style={{
                                background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
                                borderRadius: 6, cursor: 'pointer', padding: '3px 7px',
                                color: isExpanded ? '#F0C040' : 'rgba(245,230,200,0.5)',
                                fontSize: 11, lineHeight: 1, transition: 'all 0.15s',
                              }}
                              whileHover={{ color: '#F0C040', borderColor: 'rgba(201,168,76,0.7)', background: 'rgba(201,168,76,0.15)' }}
                              whileTap={{ scale: 0.85 }}
                            >
                              {isExpanded ? '▼' : '▲'}
                            </motion.button>
                          )}
                        </AnimatePresence> */}
                      </div>
                    </motion.div>
                  </div>

              </div>

            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
