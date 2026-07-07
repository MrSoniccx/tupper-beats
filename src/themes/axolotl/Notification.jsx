// Notification.jsx — Tarjeta de notificación del tema Axolote
// Misma lógica/props/funciones que themes/hogwarts/Notification.jsx (mismo
// contrato: track, isVisible, onClose, onExitComplete) — sólo cambia el diseño:
// burbujas y corazones en vez de chispas y runas, ajolote en vez de castillo,
// paleta rosa/lavanda vía variables CSS en vez de dorado/granate fijos.
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
@keyframes ax-bob {
  0%,100% { transform: translateY(0) rotate(0deg); opacity:.85; }
  50%     { transform: translateY(-3px) rotate(3deg); opacity:1; }
}
@keyframes ax-bubble-pop {
  0%   { transform: translateY(0) translateX(0) scale(0.3); opacity:0; }
  8%   { opacity: 1; }
  80%  { opacity: 0.6; }
  100% { transform: translateY(-130px) translateX(var(--sx,0px)) scale(1.1); opacity:0; }
}
@keyframes ax-sparkle-pulse {
  0%,100% { opacity: 0.15; transform: scale(1); }
  50%     { opacity: 0.8; transform: scale(1.5); }
}
@keyframes ax-heart-fade {
  0%,100% { opacity: 0.08; }
  50%     { opacity: 0.28; }
}
@keyframes ax-outer-ring {
  0%,100% { box-shadow: 0 0 0 0 rgba(var(--tb-primary-rgb),0.35), 0 0 12px rgba(var(--tb-primary-rgb),0.15); }
  50%     { box-shadow: 0 0 0 4px rgba(var(--tb-primary-rgb),0.12), 0 0 20px rgba(var(--tb-primary-rgb),0.25); }
}
@keyframes ax-hover-glow {
  0%,100% { box-shadow: 0 0 0 2px rgba(var(--tb-accent-rgb),0.7), 0 0 24px rgba(var(--tb-primary-rgb),0.4), 0 6px 40px rgba(0,0,0,0.55); }
  50%     { box-shadow: 0 0 0 2.5px rgba(var(--tb-accent-rgb),1),   0 0 38px rgba(var(--tb-primary-rgb),0.7), 0 6px 40px rgba(0,0,0,0.55); }
}
@keyframes ax-shimmer-sweep {
  0%   { transform: translateX(-120%) skewX(-14deg); }
  100% { transform: translateX(500%)  skewX(-14deg); }
}
@keyframes ax-twinkle {
  0%,90%,100% { opacity: 0; }
  92%         { opacity: 0.8; }
  94%         { opacity: 0; }
  96%         { opacity: 0.5; }
}
`

const BUBBLES = [
  { id:0,  l:7,   sz:3, d:0,   dr:4.2, sx:-10 },
  { id:1,  l:17,  sz:2, d:0.6, dr:3.8, sx:14  },
  { id:2,  l:29,  sz:3, d:1.3, dr:5.1, sx:-6  },
  { id:3,  l:41,  sz:2, d:2.0, dr:4.6, sx:9   },
  { id:4,  l:53,  sz:3, d:0.4, dr:3.5, sx:-14 },
  { id:5,  l:65,  sz:2, d:1.7, dr:4.8, sx:7   },
  { id:6,  l:76,  sz:3, d:0.9, dr:4.0, sx:-8  },
  { id:7,  l:87,  sz:2, d:2.4, dr:5.3, sx:16  },
  { id:8,  l:23,  sz:2, d:3.0, dr:3.9, sx:-5  },
  { id:9,  l:59,  sz:3, d:1.1, dr:4.4, sx:11  },
  { id:10, l:34,  sz:2, d:2.7, dr:4.7, sx:-13 },
  { id:11, l:71,  sz:2, d:0.4, dr:5.0, sx:6   },
]

function MiniMascot({ opacity = 0.28, width = 88 }) {
  return <Mascot width={width} opacity={opacity} />
}

function Bubble({ b }) {
  return (
    <div style={{
      position: 'absolute', left: `${b.l}%`, bottom: 2,
      width: b.sz + 2, height: b.sz + 2, borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(255,111,165,0.3) 70%)',
      border: '1px solid rgba(255,255,255,0.4)',
      pointerEvents: 'none',
      animation: `ax-bubble-pop ${b.dr}s ${b.d}s ease-out infinite`,
      '--sx': `${b.sx}px`,
    }} />
  )
}

const SPARKLES = [
  { id:0, t:10, l:12, sz:1.5, d:0,   dr:2.5 },
  { id:1, t:20, l:68, sz:1,   d:0.8, dr:3.2 },
  { id:2, t:42, l:87, sz:1.5, d:1.4, dr:2.8 },
  { id:3, t:62, l:4,  sz:1,   d:0.3, dr:3.6 },
  { id:4, t:78, l:48, sz:1.5, d:2.1, dr:2.3 },
  { id:5, t:32, l:38, sz:1,   d:1.0, dr:4.0 },
  { id:6, t:55, l:75, sz:1.5, d:0.5, dr:3.0 },
  { id:7, t:15, l:55, sz:1,   d:1.8, dr:2.6 },
]

const HEARTS = ['🩷','💗','✨']
const HEART_POSITIONS = [
  { t:'12%', l:'2%' }, { t:'50%', l:'2%' }, { t:'80%', l:'2%' },
  { t:'12%', r:'2%' }, { t:'50%', r:'2%' }, { t:'80%', r:'2%' },
]

function Corner({ pos, rotate = '0deg', isHovered }) {
  const c = isHovered ? 'var(--tb-accent)' : 'var(--tb-primary)'
  const op = isHovered ? 0.9 : 0.5
  return (
    <div style={{ position: 'absolute', width: 20, height: 20, pointerEvents: 'none', opacity: op, transition: 'opacity 0.3s', ...pos }}>
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" style={{ transform: `rotate(${rotate})`, transformOrigin: 'center center' }}>
        <path d="M3 19 Q3 9 11 9 Q19 9 19 3" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="3" cy="19" r="2" fill={c} opacity="0.7"/>
      </svg>
    </div>
  )
}

function AlbumMedallion({ src }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        position: 'absolute', inset: -5, borderRadius: '50%',
        border: '1px solid rgba(var(--tb-primary-rgb),0.4)',
        animation: 'ax-outer-ring 3s ease-in-out infinite', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: -10, borderRadius: '50%',
        border: '0.5px solid rgba(var(--tb-primary-rgb),0.12)', pointerEvents: 'none',
      }} />
      <motion.div
        key={src}
        initial={{ scale: 0.65, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        style={{
          width: 58, height: 58, borderRadius: '50%', overflow: 'hidden',
          border: '2px solid rgba(var(--tb-primary-rgb),0.7)',
          boxShadow: '0 0 22px rgba(var(--tb-primary-rgb),0.45), 0 2px 14px rgba(0,0,0,0.5)',
          background: '#3D1740', position: 'relative',
        }}
      >
        {src
          ? <img src={src} alt="Album" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🩷</div>
        }
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.25), transparent 55%)', pointerEvents: 'none' }} />
      </motion.div>
    </div>
  )
}

function TrackInfo({ name, artist, trackId }) {
  return (
    <div style={{ minWidth: 0, flex: 1 }}>
      <motion.p
        key={`n-${trackId}`}
        initial={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.06, type: 'spring', stiffness: 300, damping: 28 }}
        style={{ fontSize: 13, fontWeight: 700, color: 'var(--tb-accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 0 14px rgba(var(--tb-accent-rgb),0.45)', letterSpacing: '0.01em' }}
      >{name}</motion.p>
      <motion.p
        key={`a-${trackId}`}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.13, type: 'spring', stiffness: 280 }}
        style={{ fontSize: 11, color: 'rgba(var(--tb-textLight-rgb),0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2, letterSpacing: '0.02em' }}
      >{artist}</motion.p>
    </div>
  )
}

function ModeButtons() {
  const { shuffle, setShuffle, repeatMode: repeat, setRepeatMode: setRepeat } = useAppStore()

  useEffect(() => {
    fetchPlayerState().then(s => { if (s) { setShuffle(s.shuffle); setRepeat(s.repeat) } })
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
        background: active ? 'rgba(var(--tb-primary-rgb),0.14)' : 'none',
        border: `1px solid ${active ? 'rgba(var(--tb-primary-rgb),0.4)' : 'transparent'}`,
        cursor: 'pointer', padding: '4px 5px', borderRadius: 6,
        color: active ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.3)',
        transition: 'all 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active ? '0 0 8px rgba(var(--tb-primary-rgb),0.2)' : 'none',
      }}
      whileHover={{ color: active ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.7)' }}
      whileTap={{ scale: 0.85 }}
    >{children}</motion.button>
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
      whileHover={{ backgroundColor: 'rgba(var(--tb-primary-rgb),0.12)' }}
      whileTap={{ scale: 0.99 }}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px', borderRadius: 7, cursor: 'pointer' }}
    >
      {track.albumArt
        ? <img src={track.albumArt} alt="" style={{ width: 26, height: 26, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: 26, height: 26, borderRadius: 4, background: 'rgba(var(--tb-primary-rgb),0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🩷</div>
      }
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 10, color: 'var(--tb-textLight)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</p>
        <p style={{ fontSize: 9, color: 'rgba(var(--tb-textLight-rgb),0.42)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</p>
      </div>
      {badge && (
        <span style={{ fontSize: 7, color: 'var(--tb-accent)', background: 'rgba(var(--tb-primary-rgb),0.15)',
          border: '1px solid rgba(var(--tb-primary-rgb),0.3)', borderRadius: 4, padding: '1px 4px', flexShrink: 0,
        }}>{badge}</span>
      )}
      <motion.button onClick={addQ} title="Añadir a cola"
        style={{ background: queued ? 'rgba(74,222,128,0.14)' : 'none',
          border: `1px solid ${queued ? 'rgba(74,222,128,0.4)' : 'rgba(var(--tb-primary-rgb),0.25)'}`, borderRadius: 5, cursor: 'pointer',
          color: queued ? '#4ade80' : 'rgba(var(--tb-primary-rgb),0.6)', fontSize: 9, padding: '2px 5px', lineHeight: 1, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 2,
        }}
        whileHover={{ color: queued ? '#4ade80' : 'var(--tb-accent)', borderColor: queued ? 'rgba(74,222,128,0.4)' : 'rgba(var(--tb-primary-rgb),0.65)', background: queued ? 'rgba(74,222,128,0.14)' : 'rgba(var(--tb-primary-rgb),0.1)' }}
        whileTap={{ scale: 0.85 }}
      >
        {queued ? <IconCheck size={9} /> : <IconQueueAdd size={9} />}
      </motion.button>
    </motion.div>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 8, color: 'rgba(var(--tb-primary-rgb),0.45)', letterSpacing: 1, margin: '6px 0 3px', flexShrink: 0 }}>
      {children}
    </p>
  )
}

function ExpandedPanel({ onPlayUri, onAddToQueue, onPlayQueueIndex }) {
  const [queueFull, setQueueFull] = useState(null)
  const [search, setSearch] = useState('')
  const [likedReady, setLikedReady] = useState(!!likedCache)
  const inputRef = useRef(null)

  // Búsqueda en Spotify — mismo hook compartido que usa el buscador de
  // Settings (GlobalSearch), para que ambos se comporten idénticamente.
  const { results: spotifyResults, loading: searching, error: searchError } = useSpotifySearch(search, { limit: 5 })

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120)
    fetchQueue().then(res => {
      const items = res?.queue ?? []
      setQueueFull(items.map((i, idx) => ({
        uri: i.uri, name: i.name,
        artist: i.artists?.map(a => a.name).join(', ') || '',
        albumArt: i.album?.images?.[1]?.url || i.album?.images?.[0]?.url || '',
        queueIndex: idx,
      })))
    }).catch(() => setQueueFull([]))
    ensureLikedCache().then(() => setLikedReady(true))
  }, [])

  const q = search.trim().toLowerCase()
  const isSearching = !!q

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
      background: 'var(--tb-gradient-dropdown)',
      borderRadius: '14px 14px 0 0',
      borderBottom: '1px solid rgba(var(--tb-primary-rgb),0.15)',
      display: 'flex', flexDirection: 'column',
      padding: '8px 8px 4px',
    }}>
      <div style={{ position: 'relative', marginBottom: 4, flexShrink: 0 }}>
        <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'rgba(var(--tb-primary-rgb),0.5)', pointerEvents: 'none' }}>🔍</span>
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar canción..."
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '5px 8px 5px 22px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(var(--tb-primary-rgb),0.25)',
            borderRadius: 8, outline: 'none',
            fontSize: 11, color: 'var(--tb-textLight)',
            fontFamily: 'inherit',
          }}
        />
        {searching && (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 10, height: 10, border: '2px solid rgba(var(--tb-primary-rgb),0.2)',
              borderTopColor: 'var(--tb-primary)', borderRadius: '50%' }}
          />
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!isSearching && (
          <>
            <SectionLabel>SIGUIENTE EN COLA</SectionLabel>
            {queueFull === null && (
              <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(var(--tb-textLight-rgb),0.3)', padding: '10px 0' }}>Cargando cola...</p>
            )}
            {queueFull !== null && queuePreview.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(var(--tb-textLight-rgb),0.3)', padding: '10px 0' }}>Cola vacía</p>
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
                {likedMatches.map((t, i) => <NotifResultRow key={'l'+t.uri+i} track={t} badge="❤" onPlay={onPlayUri} onAddToQueue={onAddToQueue} />)}
              </>
            )}
            {(searching || spotifyOnly.length > 0 || searchError) && (
              <>
                <SectionLabel>EN SPOTIFY</SectionLabel>
                {searching && spotifyOnly.length === 0 && (
                  <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(var(--tb-textLight-rgb),0.3)', padding: '6px 0' }}>Buscando...</p>
                )}
                {!searching && searchError && (
                  <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(248,113,113,0.8)', padding: '6px 0' }}>⚠ No se pudo conectar con Spotify</p>
                )}
                {spotifyOnly.map((t, i) => <NotifResultRow key={'s'+t.uri+i} track={t} onPlay={onPlayUri} onAddToQueue={onAddToQueue} />)}
              </>
            )}
            {noResults && (
              <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(var(--tb-textLight-rgb),0.3)', padding: '10px 0' }}>Sin resultados</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function AxolotlNotification({ track, isVisible, onClose, onExitComplete }) {
  const { playUri, playQueueIndex } = useSpotifyControls()
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpand = useCallback(() => {
    if (isExpanded) {
      setIsExpanded(false)
      window.electronAPI?.resumeNotificationTimer?.()
    } else {
      setIsExpanded(true)
      window.electronAPI?.resizeNotification?.(true)
      window.electronAPI?.resetNotificationTimer?.()
    }
  }, [isExpanded])

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

  const handlePlayUri = useCallback(async (uri) => {
    try { await playUri(uri) } catch {}
  }, [playUri])

  const handleAddToQueue = useCallback(async (uri) => {
    try { await apiAddToQueue(uri) } catch {}
  }, [])

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

  const glowStyle = isHovered
    ? { animation: 'ax-hover-glow 1.6s ease-in-out infinite' }
    : { boxShadow: '0 0 0 1px rgba(var(--tb-primary-rgb),0.08) inset, 0 6px 36px rgba(0,0,0,0.6), 0 0 22px rgba(var(--tb-primary-rgb),0.16)' }
  const borderColor = isHovered ? 'var(--tb-accent)' : 'rgba(var(--tb-primary-rgb),0.55)'

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

              <div style={{
                width: '100%', height: 160, flexShrink: 0,
                position: 'relative', overflow: 'hidden', borderRadius: 18,
                background: `
                  radial-gradient(ellipse at 5% 0%,   rgba(var(--tb-primary-rgb),0.22) 0%, transparent 50%),
                  radial-gradient(ellipse at 95% 100%, rgba(var(--tb-secondary-rgb),0.3) 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 50%, rgba(var(--tb-secondary-rgb),0.35) 0%, transparent 70%),
                  var(--tb-gradient-dropdown)
                `,
                border: `1.5px solid ${borderColor}`,
                transition: 'border-color 0.3s ease',
                ...glowStyle,
              }}>
                {BUBBLES.map(b => <Bubble key={b.id} b={b} />)}

                {SPARKLES.map(s => (
                  <div key={s.id} style={{
                    position: 'absolute', top: `${s.t}%`, left: `${s.l}%`,
                    width: s.sz, height: s.sz, borderRadius: '50%',
                    background: '#fff', pointerEvents: 'none',
                    boxShadow: `0 0 ${s.sz * 2}px rgba(var(--tb-accent-rgb),0.9)`,
                    animation: `ax-sparkle-pulse ${s.dr}s ${s.d}s ease-in-out infinite`,
                  }} />
                ))}

                {HEART_POSITIONS.map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', fontSize: 10,
                    pointerEvents: 'none',
                    animation: `ax-heart-fade ${2.5 + i * 0.4}s ${i * 0.3}s ease-in-out infinite`,
                    ...pos,
                  }}>
                    {HEARTS[i % HEARTS.length]}
                  </div>
                ))}

                <Corner pos={{ top: 4, left: 4 }}    rotate="0deg"    isHovered={isHovered} />
                <Corner pos={{ top: 4, right: 4 }}   rotate="90deg"   isHovered={isHovered} />
                <Corner pos={{ bottom: 4, left: 4 }} rotate="-90deg"  isHovered={isHovered} />
                <Corner pos={{ bottom: 4, right: 4 }} rotate="180deg" isHovered={isHovered} />

                <motion.button
                  onClick={toggleExpand} className="no-drag"
                  title={isExpanded ? 'Colapsar' : 'Ver cola y buscar'}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: 'absolute', top: 6, left: 6, zIndex: 30,
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(var(--tb-primary-rgb),0.16)', border: '1px solid rgba(var(--tb-primary-rgb),0.4)',
                    borderRadius: 8, cursor: 'pointer', padding: 0,
                    color: isExpanded ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.7)',
                    pointerEvents: isHovered ? 'auto' : 'none',
                  }}
                  whileHover={{ color: 'var(--tb-accent)', borderColor: 'rgba(var(--tb-primary-rgb),0.75)', background: 'rgba(var(--tb-primary-rgb),0.24)', scale: 1.08 }}
                  whileTap={{ scale: 0.85 }}
                >
                  <motion.span
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    style={{ fontSize: 11, lineHeight: 1, display: 'inline-block' }}
                  >▲</motion.span>
                </motion.button>

                <div style={{
                  position: 'absolute', top: 0, left: 18, right: 18, height: 1,
                  background: isHovered
                    ? 'linear-gradient(90deg, transparent, var(--tb-accent), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(var(--tb-primary-rgb),0.6), transparent)',
                  transition: 'background 0.3s',
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, left: 26, right: 26, height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(var(--tb-primary-rgb),0.3), transparent)',
                }} />

                <motion.div
                  animate={{ opacity: isHovered ? [0.6, 1, 0.6] : [0.2, 0.45, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'var(--tb-primary)', letterSpacing: 5, pointerEvents: 'none', fontFamily: 'serif' }}
                >✦ 🩷 ✦</motion.div>

                <div style={{
                  position: 'absolute', top: '18%', right: '8%', fontSize: 11,
                  color: '#fff', pointerEvents: 'none', opacity: 0,
                  animation: 'ax-twinkle 8s 2s ease-in-out infinite',
                  textShadow: '0 0 8px rgba(var(--tb-accent-rgb),0.9)',
                }}>✨</div>

                <motion.div
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 0 }}
                  transition={{ delay: 0.05, duration: 0.75 }}
                  style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 18, borderRadius: 18, overflow: 'hidden' }}
                >
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, width: '35%',
                    background: 'linear-gradient(90deg, transparent, rgba(var(--tb-accent-rgb),0.22), transparent)',
                    animation: 'ax-shimmer-sweep 0.75s 0.05s ease-out forwards',
                  }} />
                </motion.div>

                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none', zIndex: 22,
                      border: '1px solid rgba(var(--tb-accent-rgb),0.45)',
                      boxShadow: 'inset 0 0 24px rgba(var(--tb-primary-rgb),0.1)',
                    }}
                  />
                )}

                {/* ── Ajolotito decorativo ── */}
                <div style={{
                  position: 'absolute', top: 10, right: 20, zIndex: 5,
                  pointerEvents: 'none', opacity: 0.85,
                }}>
                  <MiniMascot width={80} opacity={0.9} />
                </div>

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
                      <motion.button
                        onClick={onClose} className="no-drag"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(var(--tb-textLight-rgb),0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4, marginLeft: 6, flexShrink: 0 }}
                        whileHover={{ color: 'var(--tb-textLight)', backgroundColor: 'rgba(255,255,255,0.08)', scale: 1.15 }}
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
