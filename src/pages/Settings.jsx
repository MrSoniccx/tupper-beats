import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import PlayerControls from '../components/PlayerControls'
import ProgressBar from '../components/ProgressBar'
import VolumeSlider from '../components/VolumeSlider'
import HogwartsNotification from '../themes/hogwarts/Notification'
import { useSpotifyControls } from '../components/useSpotifyControls'
import {
  IconMusic, IconBell, IconPalette, IconSettings, IconInfo,
  IconClose, IconMinimize, IconMaximize, IconRefresh, IconCheck, IconLogout,
} from '../components/Icons'

// ─── Velas flotantes de fondo (app) ──────────────────────────────────────────
const APP_CANDLES = [
  { left: '3%',   top: '15%', delay: 0,    dur: 2.8, h: 26 },
  { left: '6%',   top: '42%', delay: 0.5,  dur: 3.1, h: 20 },
  { left: '4%',   top: '70%', delay: 1.1,  dur: 2.5, h: 24 },
  { right: '3%',  top: '20%', delay: 0.3,  dur: 3.0, h: 22 },
  { right: '5%',  top: '50%', delay: 0.8,  dur: 2.7, h: 28 },
  { right: '4%',  top: '78%', delay: 1.4,  dur: 3.2, h: 20 },
]

const HALL_STARS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  top:   Math.sin(i * 137.5) * 40 + 50,
  left:  (i * 7.3) % 100,
  size:  (i % 3) + 1,
  delay: (i * 0.18) % 4,
  dur:   2.2 + (i % 3) * 0.8,
}))

function AppCandle({ style, delay, dur, h }) {
  return (
    <motion.div
      style={{ position: 'absolute', pointerEvents: 'none', zIndex: 0, ...style }}
      animate={{ y: [0, -5, 0], opacity: [0.5, 0.85, 0.5] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* llama */}
      <div style={{
        width: 5, height: 11,
        background: 'radial-gradient(ellipse at 40% 60%, #fffde7, #FFD700 50%, #FF8C00)',
        borderRadius: '50% 50% 28% 28%',
        marginLeft: 3, marginBottom: 1,
        boxShadow: '0 0 6px #FFD700, 0 -4px 8px rgba(255,140,0,0.4)',
        animation: `tb-candle ${dur * 0.4}s ease-in-out infinite`,
      }} />
      <div style={{
        width: 10, height: h,
        background: 'linear-gradient(to bottom, #F5E6C8 0%, #D4BF8A 100%)',
        borderRadius: 3,
        boxShadow: 'inset -2px 0 3px rgba(0,0,0,0.15)',
      }} />
    </motion.div>
  )
}

function AppBackground() {
  return (
    <>
      <style>{`@keyframes tb-candle{0%,100%{transform:scaleX(1) rotate(0deg)}40%{transform:scaleX(0.7) rotate(2deg)}70%{transform:scaleX(1.1) rotate(-1deg)}}`}</style>
      {/* Estrellas del Gran Comedor */}
      {HALL_STARS.map(s => (
        <div key={s.id} style={{
          position: 'absolute', top: `${s.top}%`, left: `${s.left}%`,
          width: s.size, height: s.size, borderRadius: '50%',
          background: '#FFD700', pointerEvents: 'none', zIndex: 0,
          animation: `tb-star-app ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
      {/* Velas flotantes en los laterales */}
      {APP_CANDLES.map((c, i) => <AppCandle key={i} {...c} />)}
      <style>{`
        @keyframes tb-star-app {
          0%,100% { opacity: 0.08; transform: scale(1); }
          50%     { opacity: 0.55; transform: scale(1.4); }
        }
      `}</style>
    </>
  )
}

// ─── Barra de título ─────────────────────────────────────────────────────────
function TitleBar() {
  return (
    <div
      className="drag-region flex-shrink-0 flex items-center justify-between px-4"
      style={{
        height: 40, zIndex: 10, position: 'relative',
        background: 'rgba(10,8,22,0.97)',
        borderBottom: '1px solid rgba(201,168,76,0.18)',
      }}
    >
      <div className="flex items-center gap-2">
        {/* Logo HP */}
        <span style={{ fontSize: 14, lineHeight: 1 }}>⚡</span>
        <span style={{ fontFamily: '"UnifrakturMaguntia", cursive', fontSize: 16, color: 'rgba(201,168,76,0.9)', letterSpacing: 1 }}>
          TupperBeats
        </span>
        <span style={{ fontSize: 10, color: 'rgba(201,168,76,0.35)', fontFamily: 'serif', letterSpacing: 2 }}>✦ Hogwarts ✦</span>
      </div>
      {/* Botones macOS — solo círculos de color */}
      <div className="flex items-center gap-1.5 no-drag">
        {[
          { action: () => window.electronAPI?.minimize(), title: 'Minimizar',     color: '#F5A623' },
          { action: () => window.electronAPI?.maximize(), title: 'Maximizar',     color: '#7ED321' },
          { action: () => window.electronAPI?.close(),   title: 'Cerrar al tray', color: '#D0021B' },
        ].map(({ action, title, color }) => (
          <motion.button key={title} onClick={action} title={title}
            className="flex-shrink-0 rounded-full no-drag"
            style={{ width: 12, height: 12, background: color }}
            whileHover={{ scale: 1.3, boxShadow: `0 0 8px ${color}` }}
            whileTap={{ scale: 0.85 }}
            transition={{ duration: 0.1 }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Card base ───────────────────────────────────────────────────────────────
function Card({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`rounded-xl border ${className}`}
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(201,168,76,0.12)', position: 'relative', zIndex: 1 }}
    >
      {title && (
        <div className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}
        >
          {Icon && <Icon size={13} className="text-hw-oro/60" />}
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(201,168,76,0.7)', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'serif' }}>
            {title}
          </span>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── Track row ────────────────────────────────────────────────────────────────
function TrackRow({ track, index, onPlay, contextUri }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay(track.uri, contextUri)}
      className="no-drag"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
        background: hovered ? 'rgba(201,168,76,0.08)' : 'transparent',
        transition: 'background 0.15s',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div style={{
        width: 28, textAlign: 'center', flexShrink: 0,
        fontSize: 11, color: hovered ? '#F0C040' : 'rgba(245,230,200,0.3)',
        transition: 'color 0.15s',
      }}>
        {hovered ? '▶' : index + 1}
      </div>
      {track.albumArt && (
        <img src={track.albumArt} alt="" style={{ width: 34, height: 34, borderRadius: 5, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(201,168,76,0.2)' }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: 'rgba(245,230,200,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{track.name}</p>
        <p style={{ fontSize: 11, color: 'rgba(245,230,200,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</p>
      </div>
      <p style={{ fontSize: 10, color: 'rgba(245,230,200,0.25)', flexShrink: 0 }}>
        {track.duration ? `${Math.floor(track.duration/60000)}:${String(Math.floor((track.duration%60000)/1000)).padStart(2,'0')}` : ''}
      </p>
    </motion.div>
  )
}

// ─── Album row ────────────────────────────────────────────────────────────────
function AlbumRow({ album, onPlay, onSelect }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="no-drag"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
        background: hovered ? 'rgba(201,168,76,0.08)' : 'transparent',
        transition: 'background 0.15s',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {album.imageUrl
        ? <img src={album.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(201,168,76,0.2)' }} />
        : <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(201,168,76,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💿</div>
      }
      <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSelect && onSelect(album)}>
        <p style={{ fontSize: 12, color: 'rgba(245,230,200,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{album.name}</p>
        <p style={{ fontSize: 11, color: 'rgba(245,230,200,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.artist} · {album.year}</p>
      </div>
      {hovered && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => { e.stopPropagation(); onPlay(album.uri) }}
          className="no-drag"
          style={{
            background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 6, padding: '3px 8px', fontSize: 11,
            color: '#F0C040', cursor: 'pointer', flexShrink: 0,
          }}
        >▶</motion.button>
      )}
      <motion.button
        onClick={(e) => { e.stopPropagation(); onSelect && onSelect(album) }}
        className="no-drag"
        style={{
          background: 'transparent', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 6, padding: '3px 8px', fontSize: 11,
          color: 'rgba(245,230,200,0.5)', cursor: 'pointer', flexShrink: 0,
          opacity: hovered ? 1 : 0.4, transition: 'opacity 0.15s',
        }}
      >Ver →</motion.button>
    </motion.div>
  )
}

// ─── Playlist row ─────────────────────────────────────────────────────────────
function PlaylistRow({ playlist, onSelect, onPlay }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="no-drag"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
        background: hovered ? 'rgba(201,168,76,0.08)' : 'transparent',
        transition: 'background 0.15s',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {playlist.imageUrl
        ? <img src={playlist.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(201,168,76,0.2)' }} />
        : <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(201,168,76,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
      }
      <div style={{ flex: 1, minWidth: 0 }} onClick={() => onSelect(playlist)}>
        <p style={{ fontSize: 12, color: 'rgba(245,230,200,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{playlist.name}</p>
        <p style={{ fontSize: 11, color: 'rgba(245,230,200,0.4)' }}>{playlist.total} canciones</p>
      </div>
      {/* Botón de reproducir directo */}
      {hovered && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => { e.stopPropagation(); onPlay(playlist.uri) }}
          className="no-drag"
          style={{
            background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 6, padding: '3px 8px', fontSize: 11,
            color: '#F0C040', cursor: 'pointer', flexShrink: 0,
          }}
        >▶ Reproducir</motion.button>
      )}
      <motion.button
        onClick={() => onSelect(playlist)}
        className="no-drag"
        style={{
          background: 'transparent', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 6, padding: '3px 8px', fontSize: 11,
          color: 'rgba(245,230,200,0.5)', cursor: 'pointer', flexShrink: 0,
          opacity: hovered ? 1 : 0.4,
          transition: 'opacity 0.15s',
        }}
      >Ver →</motion.button>
    </motion.div>
  )
}

// ─── Buscador ─────────────────────────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div style={{ position: 'relative', marginBottom: 8 }}>
      <span style={{
        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
        fontSize: 12, color: 'rgba(201,168,76,0.5)', pointerEvents: 'none',
      }}>🔍</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="no-drag"
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '7px 10px 7px 30px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 8, outline: 'none',
          fontSize: 12, color: 'rgba(245,230,200,0.85)',
          fontFamily: 'inherit',
        }}
        onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.5)' }}
        onBlur={e  => { e.target.style.borderColor = 'rgba(201,168,76,0.2)' }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="no-drag"
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(245,230,200,0.4)', fontSize: 14, lineHeight: 1,
          }}
        >✕</button>
      )}
    </div>
  )
}

// ─── Sección: Reproductor con tabs ───────────────────────────────────────────
function PlayerSection({ track }) {
  const { playUri, playTrackInContext } = useSpotifyControls()

  const [tab,            setTab]            = useState('now')
  const [savedTracks,    setSavedTracks]    = useState(null)
  const [savedAlbums,    setSavedAlbums]    = useState(null)
  const [queue,          setQueue]          = useState(null)
  const [playlists,      setPlaylists]      = useState(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistTracks,   setPlaylistTracks]   = useState(null)
  const [selectedAlbum,  setSelectedAlbum]  = useState(null)  // { id, uri, name, imageUrl, artist }
  const [albumTracks,    setAlbumTracks]    = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [query,          setQuery]          = useState('')

  // Al cambiar canción → resetear todo a "unloaded"
  useEffect(() => {
    setSavedTracks(null)
    setSavedAlbums(null)
    setQueue(null)
    setPlaylists(null)
    setSelectedPlaylist(null)
    setPlaylistTracks(null)
    setSelectedAlbum(null)
    setAlbumTracks(null)
    setQuery('')
  }, [track?.id])

  // Siempre fetch al cambiar tab (sin cache)
  const loadTab = useCallback(async (t) => {
    setTab(t)
    setSelectedPlaylist(null)
    setPlaylistTracks(null)
    setSelectedAlbum(null)
    setAlbumTracks(null)
    setQuery('')

    if (t === 'tracks') {
      setLoading(true)
      setSavedTracks(null)
      const res = await window.electronAPI?.getSavedTracks(0)
      if (res?.items) setSavedTracks(res.items.filter(i => i.track).map(i => ({
        uri: i.track.uri, name: i.track.name,
        artist: i.track.artists.map(a => a.name).join(', '),
        albumArt: i.track.album?.images?.[1]?.url || i.track.album?.images?.[0]?.url || '',
        duration: i.track.duration_ms,
      })))
      setLoading(false)
    }
    if (t === 'albums') {
      setLoading(true)
      setSavedAlbums(null)
      const res = await window.electronAPI?.getSavedAlbums(0)
      if (res?.items) setSavedAlbums(res.items.map(i => ({
        id: i.album.id,
        uri: i.album.uri, name: i.album.name,
        artist: i.album.artists.map(a => a.name).join(', '),
        year: i.album.release_date?.split('-')[0] || '',
        imageUrl: i.album.images?.[1]?.url || i.album.images?.[0]?.url || '',
        total: i.album.total_tracks || 0,
      })))
      setLoading(false)
    }
    if (t === 'queue') {
      setLoading(true)
      setQueue(null)
      const res = await window.electronAPI?.getQueue()
      if (res?.queue) setQueue(res.queue.slice(0, 30).map(i => ({
        uri: i.uri, name: i.name,
        artist: i.artists?.map(a => a.name).join(', ') || '',
        albumArt: i.album?.images?.[1]?.url || i.album?.images?.[0]?.url || '',
        duration: i.duration_ms,
      })))
      setLoading(false)
    }
    if (t === 'playlists') {
      setLoading(true)
      setPlaylists(null)
      const res = await window.electronAPI?.getPlaylists(0)
      if (res?.items) setPlaylists(res.items.map(p => ({
        id: p.id, uri: p.uri, name: p.name,
        total: p.tracks?.total || 0,
        imageUrl: p.images?.[0]?.url || '',
      })))
      setLoading(false)
    }
  }, [])

  const openPlaylist = useCallback(async (playlist) => {
    setSelectedPlaylist(playlist)
    setPlaylistTracks(null)
    setQuery('')
    setLoading(true)
    const res = await window.electronAPI?.getPlaylistTracks(playlist.id, 0)
    if (res?.items) setPlaylistTracks(
      res.items
        .filter(i => i.track && i.track.uri)
        .map(i => ({
          uri: i.track.uri, name: i.track.name,
          artist: i.track.artists?.map(a => a.name).join(', ') || '',
          albumArt: i.track.album?.images?.[1]?.url || i.track.album?.images?.[0]?.url || '',
          duration: i.track.duration_ms,
        }))
    )
    setLoading(false)
  }, [])

  const openAlbum = useCallback(async (album) => {
    setSelectedAlbum(album)
    setAlbumTracks(null)
    setQuery('')
    setLoading(true)
    // getAlbumTracks sólo devuelve tracks sin albumArt → usamos la del álbum
    const res = await window.electronAPI?.getAlbumTracks(album.id, 0)
    if (res?.items) setAlbumTracks(
      res.items
        .filter(i => i.uri)
        .map((i, idx) => ({
          uri: i.uri, name: i.name,
          artist: i.artists?.map(a => a.name).join(', ') || album.artist,
          albumArt: album.imageUrl,
          duration: i.duration_ms,
          trackNumber: i.track_number || idx + 1,
        }))
    )
    setLoading(false)
  }, [])

  const handlePlay = useCallback(async (uri, contextUri) => {
    if (contextUri && uri.startsWith('spotify:track:')) {
      await playTrackInContext(contextUri, uri)
    } else {
      await playUri(uri)
    }
  }, [playUri, playTrackInContext])

  // Filtrado por búsqueda
  const filterByQuery = useCallback((items, fields = ['name', 'artist']) => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(item => fields.some(f => item[f]?.toLowerCase().includes(q)))
  }, [query])

  const tabs = [
    { id: 'now',       label: '🎵 Ahora'     },
    { id: 'queue',     label: '⏭ Cola'       },
    { id: 'playlists', label: '📜 Playlists'  },
    { id: 'tracks',    label: '🎶 Canciones'  },
    { id: 'albums',    label: '💿 Álbumes'    },
  ]

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 3, padding: '4px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 10, border: '1px solid rgba(201,168,76,0.1)',
        overflowX: 'auto',
      }}>
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <motion.button key={t.id} onClick={() => loadTab(t.id)} className="no-drag"
              style={{
                padding: '5px 10px', borderRadius: 7, whiteSpace: 'nowrap',
                fontSize: 11, fontWeight: active ? 600 : 400,
                color: active ? '#F0C040' : 'rgba(245,230,200,0.4)',
                background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                border: `1px solid ${active ? 'rgba(201,168,76,0.35)' : 'transparent'}`,
                transition: 'all 0.15s', cursor: 'pointer', flexShrink: 0,
              }}
              whileTap={{ scale: 0.96 }}
            >{t.label}</motion.button>
          )
        })}
      </div>

      {/* Panel: Ahora */}
      {tab === 'now' && (
        !track
          ? <Card title="Reproductor" icon={IconMusic}>
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconMusic size={22} className="text-hw-oro/30" />
                </div>
                <p style={{ fontSize: 13, color: 'rgba(245,230,200,0.4)', fontFamily: 'serif' }}>Sin reproducción activa</p>
                <p style={{ fontSize: 11, color: 'rgba(245,230,200,0.25)' }}>Abre Spotify y reproduce algo ✨</p>
              </div>
            </Card>
          : <Card title="Reproduciendo ahora" icon={IconMusic}>
              <div className="flex items-center gap-4 mb-4">
                <motion.img key={track.id} src={track.albumArt} alt="Album"
                  initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(201,168,76,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 16px rgba(201,168,76,0.18)' }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#F0C040', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 0 12px rgba(240,192,64,0.3)' }}>{track.name}</p>
                  <p style={{ fontSize: 12, color: 'rgba(245,230,200,0.55)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</p>
                  <p style={{ fontSize: 11, color: 'rgba(245,230,200,0.25)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.album}</p>
                </div>
              </div>
              <ProgressBar className="mb-4" />
              <div className="flex items-center justify-between">
                <PlayerControls size="md" />
                <VolumeSlider />
              </div>
            </Card>
      )}

      {/* Panel: Cola */}
      {tab === 'queue' && (
        <Card title="Siguiente en cola" icon={IconMusic}>
          {loading ? <Spinner /> : !queue ? <Empty text="No hay cola disponible" /> : queue.length === 0 ? <Empty text="La cola está vacía" /> : (
            <>
              <SearchInput value={query} onChange={setQuery} placeholder="Buscar en cola..." />
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {filterByQuery(queue).map((t, i) => <TrackRow key={t.uri + i} track={t} index={i} onPlay={handlePlay} />)}
                {filterByQuery(queue).length === 0 && <Empty text={`Sin resultados para "${query}"`} />}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Panel: Playlists */}
      {tab === 'playlists' && (
        <Card title={selectedPlaylist ? `📜 ${selectedPlaylist.name}` : 'Mis Playlists'} icon={IconMusic}>
          {/* Botón volver */}
          {(selectedPlaylist || selectedAlbum) && (
            <div style={{ marginBottom: 10 }}>
              <motion.button
                onClick={() => { setSelectedPlaylist(null); setPlaylistTracks(null); setQuery('') }}
                className="no-drag"
                style={{
                  background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: 7, padding: '4px 10px', fontSize: 11, color: 'rgba(245,230,200,0.6)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}
                whileTap={{ scale: 0.97 }}
              >← Volver a playlists</motion.button>
            </div>
          )}

          {loading ? <Spinner /> : selectedPlaylist ? (
            !playlistTracks
              ? <Empty text="No se pudieron cargar las canciones" />
              : playlistTracks.length === 0
                ? <Empty text="Playlist vacía" />
                : <>
                    <SearchInput value={query} onChange={setQuery} placeholder="Buscar en playlist..." />
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {filterByQuery(playlistTracks).map((t, i) => (
                        <TrackRow key={t.uri + i} track={t} index={i}
                          onPlay={handlePlay} contextUri={selectedPlaylist.uri}
                        />
                      ))}
                      {filterByQuery(playlistTracks).length === 0 && <Empty text={`Sin resultados para "${query}"`} />}
                    </div>
                  </>
          ) : (
            !playlists
              ? <Empty text="No se pudieron cargar las playlists" />
              : playlists.length === 0
                ? <Empty text="No tienes playlists" />
                : <>
                    <SearchInput value={query} onChange={setQuery} placeholder="Buscar playlist..." />
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {filterByQuery(playlists, ['name']).map(p => (
                        <PlaylistRow key={p.id} playlist={p}
                          onSelect={openPlaylist}
                          onPlay={(uri) => handlePlay(uri)}
                        />
                      ))}
                      {filterByQuery(playlists, ['name']).length === 0 && <Empty text={`Sin resultados para "${query}"`} />}
                    </div>
                  </>
          )}
        </Card>
      )}

      {/* Panel: Canciones */}
      {tab === 'tracks' && (
        <Card title="Mis canciones guardadas" icon={IconMusic}>
          {loading ? <Spinner /> : !savedTracks ? <Empty text="No se pudieron cargar las canciones" /> : savedTracks.length === 0 ? <Empty text="No tienes canciones guardadas" /> : (
            <>
              <SearchInput value={query} onChange={setQuery} placeholder="Buscar canción..." />
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {filterByQuery(savedTracks).map((t, i) => <TrackRow key={t.uri} track={t} index={i} onPlay={handlePlay} />)}
                {filterByQuery(savedTracks).length === 0 && <Empty text={`Sin resultados para "${query}"`} />}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Panel: Álbumes */}
      {tab === 'albums' && (
        <Card title={selectedAlbum ? `💿 ${selectedAlbum.name}` : 'Mis álbumes guardados'} icon={IconMusic}>
          {/* Volver */}
          {selectedAlbum && (
            <div style={{ marginBottom: 10 }}>
              <motion.button
                onClick={() => { setSelectedAlbum(null); setAlbumTracks(null); setQuery('') }}
                className="no-drag"
                style={{
                  background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: 7, padding: '4px 10px', fontSize: 11, color: 'rgba(245,230,200,0.6)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}
                whileTap={{ scale: 0.97 }}
              >← Volver a álbumes</motion.button>
            </div>
          )}

          {loading ? <Spinner /> : selectedAlbum ? (
            !albumTracks
              ? <Empty text="No se pudieron cargar las canciones del álbum" />
              : albumTracks.length === 0
                ? <Empty text="Álbum vacío" />
                : <>
                    <SearchInput value={query} onChange={setQuery} placeholder="Buscar en álbum..." />
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {filterByQuery(albumTracks).map((t, i) => (
                        <TrackRow key={t.uri + i} track={{ ...t, index: t.trackNumber }} index={t.trackNumber - 1}
                          onPlay={handlePlay} contextUri={selectedAlbum.uri}
                        />
                      ))}
                      {filterByQuery(albumTracks).length === 0 && <Empty text={`Sin resultados para "${query}"`} />}
                    </div>
                  </>
          ) : (
            !savedAlbums
              ? <Empty text="No se pudieron cargar los álbumes" />
              : savedAlbums.length === 0
                ? <Empty text="No tienes álbumes guardados" />
                : <>
                    <SearchInput value={query} onChange={setQuery} placeholder="Buscar álbum..." />
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {filterByQuery(savedAlbums, ['name', 'artist']).map(a => (
                        <AlbumRow key={a.uri} album={a}
                          onPlay={(uri) => handlePlay(uri)}
                          onSelect={openAlbum}
                        />
                      ))}
                      {filterByQuery(savedAlbums, ['name', 'artist']).length === 0 && <Empty text={`Sin resultados para "${query}"`} />}
                    </div>
                  </>
          )}
        </Card>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 20, height: 20, border: '2px solid rgba(201,168,76,0.25)', borderTopColor: '#C9A84C', borderRadius: '50%' }}
      />
    </div>
  )
}
function Empty({ text }) {
  return <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(245,230,200,0.3)', padding: '20px 0', fontStyle: 'italic' }}>{text}</p>
}

// ─── Sección: Notificaciones ─────────────────────────────────────────────────
function NotificationsSection() {
  const {
    notificationMode, setNotificationMode,
    notificationPosition, setNotificationPosition,
    notificationAutoHide, setNotificationAutoHide,
    currentTrack,
  } = useAppStore()

  const modes = [
    { id: 'always',   label: 'Siempre visible',    desc: 'Encima de todo, incluso pantalla completa' },
    { id: 'normal',   label: 'Visible normalmente', desc: 'Se oculta si hay app en pantalla completa' },
    { id: 'disabled', label: 'Desactivadas',        desc: 'Solo música en segundo plano' },
  ]
  const modeColors = { always: '#4ade80', normal: '#fbbf24', disabled: '#f87171' }
  const positions = [
    { id: 'top-left',    label: 'Arriba izquierda' },
    { id: 'top-right',   label: 'Arriba derecha'   },
    { id: 'bottom-left', label: 'Abajo izquierda'  },
    { id: 'bottom-right',label: 'Abajo derecha'    },
  ]
  const autoHideOpts = [
    { value: 5,  label: '5 s' }, { value: 10, label: '10 s' },
    { value: 30, label: '30 s' }, { value: 0, label: 'Nunca' },
  ]

  return (
    <div className="space-y-3">
      <Card title="Visibilidad" icon={IconBell}>
        <div className="space-y-1.5">
          {modes.map(m => {
            const active = notificationMode === m.id
            return (
              <motion.button key={m.id} onClick={() => setNotificationMode(m.id)}
                className="w-full flex items-center gap-3 rounded-lg text-left no-drag"
                style={{ padding: '10px 12px', background: active ? 'rgba(201,168,76,0.08)' : 'transparent', border: `1px solid ${active ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.04)'}`, transition: 'all 0.15s' }}
                whileTap={{ scale: 0.98 }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: modeColors[m.id], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: active ? '#F0C040' : 'rgba(245,230,200,0.75)' }}>{m.label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(245,230,200,0.35)', marginTop: 1 }}>{m.desc}</p>
                </div>
                {active && <IconCheck size={14} className="text-hw-oro flex-shrink-0" />}
              </motion.button>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card title="Posición">
          <div className="grid grid-cols-2 gap-1.5">
            {positions.map(p => {
              const active = notificationPosition === p.id
              return (
                <motion.button key={p.id} onClick={() => setNotificationPosition(p.id)}
                  className="rounded-lg no-drag"
                  style={{ padding: '7px 8px', fontSize: 11, fontWeight: 500, color: active ? '#F0C040' : 'rgba(245,230,200,0.45)', background: active ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.15s' }}
                  whileTap={{ scale: 0.95 }}
                >{p.label}</motion.button>
              )
            })}
          </div>
        </Card>
        <Card title="Auto-ocultar">
          <div className="grid grid-cols-2 gap-1.5">
            {autoHideOpts.map(o => {
              const active = notificationAutoHide === o.value
              return (
                <motion.button key={o.value} onClick={() => setNotificationAutoHide(o.value)}
                  className="rounded-lg no-drag"
                  style={{ padding: '7px 8px', fontSize: 11, fontWeight: 500, color: active ? '#F0C040' : 'rgba(245,230,200,0.45)', background: active ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.15s' }}
                  whileTap={{ scale: 0.95 }}
                >{o.label}</motion.button>
              )
            })}
          </div>
        </Card>
      </div>

      {currentTrack && (
        <Card title="Preview de notificación">
          <div style={{ height: 130, borderRadius: 10, overflow: 'hidden' }}>
            <HogwartsNotification track={currentTrack} isVisible={true} onClose={() => {}} onExitComplete={() => {}} />
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Sección: Temas ──────────────────────────────────────────────────────────
function ThemesSection() {
  const { activeTheme, setActiveTheme } = useAppStore()
  const themes = [
    { id: 'hogwarts', name: '🏰 Hogwarts', desc: 'Pergamino, magia y el Gran Comedor', gradient: 'linear-gradient(135deg, #2a1a08, #1a1a2e)', accent: '#C9A84C', available: true },
    { id: 'rosa',  name: '🌸 Rosa Girly',  desc: 'Próximamente', gradient: 'linear-gradient(135deg, #FFB6C1, #E6D7FF)', accent: '#9B5DE5', available: false },
    { id: 'dark',  name: '🌑 Dark Minimal', desc: 'Próximamente', gradient: 'linear-gradient(135deg, #111, #222)', accent: '#555', available: false },
  ]
  return (
    <Card title="Tema de la app" icon={IconPalette}>
      <div className="space-y-2">
        {themes.map(t => {
          const active = activeTheme === t.id
          return (
            <motion.button key={t.id} onClick={() => t.available && setActiveTheme(t.id)} disabled={!t.available}
              className="w-full flex items-center gap-3 rounded-xl no-drag"
              style={{ padding: '10px 12px', textAlign: 'left', background: active ? 'rgba(201,168,76,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${active ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.05)'}`, opacity: t.available ? 1 : 0.4, cursor: t.available ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
              whileTap={t.available ? { scale: 0.98 } : {}}
            >
              <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: t.gradient, border: `2px solid ${t.accent}40` }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: active ? '#F0C040' : 'rgba(245,230,200,0.8)' }}>{t.name}</p>
                <p style={{ fontSize: 11, color: 'rgba(245,230,200,0.35)', marginTop: 1 }}>{t.desc}</p>
              </div>
              {active && <IconCheck size={14} className="text-hw-oro" />}
            </motion.button>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Sección: App ────────────────────────────────────────────────────────────
function AppSection({ onLogout }) {
  // updateStatus: 'idle' | 'checking' | 'up-to-date' | 'available' | 'downloading' | 'downloaded' | 'error'
  const [updateStatus, setUpdateStatus] = useState('idle')
  const [updateInfo,   setUpdateInfo]   = useState(null)   // { version, percent, message }

  // Escuchar eventos de autoUpdater desde main
  useEffect(() => {
    const handler = (data) => {
      setUpdateStatus(data.status)
      if (data.version || data.percent !== undefined || data.message) {
        setUpdateInfo(data)
      }
    }
    window.electronAPI?.onUpdateStatus?.(handler)
    return () => window.electronAPI?.removeAllListeners?.('update-status')
  }, [])

  const checkUpdates = async () => {
    setUpdateStatus('checking')
    setUpdateInfo(null)
    try {
      await window.electronAPI?.checkForUpdates()
      // Los eventos de autoUpdater actualizarán el estado automáticamente
    } catch (e) {
      setUpdateStatus('error')
      setUpdateInfo({ message: e.message })
    }
  }

  const installNow = () => window.electronAPI?.installUpdateNow?.()

  const statusConfig = {
    idle:        { label: 'Buscar actualizaciones',     color: 'rgba(245,230,200,0.5)',  spin: false },
    checking:    { label: 'Verificando...',              color: 'rgba(201,168,76,0.7)',   spin: true  },
    'up-to-date':{ label: '✨ Estás al día',             color: '#4ade80',                spin: false },
    available:   { label: `⬇ Nueva versión disponible: ${updateInfo?.version ?? ''}`, color: '#fbbf24', spin: false },
    downloading: { label: `Descargando ${updateInfo?.percent ?? 0}%...`, color: '#60a5fa', spin: true },
    downloaded:  { label: `✅ Lista para instalar: v${updateInfo?.version ?? ''}`, color: '#34d399', spin: false },
    error:       { label: 'Error al verificar',          color: '#f87171',                spin: false },
  }
  const cfg = statusConfig[updateStatus] ?? statusConfig.idle

  return (
    <div className="space-y-3">
      <Card title="Información" icon={IconInfo}>
        {[['Versión', '1.0.0'], ['Hecho por', 'MrSoniccx'], ['Para', 'Tupper 💜']].map(([k, v]) => (
          <div key={k} className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 12, color: 'rgba(245,230,200,0.35)' }}>{k}</span>
            <span style={{ fontSize: 12, color: 'rgba(245,230,200,0.7)' }}>{v}</span>
          </div>
        ))}
      </Card>

      <Card title="Actualizaciones" icon={IconRefresh}>
        {/* Barra de progreso cuando descargando */}
        {updateStatus === 'downloading' && (
          <div style={{ marginBottom: 8, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', height: 4 }}>
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(90deg, #60a5fa, #818cf8)', borderRadius: 4 }}
              initial={{ width: 0 }}
              animate={{ width: `${updateInfo?.percent ?? 0}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        )}

        <motion.button
          onClick={updateStatus === 'downloaded' ? installNow : checkUpdates}
          disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
          className="w-full flex items-center justify-center gap-2 rounded-xl no-drag"
          style={{
            padding: '10px 16px',
            background: updateStatus === 'downloaded' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${updateStatus === 'downloaded' ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: cfg.color, fontSize: 13, fontWeight: 500,
            cursor: (updateStatus === 'checking' || updateStatus === 'downloading') ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
          whileHover={{ background: updateStatus === 'downloaded' ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.07)' }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.span
            animate={cfg.spin ? { rotate: 360 } : {}}
            transition={cfg.spin ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
          >
            <IconRefresh size={14} />
          </motion.span>
          {cfg.label}
        </motion.button>

        {updateStatus === 'downloaded' && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(245,230,200,0.35)', marginTop: 6 }}>
            La app se cerrará y reiniciará para aplicar la actualización.
          </p>
        )}
      </Card>

      <Card title="Cuenta y app" icon={IconSettings}>
        <div className="space-y-2">
          <motion.button onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl no-drag"
            style={{ padding: '10px 16px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13, fontWeight: 500 }}
            whileHover={{ background: 'rgba(248,113,113,0.12)' }} whileTap={{ scale: 0.97 }}
          >
            <IconLogout size={14} /> Desconectar Spotify
          </motion.button>
          <motion.button onClick={() => window.electronAPI?.close()}
            className="w-full flex items-center justify-center gap-2 rounded-xl no-drag"
            style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(245,230,200,0.4)', fontSize: 13, fontWeight: 500 }}
            whileHover={{ background: 'rgba(255,255,255,0.06)' }} whileTap={{ scale: 0.97 }}
          >
            <IconMinimize size={14} /> Minimizar al tray
          </motion.button>
        </div>
      </Card>

      {/* Mensaje de cumpleaños */}
      <motion.div
        animate={{ boxShadow: ['0 0 10px rgba(201,168,76,0.1)', '0 0 20px rgba(201,168,76,0.25)', '0 0 10px rgba(201,168,76,0.1)'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ borderRadius: 12, padding: '20px 16px', background: 'linear-gradient(135deg, rgba(116,0,1,0.18), rgba(201,168,76,0.1))', border: '1px solid rgba(201,168,76,0.22)', textAlign: 'center' }}
      >
        <p style={{ fontFamily: '"UnifrakturMaguntia", cursive', fontSize: 22, color: '#C9A84C', marginBottom: 8, textShadow: '0 0 15px rgba(201,168,76,0.5)' }}>Para Tupper</p>
        <p style={{ fontSize: 14, marginBottom: 6 }}>⚡ 🦁 ✨ 🌟 ⚡</p>
        <p style={{ fontSize: 12, color: 'rgba(245,230,200,0.6)', lineHeight: 1.7 }}>
          Que cada canción sea tan mágica como tú<br />
          <span style={{ fontStyle: 'italic', color: 'rgba(201,168,76,0.7)' }}>"Happiness can be found even in the darkest of times,</span><br />
          <span style={{ fontStyle: 'italic', color: 'rgba(201,168,76,0.7)' }}>if one only remembers to turn on the music"</span><br />
          <span style={{ fontSize: 11, color: 'rgba(245,230,200,0.3)' }}>— Dumbledore (casi)</span>
        </p>
        <p style={{ marginTop: 10, fontSize: 13, color: '#F0C040', fontWeight: 600 }}>¡Feliz cumpleaños! 🎂🏰</p>
      </motion.div>
    </div>
  )
}

// ─── Sidebar nav ─────────────────────────────────────────────────────────────
const NAV = [
  { id: 'player',        label: 'Reproductor',    Icon: IconMusic    },
  { id: 'notifications', label: 'Notificaciones', Icon: IconBell     },
  { id: 'themes',        label: 'Temas',          Icon: IconPalette  },
  { id: 'app',           label: 'App',            Icon: IconSettings },
]

// ─── Barra inferior de reproductor ───────────────────────────────────────────
function BottomPlayerBar({ track }) {
  const { isPlaying } = useAppStore()
  return (
    <div style={{
      height: track ? 64 : 44, flexShrink: 0, position: 'relative', zIndex: 10,
      background: 'linear-gradient(180deg, rgba(10,8,20,0.97) 0%, rgba(6,4,14,0.99) 100%)',
      borderTop: '1px solid rgba(201,168,76,0.2)',
      display: 'flex', alignItems: 'center',
      padding: '0 14px', gap: 12,
      transition: 'height 0.3s ease',
    }}>
      {/* línea dorada */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5) 30%, rgba(240,192,64,0.7) 50%, rgba(201,168,76,0.5) 70%, transparent)' }} />

      {!track ? (
        <p style={{ fontSize: 11, color: 'rgba(245,230,200,0.2)', width: '100%', textAlign: 'center', fontStyle: 'italic' }}>
          ✦ Sin reproducción activa ✦
        </p>
      ) : (
        <>
          <motion.img key={track.id} src={track.albumArt} alt=""
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            style={{ width: 38, height: 38, borderRadius: 7, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(201,168,76,0.35)', boxShadow: '0 0 10px rgba(201,168,76,0.2)' }}
          />
          <div style={{ minWidth: 0, width: 115, flexShrink: 0 }}>
            <motion.p key={`bn-${track.id}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 12, fontWeight: 600, color: '#F0C040', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 0 8px rgba(240,192,64,0.3)' }}
            >{track.name}</motion.p>
            <motion.p key={`ba-${track.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.07 }}
              style={{ fontSize: 10, color: 'rgba(245,230,200,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}
            >{track.artist}</motion.p>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PlayerControls size="sm" />
            </div>
            <ProgressBar />
          </div>
          <div style={{ flexShrink: 0 }}>
            <VolumeSlider />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Principal ───────────────────────────────────────────────────────────────
export default function Settings() {
  const [section, setSection] = useState('player')
  const { currentTrack, setAuthenticated } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    window.electronAPI?.storeGet('spotifyAccessToken', null).then(t => {
      if (!t) navigate('/login', { replace: true })
    })
  }, [])

  const handleLogout = async () => {
    await window.electronAPI?.logoutSpotify()
    setAuthenticated(false)
    navigate('/login', { replace: true })
  }

  const panels = {
    player:        <PlayerSection track={currentTrack} />,
    notifications: <NotificationsSection />,
    themes:        <ThemesSection />,
    app:           <AppSection onLogout={handleLogout} />,
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#080614', position: 'relative', overflow: 'hidden' }}>
      {/* Fondo mágico del Gran Comedor */}
      <AppBackground />

      <TitleBar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Sidebar */}
        <div style={{
          width: 172, flexShrink: 0, display: 'flex', flexDirection: 'column',
          padding: '10px 8px', gap: 2,
          background: 'rgba(8,6,18,0.8)',
          borderRight: '1px solid rgba(201,168,76,0.1)',
          overflowY: 'auto', backdropFilter: 'blur(4px)',
        }}>
          {/* HP badge */}
          <div style={{ textAlign: 'center', padding: '6px 0 10px', borderBottom: '1px solid rgba(201,168,76,0.1)', marginBottom: 6 }}>
            <p style={{ fontFamily: '"UnifrakturMaguntia", cursive', fontSize: 11, color: 'rgba(201,168,76,0.5)', letterSpacing: 1 }}>Hogwarts</p>
          </div>

          {NAV.map(({ id, label, Icon }) => {
            const active = section === id
            return (
              <motion.button key={id} onClick={() => setSection(id)}
                className="flex items-center gap-2.5 rounded-xl no-drag"
                style={{ padding: '9px 12px', textAlign: 'left', background: active ? 'rgba(201,168,76,0.1)' : 'transparent', border: `1px solid ${active ? 'rgba(201,168,76,0.28)' : 'transparent'}`, color: active ? '#F0C040' : 'rgba(245,230,200,0.45)', fontSize: 13, fontWeight: active ? 500 : 400, transition: 'all 0.15s' }}
                whileHover={{ color: active ? '#F0C040' : 'rgba(245,230,200,0.78)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon size={14} />
                <span>{label}</span>
                {active && <motion.div layoutId="nav-dot" style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#F0C040', boxShadow: '0 0 6px #F0C040' }} />}
              </motion.button>
            )
          })}

          {/* Mini track en sidebar */}
          {currentTrack && (
            <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(201,168,76,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                <img src={currentTrack.albumArt} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(201,168,76,0.25)' }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: 'rgba(245,230,200,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentTrack.name}</p>
                  <p style={{ fontSize: 10, color: 'rgba(245,230,200,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentTrack.artist}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel contenido */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <AnimatePresence mode="wait">
            <motion.div key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {panels[section]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <BottomPlayerBar track={currentTrack} />
    </div>
  )
}
