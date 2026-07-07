import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PlayerControls from '../../components/PlayerControls'
import ProgressBar from '../../components/ProgressBar'
import VolumeSlider from '../../components/VolumeSlider'
import { IconClose, IconShuffle, IconRepeatContext, IconRepeatOne, IconQueueAdd, IconCheck } from '../../components/Icons'
import useAppStore from '../../store/useAppStore'
import { useSpotifyControls } from '../../components/useSpotifyControls'
import { useSpotifySearch } from '../../hooks/useSpotifySearch'
import { Mascot } from './Background'
import {
  fetchPlayerState, setShuffle as apiSetShuffle, setRepeat as apiSetRepeat,
  fetchQueue, addToQueue as apiAddToQueue, fetchSavedTracks,
} from '../../lib/spotifyAPI'


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
@keyframes hw-sonar-ring {
  0%   { transform: scale(0.9); opacity: 0.5; }
  70%  { opacity: 0; }
  100% { transform: scale(2.3); opacity: 0; }
}
@keyframes hw-bat-fly-card {
  0%   { transform: translateX(-22px) translateY(0px); opacity: 0; }
  10%  { opacity: 0.5; }
  90%  { opacity: 0.45; }
  100% { transform: translateX(calc(100% + 22px)) translateY(-14px); opacity: 0; }
}
@keyframes hw-bat-flap-card {
  0%,100% { transform: scaleY(1); }
  50%     { transform: scaleY(0.5); }
}
@keyframes hw-shimmer-loop {
  0%   { transform: translateX(-140%) skewX(-14deg); opacity: 0; }
  8%   { opacity: 0.45; }
  35%  { opacity: 0.45; }
  50%  { transform: translateX(340%) skewX(-14deg); opacity: 0; }
  100% { transform: translateX(340%) skewX(-14deg); opacity: 0; }
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
// Ahora usa el <Mascot /> interactivo de Background.jsx — clickearlo lanza
// un hechizo (temblor + brillo + chispas doradas), igual que en el sidebar
// y el selector de temas.
function MiniCastle({ opacity = 0.18, width = 90 }) {
  return <Mascot width={width} opacity={1} />
}

// Murciélago miniatura cruzando la tarjeta de notificación
function BatMini({ top, dur, delay, scale = 1 }) {
  return (
    <div style={{
      position: 'absolute', top, left: 0, zIndex: 1, pointerEvents: 'none',
      animation: `hw-bat-fly-card ${dur}s ${delay}s linear infinite`,
      transform: `scale(${scale})`,
    }}>
      <svg width="18" height="10" viewBox="0 0 22 12" style={{ animation: 'hw-bat-flap-card 0.4s ease-in-out infinite' }}>
        <path d="M11 6 C8 0, 2 0, 0 4 C4 4, 7 5, 9 7 C7 5, 5 8, 2 9 C6 9, 9 8, 11 6 Z" fill="rgba(20,10,25,0.75)" />
        <path d="M11 6 C14 0, 20 0, 22 4 C18 4, 15 5, 13 7 C15 5, 17 8, 20 9 C16 9, 13 8, 11 6 Z" fill="rgba(20,10,25,0.75)" />
      </svg>
    </div>
  )
}

// Anillo de "sonar" mágico — pulsa desde el medallón, como una onda de eco
function SonarRing() {
  return (
    <div style={{
      position: 'absolute', inset: -5, borderRadius: '50%',
      border: '1.5px solid rgba(240,192,64,0.55)',
      pointerEvents: 'none',
      animation: 'hw-sonar-ring 3.2s ease-out infinite',
    }} />
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
      <SonarRing />
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
// Usa el mismo store y las mismas funciones de API que el reproductor en grande
// (PlaybackModeControls en Settings.jsx) para que ambos queden siempre sincronizados.
function ModeButtons() {
  const { shuffle, setShuffle, repeatMode: repeat, setRepeatMode: setRepeat } = useAppStore()

  useEffect(() => {
    fetchPlayerState().then(s => { if (s) { setShuffle(s.shuffle); setRepeat(s.repeat) } })
    // Sincronización instantánea si el cambio viene de la ventana principal
    window.electronAPI?.onPlaybackModeChanged?.((data) => {
      if (data?.shuffle !== undefined) setShuffle(data.shuffle)
      if (data?.repeat  !== undefined) setRepeat(data.repeat)
    })
    return () => window.electronAPI?.removeAllListeners?.('playback-mode-changed')
  }, [])

  const toggleShuffle = async () => {
    const n = !shuffle
    setShuffle(n); await apiSetShuffle(n)
    window.electronAPI?.broadcastPlaybackMode?.({ shuffle: n })
  }

  const cycleRepeat = async () => {
    const n = repeat === 'off' ? 'context' : repeat === 'context' ? 'track' : 'off'
    setRepeat(n); await apiSetRepeat(n)
    window.electronAPI?.broadcastPlaybackMode?.({ repeat: n })
  }

  const btn = (active, onClick, children, title) => (
    <motion.button onClick={onClick} title={title}
      style={{
        background: active ? 'rgba(201,168,76,0.12)' : 'none',
        border: `1px solid ${active ? 'rgba(201,168,76,0.4)' : 'transparent'}`,
        cursor: 'pointer', padding: '4px 5px',
        borderRadius: 6,
        color: active ? '#F0C040' : 'rgba(245,230,200,0.28)',
        transition: 'all 0.18s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active ? '0 0 8px rgba(201,168,76,0.18)' : 'none',
      }}
      whileHover={{ color: active ? '#FFD700' : 'rgba(245,230,200,0.7)' }}
      whileTap={{ scale: 0.85 }}
    >
      {children}
    </motion.button>
  )

  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {btn(shuffle, toggleShuffle, <IconShuffle size={12} />, 'Aleatorio')}
      {btn(repeat !== 'off', cycleRepeat,
        repeat === 'track' ? <IconRepeatOne size={12} /> : <IconRepeatContext size={12} />,
        repeat === 'off' ? 'Sin repetir' : repeat === 'context' ? 'Repitiendo playlist' : 'Repitiendo canción'
      )}
    </div>
  )
}

// ─── Cache de "Me gusta" para esta ventana (se carga una sola vez, bajo demanda) ──
// La ventana de notificación es un renderer aparte del principal, así que no comparte
// el store de Zustand ni el cache de canciones guardadas — mantenemos uno propio aquí,
// a nivel de módulo, para que sobreviva a que el panel se colapse/expanda.
// Se limita a las primeras ~300 canciones (en vez de la biblioteca completa) y sólo
// se dispara la primera vez que el usuario escribe algo — traer TODA la biblioteca
// de golpe podía saturar la API de Spotify con decenas de requests seguidos y hacer
// fallar (o retrasar mucho) la búsqueda y otras llamadas que se hacían al mismo tiempo.
let likedCache = null
let likedCachePromise = null
function ensureLikedCache(maxTracks = 300) {
  if (likedCache) return Promise.resolve(likedCache)
  if (!likedCachePromise) {
    likedCachePromise = (async () => {
      const all = []
      let offset = 0
      while (all.length < maxTracks) {
        let res
        try { res = await fetchSavedTracks(offset) } catch { break }
        if (!res?.items?.length) break
        all.push(...res.items.filter(i => i.track).map(i => ({
          uri: i.track.uri, name: i.track.name,
          artist: i.track.artists.map(a => a.name).join(', '),
          albumArt: i.track.album?.images?.[1]?.url || i.track.album?.images?.[0]?.url || '',
        })))
        offset += res.items.length
        if (res.items.length < 50) break
      }
      likedCache = all
      return likedCache
    })()
  }
  return likedCachePromise
}

const matchesQuery = (t, q) =>
  t.name?.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q)

// ─── Fila de resultado — clickear la fila reproduce, el botón sólo encola ────
// Si la fila viene de la cola (track.queueIndex definido) y se pasa onPlayQueueIndex,
// clickearla ADELANTA la cola actual hasta ese punto en vez de reemplazar la
// reproducción por esa canción sola.
function NotifResultRow({ track, badge, onPlay, onAddToQueue, onPlayQueueIndex }) {
  const [queued, setQueued] = useState(false)
  const addQ = (e) => {
    e.stopPropagation()
    onAddToQueue(track.uri)
    setQueued(true)
    setTimeout(() => setQueued(false), 1500)
  }
  const handleRowClick = () => {
    if (onPlayQueueIndex && track.queueIndex !== undefined) onPlayQueueIndex(track.queueIndex)
    else onPlay(track.uri)
  }
  return (
    <motion.div
      onClick={handleRowClick}
      whileHover={{ backgroundColor: 'rgba(201,168,76,0.09)' }}
      whileTap={{ scale: 0.99 }}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px', borderRadius: 7, cursor: 'pointer' }}
    >
      {track.albumArt
        ? <img src={track.albumArt} alt="" style={{ width: 26, height: 26, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: 26, height: 26, borderRadius: 4, background: 'rgba(201,168,76,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🎵</div>
      }
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 10, color: '#F5E6C8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</p>
        <p style={{ fontSize: 9, color: 'rgba(245,230,200,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</p>
      </div>
      {badge && (
        <span style={{ fontSize: 7, color: '#F0C040', background: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.3)', borderRadius: 4, padding: '1px 4px', flexShrink: 0,
        }}>{badge}</span>
      )}
      {/* Acción: sólo agregar a cola — la fila entera reproduce */}
      <motion.button onClick={addQ} title="Añadir a cola"
        style={{ background: queued ? 'rgba(74,222,128,0.12)' : 'none',
          border: `1px solid ${queued ? 'rgba(74,222,128,0.4)' : 'rgba(201,168,76,0.2)'}`, borderRadius: 5, cursor: 'pointer',
          color: queued ? '#4ade80' : 'rgba(201,168,76,0.5)', fontSize: 9, padding: '2px 5px', lineHeight: 1, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 2,
        }}
        whileHover={{ color: queued ? '#4ade80' : '#F0C040', borderColor: queued ? 'rgba(74,222,128,0.4)' : 'rgba(201,168,76,0.6)', background: queued ? 'rgba(74,222,128,0.12)' : 'rgba(201,168,76,0.08)' }}
        whileTap={{ scale: 0.85 }}
      >
        {queued ? <IconCheck size={9} /> : <IconQueueAdd size={9} />}
      </motion.button>
    </motion.div>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 8, color: 'rgba(201,168,76,0.38)', letterSpacing: 1, margin: '6px 0 3px', flexShrink: 0 }}>
      {children}
    </p>
  )
}

// ─── Panel expandible (cola + búsqueda rápida) ───────────────────────────────
// Misma jerarquía que el buscador global de la ventana principal, pero con un
// nivel extra: 1) coincidencias en la cola actual, 2) coincidencias en "Me gusta",
// 3) resto de resultados de todo Spotify.
function ExpandedPanel({ onPlayUri, onAddToQueue, onPlayQueueIndex }) {
  const [queueFull, setQueueFull] = useState(null)
  const [search, setSearch] = useState('')
  const [likedReady, setLikedReady] = useState(!!likedCache)
  const inputRef = useRef(null)

  // Búsqueda en Spotify — mismo hook compartido que usa el buscador de
  // Settings (GlobalSearch), para que ambos se comporten idénticamente en
  // vez de tener cada uno su propia reimplementación que puede divergir.
  const { results: spotifyResults, loading: searching, error: searchError } = useSpotifySearch(search, { limit: 12 })

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120)
    // Cola actual (misma vía renderer que usa el reproductor grande)
    fetchQueue().then(res => {
      const items = res?.queue ?? []
      setQueueFull(items.map((i, idx) => ({
        uri: i.uri, name: i.name,
        artist: i.artists?.map(a => a.name).join(', ') || '',
        albumArt: i.album?.images?.[1]?.url || i.album?.images?.[0]?.url || '',
        queueIndex: idx, // posición real en la cola (0 = la próxima)
      })))
    }).catch(() => setQueueFull([]))
    // "Me gusta" — se precarga una sola vez por sesión, queda en cache
    ensureLikedCache().then(() => setLikedReady(true))
  }, [])

  const q = search.trim().toLowerCase()
  const isSearching = !!q

  // 1º cola, 2º me gusta, 3º todo Spotify (excluyendo lo ya mostrado arriba)
  const queueMatches = isSearching && queueFull
    ? queueFull.filter(t => matchesQuery(t, q)).slice(0, 3)
    : []
  const likedMatches = isSearching && likedReady
    ? likedCache.filter(t => matchesQuery(t, q)).slice(0, 3)
    : []
  const shownUris = new Set([...queueMatches, ...likedMatches].map(t => t.uri))
  const spotifyOnly = isSearching ? spotifyResults.filter(t => !shownUris.has(t.uri)) : []

  const queuePreview = (queueFull || []).slice(0, 8)
  const noResults = isSearching && !searching && !searchError && queueMatches.length === 0 && likedMatches.length === 0 && spotifyOnly.length === 0

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
      <div style={{ position: 'relative', marginBottom: 4, flexShrink: 0 }}>
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

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!isSearching && (
          <>
            <SectionLabel>SIGUIENTE EN COLA</SectionLabel>
            {queueFull === null && (
              <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(245,230,200,0.25)', padding: '10px 0' }}>Cargando cola...</p>
            )}
            {queueFull !== null && queuePreview.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(245,230,200,0.25)', padding: '10px 0' }}>Cola vacía</p>
            )}
            {queuePreview.map((t, i) => (
              <NotifResultRow key={t.uri + i} track={t} onPlay={onPlayUri} onAddToQueue={onAddToQueue} onPlayQueueIndex={onPlayQueueIndex} />
            ))}
          </>
        )}

        {isSearching && (
          <>
            {queueMatches.length > 0 && (
              <>
                <SectionLabel>EN COLA</SectionLabel>
                {queueMatches.map((t, i) => <NotifResultRow key={'q'+t.uri+i} track={t} badge="▶" onPlay={onPlayUri} onAddToQueue={onAddToQueue} onPlayQueueIndex={onPlayQueueIndex} />)}
              </>
            )}
            {likedMatches.length > 0 && (
              <>
                <SectionLabel>TUS ME GUSTA</SectionLabel>
                {likedMatches.map((t, i) => <NotifResultRow key={'l'+t.uri+i} track={t} badge="♥" onPlay={onPlayUri} onAddToQueue={onAddToQueue} />)}
              </>
            )}
            {(searching || spotifyOnly.length > 0 || searchError) && (
              <>
                <SectionLabel>EN SPOTIFY</SectionLabel>
                {searching && spotifyOnly.length === 0 && (
                  <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(245,230,200,0.25)', padding: '6px 0' }}>Buscando...</p>
                )}
                {!searching && searchError && (
                  <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(248,113,113,0.8)', padding: '6px 0' }}>⚠ No se pudo conectar con Spotify</p>
                )}
                {spotifyOnly.map((t, i) => <NotifResultRow key={'s'+t.uri+i} track={t} onPlay={onPlayUri} onAddToQueue={onAddToQueue} />)}
              </>
            )}
            {noResults && (
              <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(245,230,200,0.25)', padding: '10px 0' }}>Sin resultados</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function HogwartsNotification({ track, isVisible, onClose, onExitComplete }) {
  const { playUri, playQueueIndex } = useSpotifyControls()
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpand = useCallback(() => {
    if (isExpanded) {
      // Al colapsar: primero se anima la salida del panel (ver AnimatePresence
      // más abajo); la ventana sólo se encoge cuando esa animación termina
      // (handlePanelExitComplete), para que no se corte de golpe.
      setIsExpanded(false)
      window.electronAPI?.resumeNotificationTimer?.()
    } else {
      setIsExpanded(true)
      window.electronAPI?.resizeNotification?.(true)
      window.electronAPI?.resetNotificationTimer?.()
    }
  }, [isExpanded])

  // Se dispara cuando termina la animación de salida del panel expandido
  const handlePanelExitComplete = useCallback(() => {
    window.electronAPI?.resizeNotification?.(false)
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    window.electronAPI?.resetNotificationTimer()
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (!isExpanded) window.electronAPI?.resumeNotificationTimer()
  }, [isExpanded])

  // Reproducir/encolar vía fetch directo del renderer (igual que el reproductor grande y
  // el buscador principal) — la vía anterior (IPC al proceso main) fallaba silenciosamente
  // para reproducir un track específico, aunque funcionaba para encolar.
  const handlePlayUri = useCallback(async (uri) => {
    try { await playUri(uri) } catch {}
  }, [playUri])

  const handleAddToQueue = useCallback(async (uri) => {
    try { await apiAddToQueue(uri) } catch {}
  }, [])

  // Tocar una canción DESDE LA COLA adelanta la cola actual hasta ese punto,
  // en vez de reemplazarla por esa canción sola.
  const handlePlayQueueIndex = useCallback(async (index) => {
    try { await playQueueIndex(index) } catch {}
  }, [playQueueIndex])


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
              {/* Panel expandido — encima, en flujo normal. Anima su alto/opacidad
                  en vez de aparecer/desaparecer de golpe. */}
              <AnimatePresence onExitComplete={handlePanelExitComplete}>
                {isExpanded && (
                  <motion.div
                    key="expanded-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 210, opacity: 1, transition: { height: { type: 'spring', stiffness: 260, damping: 28 }, opacity: { duration: 0.25, delay: 0.05 } } }}
                    exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.22, ease: [0.4, 0, 0.6, 1] }, opacity: { duration: 0.12 } } }}
                    style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}
                  >
                    <ExpandedPanel
                      onPlayUri={handlePlayUri}
                      onAddToQueue={handleAddToQueue}
                      onPlayQueueIndex={handlePlayQueueIndex}
                    />
                  </motion.div>
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

                {/* Murciélagos cruzando la tarjeta */}
                <BatMini top="24%" dur={10} delay={1}  scale={0.75} />
                <BatMini top="66%" dur={13} delay={5}  scale={0.6}  />

                {/* Brillo de vidrio recorriendo la tarjeta en loop, sutil */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, width: '30%', zIndex: 1, pointerEvents: 'none',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)',
                  animation: 'hw-shimmer-loop 7.5s ease-in-out infinite',
                }} />

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

                {/* Botón expandir/colapsar — esquina superior de la tarjeta.
                    Siempre montado (el espacio ya está reservado) para que nada
                    se mueva al aparecer/desaparecer; sólo cambia su opacidad. */}
                <motion.button
                  onClick={toggleExpand} className="no-drag"
                  title={isExpanded ? 'Colapsar' : 'Ver cola y buscar'}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: 'absolute', top: 6, left: 6, zIndex: 30,
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)',
                    borderRadius: 7, cursor: 'pointer', padding: 0,
                    color: isExpanded ? '#F0C040' : 'rgba(245,230,200,0.6)',
                    pointerEvents: isHovered ? 'auto' : 'none',
                  }}
                  whileHover={{ color: '#F0C040', borderColor: 'rgba(201,168,76,0.7)', background: 'rgba(201,168,76,0.2)', scale: 1.08 }}
                  whileTap={{ scale: 0.85 }}
                >
                  <motion.span
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    style={{ fontSize: 11, lineHeight: 1, display: 'inline-block' }}
                  >▲</motion.span>
                </motion.button>

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

                {/* ── Castillo de Hogwarts decorativo — clickeable, lanza un hechizo ── */}
                <div className="no-drag" style={{
                  position: 'absolute', top: 10, right: 20, zIndex: 25,
                  pointerEvents: 'auto', opacity: 0.7,
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
