import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { getTheme, listThemes } from '../themes'
import PlayerControls from '../components/PlayerControls'
import ProgressBar from '../components/ProgressBar'
import VolumeSlider from '../components/VolumeSlider'
import { useSpotifyControls } from '../components/useSpotifyControls'
import { useSpotifySearch } from '../hooks/useSpotifySearch'
import {
  IconMusic, IconBell, IconPalette, IconSettings, IconInfo,
  IconClose, IconMinimize, IconMaximize, IconRefresh, IconCheck, IconLogout,
  IconShuffle, IconRepeatContext, IconRepeatOne, IconSearch, IconPower, IconQueueAdd,
} from '../components/Icons'
import {
  fetchQueue, fetchSavedAlbums, fetchPlaylists,
  fetchAlbumTracks, fetchPlaylistTracks, searchSpotify,
  fetchPlayerState,
  setShuffle as apiSetShuffle, setRepeat as apiSetRepeat,
  addToQueue as apiAddToQueue,
} from '../lib/spotifyAPI'
import tupperMessages from '../tupper-messages.json'
import { ensureSavedTracksLoaded } from '../lib/savedTracks'

// La decoración de fondo (castillo/estrellas en Hogwarts, burbujas/ajolote en
// Axolote) ahora vive en src/themes/<tema>/Background.jsx — Settings() la
// obtiene del tema activo vía getTheme() y la renderiza como <Background />.

// ─── Barra de título ─────────────────────────────────────────────────────────
// ─── Búsqueda global en el título ─────────────────────────────────────────────
function GlobalSearch() {
  const { savedTracksCache } = useAppStore()
  const { playUri } = useSpotifyControls()
  const [query, setQuery]         = useState('')
  const [focused, setFocused]     = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Búsqueda en Spotify — mismo hook compartido que usa el panel de la
  // notificación, para que ambos buscadores se comporten idénticamente.
  const { results: apiResults, loading } = useSpotifySearch(query, { limit: 10 })

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Favoritas que coinciden (top 3)
  const favMatches = query.trim() && savedTracksCache
    ? savedTracksCache
        .filter(t => t.name.toLowerCase().includes(query.toLowerCase()) ||
                     t.artist.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
    : []

  // Filtrar del API las que ya aparecen en favoritas
  const favUris = new Set(favMatches.map(t => t.uri))
  const spotifyOnly = apiResults.filter(t => !favUris.has(t.uri))

  const showDropdown = focused && query.trim()

  const handlePlay = async (uri) => {
    await playUri(uri)
    setQuery('')
    setFocused(false)
  }

  const handleAddToQueue = async (uri) => {
    try { await apiAddToQueue(uri) } catch {}
    // No cerrar el dropdown — el usuario puede seguir añadiendo
  }

  const ResultRow = ({ track, badge }) => (
    <div onClick={() => handlePlay(track.uri)}
      className="no-drag"
      style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px', borderRadius:8, cursor:'pointer', transition:'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--tb-primary-rgb),0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {track.albumArt
        ? <img src={track.albumArt} alt="" style={{ width:28, height:28, borderRadius:5, objectFit:'cover', flexShrink:0 }} />
        : <div style={{ width:28, height:28, borderRadius:5, background:'rgba(var(--tb-primary-rgb),0.08)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🎵</div>
      }
      <div style={{ minWidth:0, flex:1 }}>
        <p style={{ fontSize:12, color:'rgba(var(--tb-textLight-rgb),0.92)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track.name}</p>
        <p style={{ fontSize:10, color:'rgba(var(--tb-textLight-rgb),0.4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track.artist}</p>
      </div>
      {badge && (
        <span style={{ fontSize:8, color:'var(--tb-accent)', background:'rgba(var(--tb-primary-rgb),0.15)',
          border:'1px solid rgba(var(--tb-primary-rgb),0.3)', borderRadius:4, padding:'1px 5px', flexShrink:0,
        }}>{badge}</span>
      )}
      {/* Acciones */}
      <div className="no-drag" style={{ display:'flex', gap:3, flexShrink:0 }}>
        <motion.button onClick={e => { e.stopPropagation(); handleAddToQueue(track.uri) }}
          title="Añadir a cola"
          style={{ background:'none', border:'1px solid rgba(var(--tb-primary-rgb),0.2)', borderRadius:5,
            cursor:'pointer', color:'rgba(var(--tb-primary-rgb),0.5)', fontSize:9, padding:'2px 6px', lineHeight:1 }}
          whileHover={{ color:'var(--tb-accent)', borderColor:'rgba(var(--tb-primary-rgb),0.6)', background:'rgba(var(--tb-primary-rgb),0.08)' }}
          whileTap={{ scale:0.85 }}
        >+cola</motion.button>
      </div>
    </div>
  )

  return (
    <div ref={containerRef} className="no-drag"
      style={{ position:'relative', flex:1, maxWidth:320, margin:'0 12px' }}
    >
      {/* Input */}
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        <span style={{ position:'absolute', left:9, fontSize:11, color:'rgba(var(--tb-primary-rgb),0.45)', pointerEvents:'none' }}>🔍</span>
        <input ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Buscar canción..."
          style={{
            width:'100%', padding:'5px 28px 5px 26px',
            background: focused ? 'rgba(var(--tb-primary-rgb),0.08)' : 'rgba(255,255,255,0.04)',
            border:`1px solid ${focused ? 'rgba(var(--tb-primary-rgb),0.5)' : 'rgba(var(--tb-primary-rgb),0.18)'}`,
            borderRadius:10, outline:'none',
            fontSize:12, color:'rgba(var(--tb-textLight-rgb),0.9)',
            fontFamily:'inherit', transition:'all 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(var(--tb-primary-rgb),0.06)' : 'none',
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); inputRef.current?.focus() }}
            style={{ position:'absolute', right:7, background:'none', border:'none',
              cursor:'pointer', color:'rgba(var(--tb-textLight-rgb),0.4)', fontSize:11, padding:2,
            }}
          >✕</button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity:0, y:-6, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-6, scale:0.97 }}
            transition={{ type:'spring', stiffness:350, damping:28 }}
            style={{
              position:'absolute', top:'calc(100% + 6px)', left:0, right:0,
              background:'var(--tb-gradient-dropdown)',
              border:'1px solid rgba(var(--tb-primary-rgb),0.3)',
              borderRadius:12,
              boxShadow:'0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(var(--tb-primary-rgb),0.08)',
              overflow:'hidden', zIndex:999, maxHeight:340, overflowY:'auto',
              backdropFilter:'blur(16px)',
            }}
          >
            {/* Favoritas */}
            {favMatches.length > 0 && (
              <>
                <div style={{ padding:'7px 10px 3px', borderBottom:'1px solid rgba(var(--tb-primary-rgb),0.08)' }}>
                  <p style={{ fontSize:9, color:'rgba(var(--tb-primary-rgb),0.5)', letterSpacing:1, fontWeight:600 }}>✨ TUS FAVORITAS</p>
                </div>
                {favMatches.map((t, i) => <ResultRow key={t.uri+i} track={t} badge="♥" />)}
              </>
            )}

            {/* Resultados de Spotify */}
            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px' }}>
                <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:0.8, ease:'linear' }}
                  style={{ width:12, height:12, border:'2px solid rgba(var(--tb-primary-rgb),0.2)', borderTopColor:'var(--tb-primary)', borderRadius:'50%' }}
                />
                <p style={{ fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.4)' }}>Buscando en Spotify...</p>
              </div>
            )}
            {!loading && spotifyOnly.length > 0 && (
              <>
                {favMatches.length > 0 && (
                  <div style={{ padding:'7px 10px 3px', borderTop: favMatches.length ? '1px solid rgba(var(--tb-primary-rgb),0.08)' : 'none' }}>
                    <p style={{ fontSize:9, color:'rgba(var(--tb-primary-rgb),0.4)', letterSpacing:1 }}>EN SPOTIFY</p>
                  </div>
                )}
                {spotifyOnly.map((t, i) => <ResultRow key={t.uri+i} track={t} />)}
              </>
            )}
            {!loading && favMatches.length === 0 && spotifyOnly.length === 0 && (
              <p style={{ textAlign:'center', fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.3)', padding:'16px 0' }}>Sin resultados</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TitleBar() {
  const { activeTheme } = useAppStore()
  const themeEmoji = getTheme(activeTheme).data.emoji
  return (
    <div className="drag-region flex-shrink-0 flex items-center justify-between px-3"
      style={{ height:46, zIndex:10, position:'relative',
        background:'var(--tb-gradient-titlebar)',
        borderBottom:'1px solid rgba(var(--tb-primary-rgb),0.2)',
      }}
    >
      {/* Línea dorada inferior */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1,
        background:'linear-gradient(90deg, transparent, rgba(var(--tb-primary-rgb),0.6) 30%, rgba(var(--tb-accent-rgb),0.8) 50%, rgba(var(--tb-primary-rgb),0.6) 70%, transparent)',
      }} />
      {/* Logo */}
      <div className="flex items-center gap-2" style={{ flexShrink:0 }}>
        <motion.span animate={{ textShadow:['0 0 8px rgba(var(--tb-accent-rgb),0.4)','0 0 20px rgba(var(--tb-accent-rgb),0.8)','0 0 8px rgba(var(--tb-accent-rgb),0.4)'] }}
          transition={{ duration:3, repeat:Infinity }}
          style={{ fontSize:15, lineHeight:1 }}
        >{themeEmoji}</motion.span>
        <span style={{ fontFamily:'var(--tb-font-heading)', fontSize:17,
          color:'rgba(var(--tb-primary-rgb),0.95)', letterSpacing:1,
          textShadow:'0 0 20px rgba(var(--tb-primary-rgb),0.4)', whiteSpace:'nowrap',
        }}>TupperBeats</span>
      </div>
      {/* Búsqueda global — centro */}
      <GlobalSearch />
      {/* Controles ventana */}
      <div className="flex items-center gap-1.5 no-drag" style={{ flexShrink:0 }}>
        {[
          { action:()=>window.electronAPI?.minimize(), color:'#F5A623', title:'Minimizar' },
          { action:()=>window.electronAPI?.maximize(), color:'#7ED321', title:'Maximizar' },
          { action:()=>window.electronAPI?.close(),   color:'#D0021B', title:'Cerrar al tray' },
        ].map(({ action, color, title }) => (
          <motion.button key={title} onClick={action} title={title}
            className="flex-shrink-0 rounded-full no-drag"
            style={{ width:13, height:13, background:color, boxShadow:`0 0 6px ${color}55` }}
            whileHover={{ scale:1.35, boxShadow:`0 0 12px ${color}` }}
            whileTap={{ scale:0.8 }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Glass Card ───────────────────────────────────────────────────────────────
function Card({ title, icon: Icon, children, className='', glowing=false }) {
  return (
    <motion.div
      className={`rounded-2xl border overflow-hidden ${className}`}
      style={{
        background:'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(var(--tb-primary-rgb),0.02) 100%)',
        borderColor:'rgba(var(--tb-primary-rgb),0.15)',
        backdropFilter:'blur(8px)',
        boxShadow:'0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(var(--tb-primary-rgb),0.08)',
        animation: glowing ? 'tb-glow-pulse 4s ease-in-out infinite' : undefined,
        position:'relative', zIndex:1,
      }}
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
    >
      {title && (
        <div className="flex items-center gap-2.5 px-5 py-3"
          style={{ borderBottom:'1px solid rgba(var(--tb-primary-rgb),0.08)',
            background:'linear-gradient(90deg, rgba(var(--tb-primary-rgb),0.06), transparent)',
          }}
        >
          {Icon && <Icon size={13} style={{ color:'rgba(var(--tb-primary-rgb),0.7)', flexShrink:0 }} />}
          <span style={{ fontSize:11, fontWeight:600, color:'rgba(var(--tb-primary-rgb),0.8)',
            letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'serif',
          }}>{title}</span>
          {/* Shimmer decorativo en el título */}
          <div style={{ flex:1, height:1,
            background:'linear-gradient(90deg, rgba(var(--tb-primary-rgb),0.2), transparent)',
          }} />
        </div>
      )}
      <div className="p-4">{children}</div>
    </motion.div>
  )
}

// ─── Track Row ────────────────────────────────────────────────────────────────
function TrackRow({ track, index, onPlay, contextUri }) {
  const [hov, setHov] = useState(false)
  const [queued, setQueued] = useState(false)

  const addQ = async (e) => {
    e.stopPropagation()
    await apiAddToQueue(track.uri)
    setQueued(true)
    setTimeout(() => setQueued(false), 1800)
  }

  return (
    <motion.div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onPlay(track.uri, contextUri)}
      className="no-drag"
      style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 10px',
        borderRadius:10, cursor:'pointer',
        background: hov ? 'linear-gradient(90deg, rgba(var(--tb-primary-rgb),0.1), rgba(var(--tb-primary-rgb),0.05))' : 'transparent',
        transition:'background 0.15s',
        borderBottom:'1px solid rgba(255,255,255,0.02)',
      }}
      whileTap={{ scale:0.99 }}
    >
      <div style={{ width:26, textAlign:'center', flexShrink:0,
        fontSize:10, color: hov ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.25)',
        transition:'color 0.15s',
      }}>
        {hov ? '▶' : index + 1}
      </div>
      {track.albumArt && (
        <motion.img src={track.albumArt} alt="" whileHover={{ scale:1.05 }}
          style={{ width:32, height:32, borderRadius:6, objectFit:'cover', flexShrink:0,
            border:'1px solid rgba(var(--tb-primary-rgb),0.25)',
            boxShadow: hov ? '0 2px 12px rgba(var(--tb-primary-rgb),0.3)' : 'none',
            transition:'box-shadow 0.2s',
          }}
        />
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:12, color: hov ? 'var(--tb-textLight)' : 'rgba(var(--tb-textLight-rgb),0.85)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500,
          transition:'color 0.15s',
        }}>{track.name}</p>
        <p style={{ fontSize:10, color:'rgba(var(--tb-textLight-rgb),0.35)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1,
        }}>{track.artist}</p>
      </div>
      <p style={{ fontSize:10, color:'rgba(var(--tb-textLight-rgb),0.2)', flexShrink:0, marginRight:4 }}>
        {track.duration ? `${Math.floor(track.duration/60000)}:${String(Math.floor((track.duration%60000)/1000)).padStart(2,'0')}` : ''}
      </p>
      {hov && (
        <motion.button initial={{ opacity:0, scale:0.7 }} animate={{ opacity:1, scale:1 }}
          onClick={addQ} className="no-drag" title="Agregar a cola"
          style={{ flexShrink:0,
            background: queued ? 'rgba(74,222,128,0.15)' : 'rgba(var(--tb-primary-rgb),0.1)',
            border:`1px solid ${queued ? 'rgba(74,222,128,0.4)' : 'rgba(var(--tb-primary-rgb),0.3)'}`,
            borderRadius:6, padding:'3px 6px', cursor:'pointer',
            color: queued ? '#4ade80' : 'rgba(var(--tb-primary-rgb),0.9)',
            display:'flex', alignItems:'center', transition:'all 0.2s',
          }}
        >
          {queued ? <IconCheck size={11} /> : <IconQueueAdd size={11} />}
        </motion.button>
      )}
    </motion.div>
  )
}

// ─── Album Row ────────────────────────────────────────────────────────────────
function AlbumRow({ album, onPlay, onSelect }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="no-drag"
      style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 10px',
        borderRadius:10, cursor:'pointer',
        background: hov ? 'linear-gradient(90deg, rgba(var(--tb-primary-rgb),0.1), rgba(var(--tb-primary-rgb),0.05))' : 'transparent',
        transition:'background 0.15s',
        borderBottom:'1px solid rgba(255,255,255,0.02)',
      }}
      whileTap={{ scale:0.99 }}
    >
      {album.imageUrl
        ? <motion.img src={album.imageUrl} alt="" whileHover={{ scale:1.08 }}
            style={{ width:42, height:42, borderRadius:8, objectFit:'cover', flexShrink:0,
              border:'1px solid rgba(var(--tb-primary-rgb),0.25)',
              boxShadow: hov ? '0 4px 16px rgba(var(--tb-primary-rgb),0.3)' : 'none',
              transition:'box-shadow 0.2s',
            }}
          />
        : <div style={{ width:42, height:42, borderRadius:8, flexShrink:0,
            background:'rgba(var(--tb-primary-rgb),0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
          }}>💿</div>
      }
      <div style={{ flex:1, minWidth:0 }} onClick={() => onSelect && onSelect(album)}>
        <p style={{ fontSize:12, color: hov ? 'var(--tb-textLight)' : 'rgba(var(--tb-textLight-rgb),0.85)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500,
          transition:'color 0.15s',
        }}>{album.name}</p>
        <p style={{ fontSize:10, color:'rgba(var(--tb-textLight-rgb),0.35)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>{album.artist} · {album.year}</p>
      </div>
      <AnimatePresence>
        {hov && (
          <motion.div initial={{ opacity:0, x:6 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:6 }}
            className="flex gap-1.5"
          >
            <motion.button onClick={(e) => { e.stopPropagation(); onPlay(album.uri) }}
              className="no-drag"
              style={{ background:'rgba(var(--tb-primary-rgb),0.18)', border:'1px solid rgba(var(--tb-primary-rgb),0.35)',
                borderRadius:7, padding:'3px 10px', fontSize:11, color:'var(--tb-accent)', cursor:'pointer',
              }}
              whileTap={{ scale:0.93 }}
            >▶</motion.button>
            <motion.button onClick={(e) => { e.stopPropagation(); onSelect && onSelect(album) }}
              className="no-drag"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:7, padding:'3px 10px', fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.55)', cursor:'pointer',
              }}
              whileTap={{ scale:0.93 }}
            >Ver →</motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Playlist Row ─────────────────────────────────────────────────────────────
function PlaylistRow({ playlist, onSelect, onPlay }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="no-drag"
      style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 10px',
        borderRadius:10, cursor:'pointer',
        background: hov ? 'linear-gradient(90deg, rgba(var(--tb-primary-rgb),0.1), rgba(var(--tb-primary-rgb),0.05))' : 'transparent',
        transition:'background 0.15s',
        borderBottom:'1px solid rgba(255,255,255,0.02)',
      }}
      whileTap={{ scale:0.99 }}
    >
      {playlist.imageUrl
        ? <motion.img src={playlist.imageUrl} alt="" whileHover={{ scale:1.08 }}
            style={{ width:42, height:42, borderRadius:8, objectFit:'cover', flexShrink:0,
              border:'1px solid rgba(var(--tb-primary-rgb),0.25)',
              boxShadow: hov ? '0 4px 16px rgba(var(--tb-primary-rgb),0.3)' : 'none',
              transition:'box-shadow 0.2s',
            }}
          />
        : <div style={{ width:42, height:42, borderRadius:8, flexShrink:0,
            background:'rgba(var(--tb-primary-rgb),0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
          }}>🎵</div>
      }
      <div style={{ flex:1, minWidth:0 }} onClick={() => onSelect(playlist)}>
        <p style={{ fontSize:12, color: hov ? 'var(--tb-textLight)' : 'rgba(var(--tb-textLight-rgb),0.85)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500,
          transition:'color 0.15s',
        }}>{playlist.name}</p>
        <p style={{ fontSize:10, color:'rgba(var(--tb-textLight-rgb),0.35)' }}>
          {playlist.total > 0 ? `${playlist.total} canciones` : 'Ver canciones →'}
        </p>
      </div>
      <AnimatePresence>
        {hov && (
          <motion.div initial={{ opacity:0, x:6 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:6 }}
            className="flex gap-1.5"
          >
            <motion.button onClick={(e) => { e.stopPropagation(); onPlay(playlist.uri) }}
              className="no-drag"
              style={{ background:'rgba(var(--tb-primary-rgb),0.18)', border:'1px solid rgba(var(--tb-primary-rgb),0.35)',
                borderRadius:7, padding:'3px 10px', fontSize:11, color:'var(--tb-accent)', cursor:'pointer',
              }}
              whileTap={{ scale:0.93 }}
            >▶ Play</motion.button>
            <motion.button onClick={() => onSelect(playlist)} className="no-drag"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:7, padding:'3px 10px', fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.55)', cursor:'pointer',
              }}
              whileTap={{ scale:0.93 }}
            >Ver →</motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── SearchInput ──────────────────────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder='Buscar...' }) {
  return (
    <div style={{ position:'relative', marginBottom:10 }}>
      <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
        fontSize:11, color:'rgba(var(--tb-primary-rgb),0.5)', pointerEvents:'none',
      }}>🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="no-drag"
        style={{ width:'100%', boxSizing:'border-box',
          padding:'8px 36px 8px 32px',
          background:'rgba(255,255,255,0.04)',
          border:'1px solid rgba(var(--tb-primary-rgb),0.18)',
          borderRadius:10, outline:'none',
          fontSize:12, color:'rgba(var(--tb-textLight-rgb),0.9)',
          fontFamily:'inherit', transition:'border-color 0.2s',
        }}
        onFocus={e => { e.target.style.borderColor='rgba(var(--tb-primary-rgb),0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(var(--tb-primary-rgb),0.06)' }}
        onBlur={e => { e.target.style.borderColor='rgba(var(--tb-primary-rgb),0.18)'; e.target.style.boxShadow='none' }}
      />
      {value && (
        <button onClick={() => onChange('')} className="no-drag"
          style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
            background:'rgba(255,255,255,0.08)', border:'none', cursor:'pointer',
            color:'rgba(var(--tb-textLight-rgb),0.5)', width:18, height:18, borderRadius:'50%',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:10,
          }}
        >✕</button>
      )}
    </div>
  )
}

// ─── Acordeón ─────────────────────────────────────────────────────────────────
function Accordion({ title, defaultOpen=true, children, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border:'1px solid rgba(var(--tb-primary-rgb),0.12)', borderRadius:14,
      background:'rgba(255,255,255,0.02)', overflow:'hidden',
      animation: open ? 'tb-border-glow 6s ease-in-out infinite' : undefined,
    }}>
      <motion.button onClick={() => setOpen(!open)} className="no-drag"
        style={{ width:'100%', display:'flex', alignItems:'center', gap:8,
          padding:'11px 16px', cursor:'pointer',
          background: open ? 'linear-gradient(90deg, rgba(var(--tb-primary-rgb),0.07), transparent)' : 'transparent',
          border:'none', color:'rgba(var(--tb-primary-rgb),0.8)', textAlign:'left',
          transition:'background 0.2s',
        }}
        whileTap={{ scale:0.99 }}
      >
        <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration:0.2 }}
          style={{ fontSize:9, opacity:0.6, display:'inline-block' }}
        >▼</motion.span>
        <span style={{ fontSize:12, fontWeight:600, letterSpacing:'0.06em',
          textTransform:'uppercase', fontFamily:'serif', flex:1,
        }}>{title}</span>
        {badge && (
          <motion.span initial={{ scale:0 }} animate={{ scale:1 }}
            style={{ fontSize:10, background:'rgba(var(--tb-primary-rgb),0.12)',
              border:'1px solid rgba(var(--tb-primary-rgb),0.25)', borderRadius:20,
              padding:'1px 8px', color:'rgba(var(--tb-primary-rgb),0.7)',
            }}
          >{badge}</motion.span>
        )}
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="ac-content"
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:0.22, ease:'easeInOut' }}
            style={{ overflow:'hidden' }}
          >
            <div style={{ padding:'2px 16px 16px' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Carrusel "Para Tupper" ───────────────────────────────────────────────────
function TupperCarousel({ messages }) {
  const { activeTheme } = useAppStore()
  const theme = getTheme(activeTheme)
  const Mascot = theme.Mascot
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState(1)

  useEffect(() => {
    const t = setInterval(() => { setDir(1); setIdx(i => (i+1) % messages.length) }, 5000)
    return () => clearInterval(t)
  }, [messages.length])

  const msg = messages[idx]

  return (
    <motion.div
      animate={{ boxShadow:['0 0 14px rgba(var(--tb-primary-rgb),0.12)','0 0 32px rgba(var(--tb-primary-rgb),0.3)','0 0 14px rgba(var(--tb-primary-rgb),0.12)'] }}
      transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut' }}
      style={{ borderRadius:16, padding:'18px 18px 15px', position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg, rgba(var(--tb-secondary-rgb),0.15), rgba(var(--tb-primary-rgb),0.08), rgba(30,15,55,0.4))',
        border:'1px solid rgba(var(--tb-primary-rgb),0.25)', textAlign:'center',
      }}
    >
      {/* Mascota decorativa del tema en el fondo del carrusel */}
      <div style={{ position:'absolute', bottom:-10, right:-10, opacity:0.7, zIndex:0 }}>
        <Mascot width={100} opacity={0.25} />
      </div>
      <p style={{ fontFamily:'var(--tb-font-heading)', fontSize:22, color:'var(--tb-primary)',
        marginBottom:10, textShadow:'0 0 20px rgba(var(--tb-primary-rgb),0.6)', position:'relative', zIndex:1,
      }}>Para Tupper</p>
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity:0, x:28*dir }} animate={{ opacity:1, x:0 }}
          exit={{ opacity:0, x:-28*dir }} transition={{ duration:0.3 }}
          style={{ position:'relative', zIndex:1 }}
        >
          {msg.emoji && <p style={{ fontSize:20, marginBottom:8 }}>{msg.emoji}</p>}
          <p style={{ fontSize:12, color:'rgba(var(--tb-textLight-rgb),0.7)', lineHeight:1.8,
            fontStyle: msg.text.startsWith('"') ? 'italic' : 'normal',
          }}>{msg.text}</p>
          {msg.from && <p style={{ marginTop:10, fontSize:11, color:'rgba(var(--tb-primary-rgb),0.6)' }}>— {msg.from}</p>}
        </motion.div>
      </AnimatePresence>
      <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:12, position:'relative', zIndex:1 }}>
        {messages.map((_,i) => (
          <motion.button key={i} onClick={() => { setDir(i>idx?1:-1); setIdx(i) }}
            className="no-drag"
            animate={{ width: i===idx ? 18 : 5 }}
            style={{ height:4, borderRadius:3,
              background: i===idx ? 'var(--tb-primary)' : 'rgba(var(--tb-primary-rgb),0.25)',
              border:'none', cursor:'pointer', padding:0,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ─── Shuffle/Repeat ───────────────────────────────────────────────────────────
function PlaybackModeControls() {
  const { shuffle, setShuffle, repeatMode:repeat, setRepeatMode:setRepeat } = useAppStore()
  useEffect(() => {
    fetchPlayerState().then(s => { if (s) { setShuffle(s.shuffle); setRepeat(s.repeat) } })
    // Sincronización instantánea si el cambio viene de la ventana de notificación
    window.electronAPI?.onPlaybackModeChanged?.((data) => {
      if (data?.shuffle !== undefined) setShuffle(data.shuffle)
      if (data?.repeat  !== undefined) setRepeat(data.repeat)
    })
    return () => window.electronAPI?.removeAllListeners?.('playback-mode-changed')
  }, [])

  const toggleShuffle = async () => {
    const n=!shuffle; setShuffle(n); await apiSetShuffle(n)
    window.electronAPI?.broadcastPlaybackMode?.({ shuffle: n })
  }
  const cycleRepeat   = async () => {
    const n = repeat==='off' ? 'context' : repeat==='context' ? 'track' : 'off'
    setRepeat(n); await apiSetRepeat(n)
    window.electronAPI?.broadcastPlaybackMode?.({ repeat: n })
  }

  const btn = (active, onClick, children, title) => (
    <motion.button onClick={onClick} className="no-drag" title={title}
      style={{ display:'flex', alignItems:'center', justifyContent:'center',
        padding:'6px 12px', borderRadius:10, cursor:'pointer', gap:6,
        fontSize:11, fontWeight:500, transition:'all 0.18s',
        color: active ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.35)',
        background: active ? 'rgba(var(--tb-primary-rgb),0.12)' : 'rgba(255,255,255,0.03)',
        border:`1px solid ${active ? 'rgba(var(--tb-primary-rgb),0.4)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: active ? '0 0 12px rgba(var(--tb-primary-rgb),0.15)' : 'none',
      }}
      whileHover={{ scale:1.04 }} whileTap={{ scale:0.93 }}
    >{children}</motion.button>
  )

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      {btn(shuffle, toggleShuffle, <><IconShuffle size={13}/><span>Aleatorio</span></>, 'Orden aleatorio')}
      {btn(repeat!=='off', cycleRepeat,
        <>{repeat==='track' ? <IconRepeatOne size={13}/> : <IconRepeatContext size={13}/>}
          <span>{repeat==='off'?'Repetir':repeat==='context'?'Playlist':'Canción'}</span>
        </>,
        repeat==='off'?'Sin repetir':repeat==='context'?'Repitiendo playlist':'Repitiendo canción'
      )}
    </div>
  )
}

// ─── Spinner / Empty ──────────────────────────────────────────────────────────
function Spinner({ text }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 0', gap:10 }}>
      <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1.2, ease:'linear' }}
        style={{ width:22, height:22, border:'2px solid rgba(var(--tb-primary-rgb),0.15)',
          borderTopColor:'var(--tb-primary)', borderRadius:'50%',
          boxShadow:'0 0 10px rgba(var(--tb-primary-rgb),0.2)',
        }}
      />
      {text && <p style={{ fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.35)', fontStyle:'italic' }}>{text}</p>}
    </div>
  )
}

function Empty({ text }) {
  return (
    <div style={{ textAlign:'center', padding:'24px 0' }}>
      <p style={{ fontSize:12, color:'rgba(var(--tb-textLight-rgb),0.28)', fontStyle:'italic' }}>✦ {text} ✦</p>
    </div>
  )
}

// ─── Sección Reproductor ──────────────────────────────────────────────────────
// La carga completa de "Me gusta" (paginación vía IPC) ahora vive en
// src/lib/savedTracks.js — se comparte con el loader inicial de la app
// (App.jsx), que precarga este cache ni bien arranca TupperBeats.

function PlayerSection({ track }) {
  const { playUri, playTrackInContext, playQueueIndex, startLikedQueue } = useSpotifyControls()

  // Cache permanente desde Zustand
  const {
    savedTracksCache, savedTracksCacheTotal,
    savedTracksLoading, savedTracksProgress,
    clearSavedTracksCache,
  } = useAppStore()

  const [tab, setTab] = useState('now')
  const [savedAlbums, setSavedAlbums] = useState(null)
  const [queue, setQueue] = useState(null)
  const [playlists, setPlaylists] = useState(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistTracks, setPlaylistTracks] = useState(null)
  const [playlistError, setPlaylistError] = useState(false)
  const [playlistLoading, setPlaylistLoading] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [albumTracks, setAlbumTracks] = useState(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const searchTimerRef = useRef(null)
  const tracksLoadingRef = useRef(false) // evitar doble carga

  // Auto-cargar cola cuando tab='now'
  useEffect(() => {
    if (!track?.id) return
    setQueue(null)
  }, [track?.id])

  useEffect(() => {
    if (tab !== 'now' || queue !== null) return
    let cancelled = false
    setLoading(true)
    fetchQueue().then(res => {
      if (cancelled) return
      if (res?.queue) {
        setQueue(res.queue.slice(0,30).map((i, idx) => ({
          uri:i.uri, name:i.name,
          artist:i.artists?.map(a=>a.name).join(', ')||'',
          albumArt:i.album?.images?.[1]?.url||i.album?.images?.[0]?.url||'',
          duration:i.duration_ms,
          queueIndex: idx, // posición real en la cola (0 = la próxima) — usado para "adelantar" en vez de reemplazar la reproducción
        })))
      } else setQueue([])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [tab, queue])

  // Auto-cargar todas las canciones cuando se entra al tab 'tracks'
  // Normalmente ya está lista (o en curso) gracias a la precarga del loader
  // inicial de la app — esto es solo un respaldo por si esa precarga nunca
  // se disparó (ej. login recién hecho en esta misma sesión).
  useEffect(() => {
    if (tab !== 'tracks') return
    if (savedTracksCache !== null) return // ya tenemos datos
    startLoadingAllTracks()
  }, [tab])

  const startLoadingAllTracks = useCallback(() => {
    if (tracksLoadingRef.current) return
    tracksLoadingRef.current = true
    ensureSavedTracksLoaded(useAppStore).finally(() => {
      tracksLoadingRef.current = false
    })
  }, [])

  const refreshTracks = useCallback(() => {
    clearSavedTracksCache()
    tracksLoadingRef.current = false
    // El useEffect de arriba se disparará al detectar savedTracksCache=null con tab='tracks'
    // Pero como tab ya es 'tracks', necesitamos llamarlo manualmente
    startLoadingAllTracks()
  }, [startLoadingAllTracks, clearSavedTracksCache])

  const loadTab = useCallback(async (t) => {
    setTab(t)
    setSelectedPlaylist(null); setPlaylistTracks(null); setPlaylistError(false)
    setSelectedAlbum(null); setAlbumTracks(null); setQuery('')

    if (t === 'now') { setQueue(null); return }

    if (t === 'tracks') {
      // El useEffect maneja la carga automática
      return
    }

    if (t === 'albums' && !savedAlbums) {
      setLoading(true)
      const res = await fetchSavedAlbums(0)
      if (res?.items) setSavedAlbums(res.items.map(i => ({
        id:i.album.id, uri:i.album.uri, name:i.album.name,
        artist:i.album.artists.map(a=>a.name).join(', '),
        year:i.album.release_date?.split('-')[0]||'',
        imageUrl:i.album.images?.[1]?.url||i.album.images?.[0]?.url||'',
        total:i.album.total_tracks||0,
      })))
      else setSavedAlbums([])
      setLoading(false)
    }

    if (t === 'playlists' && !playlists) {
      setLoading(true)
      const res = await fetchPlaylists(0)
      if (res?.items) setPlaylists(res.items.map(p => ({
        id:p.id, uri:p.uri, name:p.name,
        total:p.tracks?.total||0,
        imageUrl:p.images?.[0]?.url||'',
      })))
      else setPlaylists([])
      setLoading(false)
    }
  }, [savedAlbums, playlists, savedTracksCache])

  // Abrir playlist — intenta spotifyGet primero; si falla, usa IPC como fallback
  const openPlaylist = useCallback(async (playlist) => {
    setSelectedPlaylist(playlist)
    setPlaylistTracks(null); setPlaylistError(false); setQuery('')
    setPlaylistLoading(true)

    const mapItems = (items) => items
      .filter(i => i.track && i.track.uri)
      .map(i => ({
        uri:i.track.uri, name:i.track.name,
        artist:i.track.artists?.map(a=>a.name).join(', ')||'',
        albumArt:i.track.album?.images?.[1]?.url||i.track.album?.images?.[0]?.url||'',
        duration:i.track.duration_ms,
      }))

    const fetchAll = async (fetchFn) => {
      const all = []
      let offset = 0, total = Infinity
      while (offset < total) {
        const res = await fetchFn(offset)
        if (!res?.items) break
        total = res.total ?? total
        all.push(...mapItems(res.items))
        offset += res.items.length
        if (res.items.length < 100) break
      }
      return all
    }

    let tracks = []
    // Intento 1: spotifyGet (mismo mecanismo que álbumes)
    try {
      tracks = await fetchAll((off) => fetchPlaylistTracks(playlist.id, off))
    } catch { tracks = [] }

    // Intento 2: IPC al main process si spotifyGet falló
    if (tracks.length === 0) {
      try {
        tracks = await fetchAll((off) => window.electronAPI?.getPlaylistTracks?.(playlist.id, off))
      } catch { tracks = [] }
    }

    if (tracks.length > 0) {
      setPlaylistTracks(tracks)
    } else {
      setPlaylistError(true)
      setPlaylistTracks([])
    }
    setPlaylistLoading(false)
  }, [])

  const openAlbum = useCallback(async (album) => {
    setSelectedAlbum(album); setAlbumTracks(null); setQuery('')
    setLoading(true)
    const res = await fetchAlbumTracks(album.id, 0)
    if (res?.items) setAlbumTracks(
      res.items.filter(i=>i.uri).map((i,idx) => ({
        uri:i.uri, name:i.name,
        artist:i.artists?.map(a=>a.name).join(', ')||album.artist,
        albumArt:album.imageUrl, duration:i.duration_ms,
        trackNumber:i.track_number||idx+1,
      }))
    )
    else setAlbumTracks([])
    setLoading(false)
  }, [])

  const handlePlay = useCallback(async (uri, contextUri) => {
    if (contextUri && uri.startsWith('spotify:track:')) await playTrackInContext(contextUri, uri)
    else await playUri(uri)
  }, [playUri, playTrackInContext])

  // Tocar una canción DESDE LA COLA adelanta la cola actual hasta ese punto,
  // en vez de reemplazarla por esa canción sola (que "mataba" el resto de la cola).
  const handlePlayFromQueue = useCallback(async (queueIndex) => {
    await playQueueIndex(queueIndex)
  }, [playQueueIndex])

  // Tocar una canción DESDE "Mis canciones" activa el modo manual de cola
  // local (ver useSpotifyControls.js): Siguiente/Anterior van a avanzar por
  // esta lista sin tocar la cola real de Spotify. La primera versión de esto
  // encolaba TODO "Me gusta" de una via /me/player/queue — eso terminaba
  // rompiendo la cola real del dispositivo (dejaba de poder reproducir,
  // saltar o adelantar nada) al llegar a cierta cantidad de canciones
  // encoladas, así que ahora el avance es 1 por 1 y manejado por la app.
  const handlePlayLiked = useCallback((uri) => {
    if (!savedTracksCache) return
    const startIdx = savedTracksCache.findIndex(t => t.uri === uri)
    if (startIdx === -1) return
    startLikedQueue(savedTracksCache.map(t => t.uri), startIdx)
  }, [savedTracksCache, startLikedQueue])

  const filterByQuery = useCallback((items, fields=['name','artist']) => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(item => fields.some(f => item[f]?.toLowerCase().includes(q)))
  }, [query])

  // Búsqueda — usa searchSpotify → spotifyGet → getToken (IPC con auto-refresh)
  // Mismo path que fetchAlbumTracks que sí funciona
  const handleSearchChange = useCallback((val) => {
    setSearchQuery(val); setSearchError(false)
    clearTimeout(searchTimerRef.current)
    if (!val.trim()) { setSearchResults(null); return }
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const items = await searchSpotify(val.trim(), 10)
        if (Array.isArray(items)) {
          setSearchResults(items.map(i => ({
            uri:i.uri, name:i.name,
            artist:i.artists?.map(a=>a.name).join(', ')||'',
            albumArt:i.album?.images?.[1]?.url||i.album?.images?.[0]?.url||'',
            duration:i.duration_ms,
          })))
          setSearchError(false)
        } else {
          setSearchResults([])
          setSearchError(true)
        }
      } catch {
        setSearchResults([])
        setSearchError(true)
      }
      setSearchLoading(false)
    }, 400)
  }, [])

  const tabs = [
    { id:'now',       label:'🎵',  name:'Ahora'     },
    { id:'playlists', label:'📜',  name:'Playlists' },
    { id:'tracks',    label:'🎶',  name:'Canciones' },
    { id:'albums',    label:'💿',  name:'Álbumes'   },
  ]

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div style={{ display:'flex', gap:2, padding:'4px',
        background:'rgba(255,255,255,0.02)',
        borderRadius:14, border:'1px solid rgba(var(--tb-primary-rgb),0.1)',
      }}>
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <motion.button key={t.id} onClick={() => loadTab(t.id)} className="no-drag"
              style={{ flex:1, padding:'7px 4px', borderRadius:11,
                fontSize:10, fontWeight: active ? 600 : 400,
                color: active ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.4)',
                background: active ? 'rgba(var(--tb-primary-rgb),0.13)' : 'transparent',
                border:`1px solid ${active ? 'rgba(var(--tb-primary-rgb),0.4)' : 'transparent'}`,
                cursor:'pointer', transition:'all 0.15s',
                boxShadow: active ? '0 0 14px rgba(var(--tb-primary-rgb),0.12)' : 'none',
              }}
              whileTap={{ scale:0.95 }}
            >
              <span style={{ fontSize:12 }}>{t.label}</span>
              <span style={{ display:'block', fontSize:9, marginTop:1 }}>{t.name}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Tab: Ahora */}
      {tab === 'now' && (
        <div className="space-y-2">
          <Card title="Reproduciendo ahora" icon={IconMusic} glowing> 
            {!track
              ? <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 0', gap:12 }}>
                  <motion.div animate={{ rotate:[0,5,-5,0], scale:[1,1.08,1] }}
                    transition={{ duration:4, repeat:Infinity }}
                    style={{ fontSize:32 }}
                  >🎵</motion.div>
                  <p style={{ fontSize:13, color:'rgba(var(--tb-textLight-rgb),0.4)', fontFamily:'serif' }}>Sin reproducción activa</p>
                  <p style={{ fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.22)' }}>Abre Spotify y reproduce algo ✨</p>
                </div>
              : <>
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                    <motion.div style={{ position:'relative', flexShrink:0 }}>
                      <motion.img key={track.id} src={track.albumArt} alt="Album"
                        initial={{ scale:0.8, opacity:0, rotate:-10 }}
                        animate={{ scale:1, opacity:1, rotate:0 }}
                        transition={{ type:'spring', stiffness:250, damping:20 }}
                        style={{ width:72, height:72, borderRadius:12, objectFit:'cover',
                          border:'2px solid rgba(var(--tb-primary-rgb),0.4)',
                          boxShadow:'0 6px 24px rgba(0,0,0,0.5), 0 0 20px rgba(var(--tb-primary-rgb),0.2)',
                        }}
                      />
                    </motion.div>
                    <div style={{ minWidth:0, flex:1 }}>
                      <motion.p key={"n-"+track.id}
                        initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                        style={{ fontSize:14, fontWeight:700, color:'var(--tb-accent)',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          textShadow:'0 0 14px rgba(var(--tb-accent-rgb),0.4)',
                        }}
                      >{track.name}</motion.p>
                      <motion.p key={"a-"+track.id}
                        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.07 }}
                        style={{ fontSize:12, color:'rgba(var(--tb-textLight-rgb),0.55)', marginTop:3,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                        }}
                      >{track.artist}</motion.p>
                      <p style={{ fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.25)', marginTop:2,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>{track.album}</p>
                    </div>
                  </div>
                  <ProgressBar />
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', margin:'10px 0' }}>
                    <PlayerControls size="md" />
                    <VolumeSlider />
                  </div>
                  <PlaybackModeControls />
                </>
            }
          </Card>

          {/* <Accordion title="Buscar en Spotify" defaultOpen={false}>
            <div style={{ position:'relative', marginBottom:12 }}>
              <input value={searchQuery} onChange={e => handleSearchChange(e.target.value)}
                placeholder="Buscar cualquier canción..."
                className="no-drag"
                style={{ width:'100%', boxSizing:'border-box',
                  padding:'9px 36px 9px 12px',
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(var(--tb-primary-rgb),0.2)',
                  borderRadius:12, outline:'none',
                  fontSize:12, color:'rgba(var(--tb-textLight-rgb),0.9)',
                  fontFamily:'inherit',
                }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults(null); setSearchError(false) }}
                  className="no-drag"
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'rgba(255,255,255,0.08)', border:'none', cursor:'pointer',
                    color:'rgba(var(--tb-textLight-rgb),0.5)', width:20, height:20, borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:11,
                  }}
                >✕</button>
              )}
            </div>
            {searchLoading
              ? <Spinner text="Buscando..." />
              : searchError
                ? <div style={{ textAlign:'center', padding:'16px 0' }}>
                    <p style={{ fontSize:12, color:'rgba(248,113,113,0.7)', marginBottom:6 }}>Error al buscar</p>
                    <p style={{ fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.25)' }}>Verifica tu conexión o reconecta Spotify</p>
                  </div>
                : !searchResults
                  ? <Empty text="Escribe algo para buscar" />
                  : searchResults.length === 0
                    ? <Empty text="Sin resultados" />
                    : <div style={{ maxHeight:280, overflowY:'auto' }}>
                        {searchResults.map((t,i) => <TrackRow key={t.uri+i} track={t} index={i} onPlay={handlePlay} />)}
                      </div>
            }
          </Accordion> */}

          <Card title="Siguiente en cola" icon={IconMusic}
            badge={queue && queue.length ? String(queue.length) : undefined}
          >
            {loading && !queue
              ? <Spinner text="Cargando cola..." />
              : !queue ? <Empty text="Cargando..." />
              : queue.length === 0 ? <Empty text="La cola está vacía" />
              : <>
                  <SearchInput value={query} onChange={setQuery} placeholder="Buscar en cola..." />
                  <div style={{ maxHeight:220, overflowY:'auto' }}>
                    {filterByQuery(queue).map((t,i) => (
                      <TrackRow key={t.uri+i} track={t} index={i}
                        onPlay={() => handlePlayFromQueue(t.queueIndex)}
                      />
                    ))}
                    {filterByQuery(queue).length===0 && <Empty text={"Sin resultados para " + query} />}
                  </div>
                </>
            }
          </Card>
        </div>
      )}

      {/* Tab: Playlists */}
      {tab === 'playlists' && (
        <Card title={selectedPlaylist ? ('📜 ' + selectedPlaylist.name) : 'Mis Playlists'} icon={IconMusic}>
          {selectedPlaylist && (
            <motion.button initial={{ x:-8, opacity:0 }} animate={{ x:0, opacity:1 }}
              onClick={() => { setSelectedPlaylist(null); setPlaylistTracks(null); setPlaylistError(false); setQuery('') }}
              className="no-drag"
              style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12,
                background:'rgba(var(--tb-primary-rgb),0.08)', border:'1px solid rgba(var(--tb-primary-rgb),0.2)',
                borderRadius:8, padding:'5px 12px', fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.6)', cursor:'pointer',
              }}
              whileTap={{ scale:0.97 }}
            >← Volver</motion.button>
          )}
          {(loading || playlistLoading) ? <Spinner text="Cargando..." />
            : selectedPlaylist ? (
              playlistError
                ? <div>
                    <Empty text="No se pudieron cargar las canciones" />
                  </div>
                : !playlistTracks ? <Spinner text="Cargando canciones..." />
                : playlistTracks.length === 0 ? <Empty text="Playlist vacía" />
                : <>
                    <p style={{ fontSize:11, color:'rgba(var(--tb-primary-rgb),0.5)', marginBottom:8 }}>
                      {playlistTracks.length} canciones
                    </p>
                    <SearchInput value={query} onChange={setQuery} placeholder="Buscar en playlist..." />
                    <div style={{ maxHeight:300, overflowY:'auto' }}>
                      {filterByQuery(playlistTracks).map((t,i) => (
                        <TrackRow key={t.uri+i} track={t} index={i}
                          onPlay={handlePlay} contextUri={selectedPlaylist.uri}
                        />
                      ))}
                    </div>
                  </>
            ) : (
              !playlists ? <Empty text="No se pudieron cargar las playlists" />
              : playlists.length === 0 ? <Empty text="No tienes playlists" />
              : <>
                  <SearchInput value={query} onChange={setQuery} placeholder="Buscar playlist..." />
                  <div style={{ maxHeight:320, overflowY:'auto' }}>
                    {filterByQuery(playlists, ['name']).map(p => (
                      <PlaylistRow key={p.id} playlist={p} onSelect={openPlaylist}
                        onPlay={(uri) => handlePlay(uri)}
                      />
                    ))}
                  </div>
                </>
            )
          }
        </Card>
      )}

      {/* Tab: Canciones — cache permanente, pre-carga automática, nunca se borra */}
      {tab === 'tracks' && (
        <Card
          title={savedTracksCache
            ? ('Mis canciones (' + savedTracksCache.length + (savedTracksCacheTotal > savedTracksCache.length ? ' / ' + savedTracksCacheTotal : '') + ')')
            : 'Mis canciones'}
          icon={IconMusic}
        >
          {/* Header con botón actualizar */}
          {savedTracksCache && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <p style={{ fontSize:11, color:'rgba(var(--tb-primary-rgb),0.4)' }}>
                {savedTracksCache.length} canciones
              </p>
              <motion.button onClick={refreshTracks} className="no-drag"
                title="Actualizar lista"
                style={{ display:'flex', alignItems:'center', gap:5,
                  background:'rgba(var(--tb-primary-rgb),0.07)', border:'1px solid rgba(var(--tb-primary-rgb),0.2)',
                  borderRadius:8, padding:'4px 10px', fontSize:11,
                  color:'rgba(var(--tb-primary-rgb),0.7)', cursor:'pointer',
                }}
                whileHover={{ scale:1.05 }} whileTap={{ scale:0.93 }}
              >
                <motion.span
                  animate={savedTracksLoading ? { rotate:360 } : { rotate:0 }}
                  transition={savedTracksLoading ? { repeat:Infinity, duration:1, ease:'linear' } : {}}
                  style={{ display:'inline-block' }}
                >↻</motion.span>
                {' '}Actualizar
              </motion.button>
            </div>
          )}

          {/* Barra de progreso de carga */}
          {savedTracksLoading && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ marginBottom:12, padding:'10px 12px', borderRadius:10,
                background:'rgba(var(--tb-primary-rgb),0.06)', border:'1px solid rgba(var(--tb-primary-rgb),0.15)',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1, ease:'linear' }}
                  style={{ width:14, height:14, border:'2px solid rgba(var(--tb-primary-rgb),0.2)',
                    borderTopColor:'var(--tb-primary)', borderRadius:'50%', flexShrink:0,
                  }}
                />
                <p style={{ fontSize:11, color:'rgba(var(--tb-primary-rgb),0.8)' }}>
                  {savedTracksProgress
                    ? ('Cargando ' + savedTracksProgress.loaded + ' de ' + savedTracksProgress.total + ' canciones...')
                    : 'Iniciando carga...'}
                </p>
              </div>
              {savedTracksProgress && savedTracksProgress.total > 0 && (
                <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                  <motion.div
                    style={{ height:'100%', background:'linear-gradient(90deg, var(--tb-primary), var(--tb-accent))', borderRadius:2 }}
                    animate={{ width: Math.round((savedTracksProgress.loaded / savedTracksProgress.total) * 100) + '%' }}
                    transition={{ ease:'linear' }}
                  />
                </div>
              )}
            </motion.div>
          )}

          {!savedTracksCache && !savedTracksLoading
            ? <Empty text="Cargando canciones..." />
            : !savedTracksCache ? null
            : savedTracksCache.length === 0 ? <Empty text="No tienes canciones guardadas" />
            : <>
                <SearchInput value={query} onChange={setQuery} placeholder="Buscar entre tus canciones..." />
                <div style={{ maxHeight:340, overflowY:'auto' }}>
                  {filterByQuery(savedTracksCache).map((t,i) => (
                    <TrackRow key={t.uri+i} track={t} index={i} onPlay={(uri) => handlePlayLiked(uri)} />
                  ))}
                  {filterByQuery(savedTracksCache).length===0 && <Empty text={"Sin resultados para " + query} />}
                </div>
              </>
          }
        </Card>
      )}

      {/* Tab: Álbumes */}
      {tab === 'albums' && (
        <Card title={selectedAlbum ? ('💿 ' + selectedAlbum.name) : 'Mis álbumes guardados'} icon={IconMusic}>
          {selectedAlbum && (
            <motion.button initial={{ x:-8, opacity:0 }} animate={{ x:0, opacity:1 }}
              onClick={() => { setSelectedAlbum(null); setAlbumTracks(null); setQuery('') }}
              className="no-drag"
              style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12,
                background:'rgba(var(--tb-primary-rgb),0.08)', border:'1px solid rgba(var(--tb-primary-rgb),0.2)',
                borderRadius:8, padding:'5px 12px', fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.6)', cursor:'pointer',
              }}
              whileTap={{ scale:0.97 }}
            >← Volver</motion.button>
          )}
          {loading ? <Spinner text="Cargando..." />
            : selectedAlbum ? (
              !albumTracks ? <Empty text="No se pudieron cargar las canciones" />
              : albumTracks.length === 0 ? <Empty text="Álbum vacío" />
              : <>
                  <SearchInput value={query} onChange={setQuery} placeholder="Buscar en álbum..." />
                  <div style={{ maxHeight:300, overflowY:'auto' }}>
                    {filterByQuery(albumTracks).map((t,i) => (
                      <TrackRow key={t.uri+i} track={{ ...t }} index={t.trackNumber-1}
                        onPlay={handlePlay} contextUri={selectedAlbum.uri}
                      />
                    ))}
                  </div>
                </>
            ) : (
              !savedAlbums ? <Empty text="No se pudieron cargar los álbumes" />
              : savedAlbums.length === 0 ? <Empty text="No tienes álbumes guardados" />
              : <>
                  <SearchInput value={query} onChange={setQuery} placeholder="Buscar álbum..." />
                  <div style={{ maxHeight:320, overflowY:'auto' }}>
                    {filterByQuery(savedAlbums, ['name','artist']).map(a => (
                      <AlbumRow key={a.uri} album={a}
                        onPlay={(uri) => handlePlay(uri)} onSelect={openAlbum}
                      />
                    ))}
                  </div>
                </>
            )
          }
        </Card>
      )}
    </div>
  )
}


// ─── Selector de posición con preview visual ──────────────────────────────────
function PositionPicker({ value, onChange }) {
  const positions = [
    { id:'top-left',     label:'↖ Arriba izq.'   },
    { id:'top-right',    label:'↗ Arriba der.'   },
    { id:'bottom-left',  label:'↙ Abajo izq.'    },
    { id:'bottom-right', label:'↘ Abajo der.'    },
  ]

  return (
    <div style={{ position:'relative' }}>
      {/* Mini-pantalla visual */}
      <div style={{ width:'100%', aspectRatio:'16/9', maxHeight:90,
        background:'rgba(0,0,0,0.3)', borderRadius:10,
        border:'1px solid rgba(var(--tb-primary-rgb),0.15)',
        position:'relative', marginBottom:10, overflow:'hidden',
      }}>
        {/* Grid de puntos de posición */}
        {positions.map(p => {
          const active = value === p.id
          const isTop   = p.id.startsWith('top')
          const isLeft  = p.id.endsWith('left')
          return (
            <motion.button key={p.id} onClick={() => onChange(p.id)}
              className="no-drag"
              style={{ position:'absolute',
                top: isTop ? '12%' : undefined, bottom: !isTop ? '12%' : undefined,
                left: isLeft ? '8%' : undefined, right: !isLeft ? '8%' : undefined,
                width:36, height:22, borderRadius:5, cursor:'pointer',
                background: active ? 'rgba(var(--tb-primary-rgb),0.9)' : 'rgba(var(--tb-primary-rgb),0.1)',
                border:`1.5px solid ${active ? 'var(--tb-accent)' : 'rgba(var(--tb-primary-rgb),0.25)'}`,
                boxShadow: active ? '0 0 12px rgba(var(--tb-primary-rgb),0.6)' : 'none',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
              whileHover={{ scale:1.08 }} whileTap={{ scale:0.93 }}
              title={p.label}
            >
              {active && <div style={{ width:6, height:6, borderRadius:1,
                background:'var(--tb-bg)',
              }} />}
            </motion.button>
          )
        })}
        {/* Texto central */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <p style={{ fontSize:9, color:'rgba(var(--tb-primary-rgb),0.25)', letterSpacing:1 }}>PANTALLA</p>
        </div>
      </div>
      {/* Botones de texto */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {positions.map(p => {
          const active = value === p.id
          return (
            <motion.button key={p.id} onClick={() => onChange(p.id)} className="no-drag"
              style={{ padding:'7px 8px', fontSize:10, fontWeight: active ? 600 : 400,
                color: active ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.4)',
                background: active ? 'rgba(var(--tb-primary-rgb),0.12)' : 'rgba(255,255,255,0.02)',
                border:`1px solid ${active ? 'rgba(var(--tb-primary-rgb),0.4)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius:8, cursor:'pointer', transition:'all 0.15s',
                boxShadow: active ? '0 0 10px rgba(var(--tb-primary-rgb),0.12)' : 'none',
              }}
              whileTap={{ scale:0.95 }}
            >{p.label}</motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Selector de pantalla/monitor ─────────────────────────────────────────────
function ScreenPicker({ value, onChange }) {
  const [displays, setDisplays] = useState([])

  useEffect(() => {
    window.electronAPI?.getDisplays?.().then(d => {
      if (Array.isArray(d)) setDisplays(d)
    })
  }, [])

  if (displays.length <= 1) {
    return (
      <p style={{ fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.25)', fontStyle:'italic', textAlign:'center', padding:'8px 0' }}>
        Solo hay una pantalla conectada
      </p>
    )
  }

  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
      {displays.map(d => {
        const active = value === d.index
        return (
          <motion.button key={d.index} onClick={() => onChange(d.index)} className="no-drag"
            style={{ flex:1, minWidth:80, padding:'10px 10px 8px',
              background: active ? 'rgba(var(--tb-primary-rgb),0.14)' : 'rgba(255,255,255,0.02)',
              border:`1.5px solid ${active ? 'rgba(var(--tb-primary-rgb),0.5)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius:12, cursor:'pointer', transition:'all 0.18s', textAlign:'center',
              boxShadow: active ? '0 0 16px rgba(var(--tb-primary-rgb),0.18)' : 'none',
            }}
            whileHover={{ scale:1.04 }} whileTap={{ scale:0.94 }}
          >
            {/* Ícono monitor */}
            <div style={{ margin:'0 auto 6px',
              width:36, height:24, borderRadius:4,
              border:`2px solid ${active ? 'rgba(var(--tb-primary-rgb),0.8)' : 'rgba(255,255,255,0.15)'}`,
              background: active ? 'rgba(var(--tb-primary-rgb),0.1)' : 'rgba(255,255,255,0.02)',
              position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {active && <div style={{ width:8, height:8, borderRadius:2, background:'rgba(var(--tb-primary-rgb),0.7)' }} />}
              {/* Base del monitor */}
              <div style={{ position:'absolute', bottom:-6, left:'50%', transform:'translateX(-50%)',
                width:14, height:4, background: active ? 'rgba(var(--tb-primary-rgb),0.5)' : 'rgba(255,255,255,0.1)',
                borderRadius:'0 0 2px 2px',
              }} />
            </div>
            <p style={{ fontSize:10, fontWeight: active ? 600 : 400,
              color: active ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.4)',
              marginBottom:2,
            }}>{d.label}</p>
            {d.primary && (
              <p style={{ fontSize:9, color:'rgba(var(--tb-primary-rgb),0.4)' }}>Principal</p>
            )}
            <p style={{ fontSize:9, color:'rgba(var(--tb-textLight-rgb),0.2)', marginTop:1 }}>
              {d.width}×{d.height}
            </p>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Sección: Notificaciones ──────────────────────────────────────────────────
function NotificationsSection() {
  const {
    notificationMode, setNotificationMode,
    notificationPosition, setNotificationPosition,
    notificationAutoHide, setNotificationAutoHide,
    currentTrack, activeTheme,
  } = useAppStore()
  const theme = getTheme(activeTheme)
  const Mascot = theme.Mascot
  const ThemeNotification = theme.Notification

  const [notifScreen, setNotifScreenLocal] = useState(0)

  useEffect(() => {
    window.electronAPI?.storeGet('notificationScreen', 0).then(s => setNotifScreenLocal(s || 0))
  }, [])

  const handleScreenChange = (idx) => {
    setNotifScreenLocal(idx)
    window.electronAPI?.storeSet('notificationScreen', idx)
    window.electronAPI?.setNotificationScreen?.(idx)
  }

  const modes = [
    { id:'always',   label:'Siempre visible',    desc:'Encima de todo, incluso pantalla completa', color:'#4ade80' },
    { id:'normal',   label:'Visible normalmente', desc:'Se oculta si hay app en pantalla completa', color:'#fbbf24' },
    { id:'disabled', label:'Desactivadas',        desc:'Solo música en segundo plano',              color:'#f87171' },
  ]

  const autoHideOpts = [
    { value:5,  label:'5 s' }, { value:10, label:'10 s' },
    { value:30, label:'30 s' }, { value:0, label:'Nunca' },
  ]

  return (
    <div className="space-y-3">
      {/* Visibilidad */}
      <Card title="Visibilidad" icon={IconBell} glowing>
        <div className="space-y-2">
          {modes.map(m => {
            const active = notificationMode === m.id
            return (
              <motion.button key={m.id} onClick={() => setNotificationMode(m.id)}
                className="w-full flex items-center gap-3 rounded-xl text-left no-drag"
                style={{ padding:'11px 14px',
                  background: active ? 'rgba(var(--tb-primary-rgb),0.08)' : 'rgba(255,255,255,0.02)',
                  border:`1px solid ${active ? 'rgba(var(--tb-primary-rgb),0.35)' : 'rgba(255,255,255,0.04)'}`,
                  transition:'all 0.18s',
                  boxShadow: active ? '0 0 12px rgba(var(--tb-primary-rgb),0.1)' : 'none',
                }}
                whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
              >
                <motion.div animate={{ scale: active ? [1,1.3,1] : 1 }}
                  transition={{ duration:0.4 }}
                  style={{ width:9, height:9, borderRadius:'50%', background:m.color,
                    flexShrink:0, boxShadow: active ? `0 0 8px ${m.color}` : 'none',
                  }}
                />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:500, color: active ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.75)' }}>{m.label}</p>
                  <p style={{ fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.32)', marginTop:1 }}>{m.desc}</p>
                </div>
                {active && <motion.div initial={{ scale:0 }} animate={{ scale:1 }}>
                  <IconCheck size={14} style={{ color:'var(--tb-accent)' }} />
                </motion.div>}
              </motion.button>
            )
          })}
        </div>
      </Card>

      {/* Posición y auto-ocultar */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Card title="Posición">
          <PositionPicker value={notificationPosition} onChange={setNotificationPosition} />
        </Card>
        <Card title="Auto-ocultar">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {autoHideOpts.map(o => {
              const active = notificationAutoHide === o.value
              return (
                <motion.button key={o.value} onClick={() => setNotificationAutoHide(o.value)}
                  className="no-drag"
                  style={{ padding:'10px 8px', fontSize:12, fontWeight: active ? 600 : 400,
                    color: active ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.4)',
                    background: active ? 'rgba(var(--tb-primary-rgb),0.12)' : 'rgba(255,255,255,0.02)',
                    border:`1px solid ${active ? 'rgba(var(--tb-primary-rgb),0.4)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius:10, cursor:'pointer', transition:'all 0.15s',
                    boxShadow: active ? '0 0 10px rgba(var(--tb-primary-rgb),0.12)' : 'none',
                  }}
                  whileTap={{ scale:0.94 }}
                >{o.label}</motion.button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Selector de pantalla */}
      <Card title="Pantalla de notificación" icon={IconSettings}>
        <p style={{ fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.35)', marginBottom:12 }}>
          Elige en qué monitor aparecerá la notificación
        </p>
        <ScreenPicker value={notifScreen} onChange={handleScreenChange} />
      </Card>

      {/* Preview */}
      {currentTrack && (
        <Card title="Preview de notificación">
          {/* Mascota decorativa del tema en preview */}
          <div style={{ position:'relative', height:130, borderRadius:10, overflow:'hidden' }}>
            <div style={{ position:'absolute', bottom:-8, right:-8, opacity:0.4, zIndex:0 }}>
              <Mascot width={120} opacity={0.4} />
            </div>
            <div style={{ position:'relative', zIndex:1, height:'100%' }}>
              <ThemeNotification track={currentTrack} isVisible={true} onClose={()=>{}} onExitComplete={()=>{}} />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Sección: Temas ──────────────────────────────────────────────────────────
// Cada tema nuevo registrado en src/themes/index.js aparece acá automáticamente
// — no hace falta tocar esta sección para agregar uno.
function ThemesSection() {
  const { activeTheme, setActiveTheme } = useAppStore()
  const themes = listThemes()
  const current = getTheme(activeTheme)
  const CurrentMascot = current.Mascot

  return (
    <div className="space-y-3">
      {/* Mascota decorativa del tema activo */}
      <div style={{ textAlign:'center', position:'relative', padding:'8px 0 0' }}>
        <div style={{ display:'inline-block', animation:'tb-float-castle 8s ease-in-out infinite' }}>
          <CurrentMascot width={180} opacity={0.22} />
        </div>
        <p style={{ fontFamily:'var(--tb-font-heading)', fontSize:14,
          color:'rgba(var(--tb-primary-rgb),0.5)', marginTop:-8, letterSpacing:2,
        }}>Elige tu tema</p>
      </div>

      <Card title="Tema de la app" icon={IconPalette}>
        <div className="space-y-2">
          {themes.map(t => {
            const active = activeTheme === t.data.id
            const available = t.available !== false
            return (
              <motion.button key={t.data.id} onClick={() => available && setActiveTheme(t.data.id)}
                disabled={!available}
                className="w-full flex items-center gap-3 rounded-2xl no-drag"
                style={{ padding:'12px 14px', textAlign:'left',
                  background: active ? `rgba(${t.data.colors.primaryRgb},0.08)` : 'rgba(255,255,255,0.02)',
                  border:`1.5px solid ${active ? `rgba(${t.data.colors.primaryRgb},0.4)` : 'rgba(255,255,255,0.05)'}`,
                  opacity: available ? 1 : 0.4,
                  cursor: available ? 'pointer' : 'not-allowed',
                  transition:'all 0.18s',
                  boxShadow: active ? `0 0 20px rgba(${t.data.colors.primaryRgb},0.15)` : 'none',
                }}
                whileTap={available ? { scale:0.98 } : {}}
                whileHover={available ? { scale:1.01 } : {}}
              >
                <div style={{ width:50, height:50, borderRadius:12, flexShrink:0,
                  background:t.data.gradients.app, border:`2px solid rgba(${t.data.colors.primaryRgb},0.35)`,
                  boxShadow: active ? `0 4px 16px rgba(${t.data.colors.primaryRgb},0.2)` : 'none',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                }}>{t.data.emoji}</div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:500,
                    color: active ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.8)',
                  }}>{t.data.emoji} {t.data.name}</p>
                  <p style={{ fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.32)', marginTop:2 }}>{available ? t.data.description : 'Próximamente...'}</p>
                </div>
                {active && <motion.div initial={{ scale:0, rotate:-20 }} animate={{ scale:1, rotate:0 }}>
                  <IconCheck size={15} style={{ color:'var(--tb-accent)' }} />
                </motion.div>}
              </motion.button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ─── Sección: App ─────────────────────────────────────────────────────────────
function AppSection({ onLogout }) {
  const [updateStatus, setUpdateStatus] = useState('idle')
  const [updateInfo,   setUpdateInfo]   = useState(null)

  useEffect(() => {
    const handler = (data) => {
      setUpdateStatus(data.status)
      if (data.version || data.percent !== undefined || data.message) setUpdateInfo(data)
    }
    window.electronAPI?.onUpdateStatus?.(handler)
    return () => window.electronAPI?.removeAllListeners?.('update-status')
  }, [])

  const checkUpdates = async () => {
    setUpdateStatus('checking'); setUpdateInfo(null)
    try { await window.electronAPI?.checkForUpdates() }
    catch (e) { setUpdateStatus('error'); setUpdateInfo({ message:e.message }) }
  }
  const installNow = () => window.electronAPI?.installUpdateNow?.()

  const statusConfig = {
    idle:         { label:'Buscar actualizaciones',                          color:'rgba(var(--tb-textLight-rgb),0.5)',  spin:false },
    checking:     { label:'Verificando...',                                  color:'rgba(var(--tb-primary-rgb),0.7)',   spin:true  },
    'up-to-date': { label:'✨ Estás al día',                                 color:'#4ade80',                spin:false },
    available:    { label:`⬇ Nueva versión: ${updateInfo?.version ?? ''}`,  color:'#fbbf24',                spin:false },
    downloading:  { label:`Descargando ${updateInfo?.percent ?? 0}%...`,    color:'#60a5fa',                spin:true  },
    downloaded:   { label:`✅ Lista: v${updateInfo?.version ?? ''}`,         color:'#34d399',                spin:false },
    error:        { label:'Error al verificar',                              color:'#f87171',                spin:false },
  }
  const cfg = statusConfig[updateStatus] ?? statusConfig.idle

  return (
    <div className="space-y-3">
      <TupperCarousel messages={tupperMessages} />

      <Card title="Información" icon={IconInfo}>
        {[['Versión', '2.0.1'], ['Hecho por', 'MrSoniccx ⚡'], ['Para', 'Tupper 💜']].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.03)',
          }}>
            <span style={{ fontSize:12, color:'rgba(var(--tb-textLight-rgb),0.32)' }}>{k}</span>
            <span style={{ fontSize:12, color:'rgba(var(--tb-textLight-rgb),0.72)', fontWeight:500 }}>{v}</span>
          </div>
        ))}
      </Card>

      <Card title="Actualizaciones" icon={IconRefresh}>
        {updateStatus === 'downloading' && (
          <div style={{ marginBottom:10, borderRadius:6, overflow:'hidden',
            background:'rgba(255,255,255,0.05)', height:5,
          }}>
            <motion.div style={{ height:'100%',
              background:'linear-gradient(90deg, #60a5fa, #818cf8)', borderRadius:6,
            }}
              initial={{ width:0 }}
              animate={{ width:`${updateInfo?.percent??0}%` }}
              transition={{ ease:'linear' }}
            />
          </div>
        )}
        <motion.button
          onClick={updateStatus==='downloaded' ? installNow : checkUpdates}
          disabled={updateStatus==='checking'||updateStatus==='downloading'}
          className="w-full flex items-center justify-center gap-2 rounded-2xl no-drag"
          style={{ padding:'11px 16px',
            background: updateStatus==='downloaded' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
            border:`1px solid ${updateStatus==='downloaded' ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.08)'}`,
            color:cfg.color, fontSize:13, fontWeight:500,
            cursor:(updateStatus==='checking'||updateStatus==='downloading') ? 'not-allowed' : 'pointer',
            transition:'all 0.18s',
          }}
          whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
        >
          <motion.span animate={cfg.spin ? { rotate:360 } : {}}
            transition={cfg.spin ? { repeat:Infinity, duration:1, ease:'linear' } : {}}
          ><IconRefresh size={14} /></motion.span>
          {cfg.label}
        </motion.button>
      </Card>

      <Card title="Cuenta y app" icon={IconSettings}>
        <div className="space-y-2">
          {[
            { label:'Desconectar Spotify', icon:IconLogout,  onClick:onLogout,
              style:{ color:'#f87171', border:'rgba(248,113,113,0.2)', bg:'rgba(248,113,113,0.06)' } },
            { label:'Minimizar al tray',  icon:IconMinimize, onClick:()=>window.electronAPI?.close(),
              style:{ color:'rgba(var(--tb-textLight-rgb),0.4)', border:'rgba(255,255,255,0.07)', bg:'rgba(255,255,255,0.03)' } },
            { label:'Cerrar completamente', icon:IconPower, onClick:()=>window.electronAPI?.quitApp(),
              style:{ color:'rgba(248,113,113,0.6)', border:'rgba(248,113,113,0.15)', bg:'rgba(248,113,113,0.04)' } },
          ].map(({ label, icon:Icon, onClick, style:s }) => (
            <motion.button key={label} onClick={onClick}
              className="w-full flex items-center justify-center gap-2 rounded-2xl no-drag"
              style={{ padding:'11px 16px', background:s.bg, border:`1px solid ${s.border}`,
                color:s.color, fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.18s',
              }}
              whileHover={{ scale:1.01, filter:'brightness(1.2)' }} whileTap={{ scale:0.97 }}
            >
              <Icon size={14} /> {label}
            </motion.button>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
const NAV = [
  { id:'player',        label:'Reproductor',    Icon:IconMusic    },
  { id:'notifications', label:'Notificaciones', Icon:IconBell     },
  { id:'themes',        label:'Temas',          Icon:IconPalette  },
  { id:'app',           label:'App',            Icon:IconSettings },
]

// ─── Barra inferior ───────────────────────────────────────────────────────────
function BottomPlayerBar({ track }) {
  return (
    <motion.div
      animate={{ height: track ? 66 : 46 }}
      transition={{ duration:0.3, ease:'easeInOut' }}
      style={{ flexShrink:0, position:'relative', zIndex:10,
        background:'var(--tb-gradient-bottombar)',
        borderTop:'1px solid rgba(var(--tb-primary-rgb),0.18)',
        display:'flex', alignItems:'center',
        padding:'0 16px', gap:12,
        overflow:'hidden',
      }}
    >
      {/* Línea dorada */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
        background:'linear-gradient(90deg, transparent, rgba(var(--tb-primary-rgb),0.5) 30%, rgba(var(--tb-accent-rgb),0.7) 50%, rgba(var(--tb-primary-rgb),0.5) 70%, transparent)',
      }} />
      {!track ? (
        <p style={{ fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.18)', width:'100%',
          textAlign:'center', fontStyle:'italic', fontFamily:'serif',
        }}>✦ Sin reproducción activa ✦</p>
      ) : (
        <>
          <motion.img key={track.id} src={track.albumArt} alt=""
            initial={{ scale:0.7, opacity:0 }} animate={{ scale:1, opacity:1 }}
            transition={{ type:'spring', stiffness:280, damping:22 }}
            style={{ width:40, height:40, borderRadius:8, objectFit:'cover', flexShrink:0,
              border:'1.5px solid rgba(var(--tb-primary-rgb),0.4)',
              boxShadow:'0 0 14px rgba(var(--tb-primary-rgb),0.25)',
            }}
          />
          <div style={{ minWidth:0, width:120, flexShrink:0 }}>
            <motion.p key={`bn-${track.id}`} initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }}
              style={{ fontSize:12, fontWeight:700, color:'var(--tb-accent)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                textShadow:'0 0 10px rgba(var(--tb-accent-rgb),0.4)',
              }}
            >{track.name}</motion.p>
            <motion.p key={`ba-${track.id}`} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.07 }}
              style={{ fontSize:10, color:'rgba(var(--tb-textLight-rgb),0.38)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1,
              }}
            >{track.artist}</motion.p>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4, minWidth:0 }}>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <PlayerControls size="sm" />
            </div>
            <ProgressBar />
          </div>
          <div style={{ flexShrink:0 }}>
            <VolumeSlider />
          </div>
        </>
      )}
    </motion.div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Settings() {
  const [section, setSection] = useState('player')
  const { currentTrack, setAuthenticated, activeTheme } = useAppStore()
  const theme = getTheme(activeTheme)
  const ThemeBackground = theme.Background
  const SidebarBadge = theme.SidebarBadge
  const navigate = useNavigate()

  useEffect(() => {
    window.electronAPI?.storeGet('spotifyAccessToken', null).then(t => {
      if (!t) navigate('/login', { replace:true })
    })
  }, [])

  const handleLogout = async () => {
    await window.electronAPI?.logoutSpotify()
    setAuthenticated(false)
    navigate('/login', { replace:true })
  }

  const panels = {
    player:        <PlayerSection track={currentTrack} />,
    notifications: <NotificationsSection />,
    themes:        <ThemesSection />,
    app:           <AppSection onLogout={handleLogout} />,
  }

  return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column',
      background:'var(--tb-gradient-app)',
      position:'relative', overflow:'hidden',
    }}>
      <ThemeBackground />
      <TitleBar />

      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative', zIndex:1 }}>
        {/* Sidebar */}
        <div style={{ width:180, flexShrink:0, display:'flex', flexDirection:'column',
          padding:'12px 8px', gap:3,
          background:'var(--tb-gradient-sidebar)',
          borderRight:'1px solid rgba(var(--tb-primary-rgb),0.1)',
          overflowY:'auto', backdropFilter:'blur(12px)',
        }}>
          {/* Insignia del tema activo */}
          <SidebarBadge />

          {NAV.map(({ id, label, Icon }) => {
            const active = section === id
            return (
              <motion.button key={id} onClick={() => setSection(id)}
                className="flex items-center gap-2.5 rounded-xl no-drag"
                style={{ padding:'10px 14px', textAlign:'left',
                  background: active ? 'rgba(var(--tb-primary-rgb),0.12)' : 'transparent',
                  border:`1px solid ${active ? 'rgba(var(--tb-primary-rgb),0.3)' : 'transparent'}`,
                  color: active ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.42)',
                  fontSize:13, fontWeight: active ? 600 : 400,
                  transition:'all 0.18s', cursor:'pointer',
                  boxShadow: active ? '0 0 16px rgba(var(--tb-primary-rgb),0.1)' : 'none',
                }}
                whileHover={{ color: active ? 'var(--tb-accent)' : 'rgba(var(--tb-textLight-rgb),0.82)', x: active ? 0 : 2 }}
                whileTap={{ scale:0.97 }}
              >
                <Icon size={14} />
                <span style={{ flex:1 }}>{label}</span>
                {active && (
                  <motion.div layoutId="nav-indicator"
                    style={{ width:4, height:4, borderRadius:'50%', background:'var(--tb-accent)',
                      boxShadow:'0 0 8px var(--tb-accent)',
                    }}
                  />
                )}
              </motion.button>
            )
          })}

          {/* Mini track en sidebar */}
          {currentTrack && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ marginTop:'auto', paddingTop:12,
                borderTop:'1px solid rgba(var(--tb-primary-rgb),0.08)',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 6px' }}>
                <motion.img src={currentTrack.albumArt} alt=""
                  animate={{ boxShadow:['0 0 6px rgba(var(--tb-primary-rgb),0.15)','0 0 14px rgba(var(--tb-primary-rgb),0.35)','0 0 6px rgba(var(--tb-primary-rgb),0.15)'] }}
                  transition={{ duration:3, repeat:Infinity }}
                  style={{ width:32, height:32, borderRadius:7, objectFit:'cover',
                    flexShrink:0, border:'1px solid rgba(var(--tb-primary-rgb),0.3)',
                  }}
                />
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:11, color:'rgba(var(--tb-textLight-rgb),0.72)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500,
                  }}>{currentTrack.name}</p>
                  <p style={{ fontSize:9, color:'rgba(var(--tb-textLight-rgb),0.3)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>{currentTrack.artist}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Panel principal */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={section}
              initial={{ opacity:0, y:12, filter:'blur(4px)' }}
              animate={{ opacity:1, y:0, filter:'blur(0px)' }}
              exit={{ opacity:0, y:8, filter:'blur(4px)' }}
              transition={{ duration:0.18 }}
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
