import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../store/useAppStore'

// ─── OAuth 2.0 PKCE helpers ─────────────────────────────────────────────────
function generateCodeVerifier(length = 128) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => chars[b % chars.length]).join('')
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const REDIRECT_URI    = 'tupperbeats://callback'
const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-recently-played',
  'user-library-read',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ')

// ─── Componente ─────────────────────────────────────────────────────────────
export default function Login() {
  const navigate    = useNavigate()
  const { setAuthenticated, loadClientId } = useAppStore()

  const [clientId,     setClientId]     = useState('')
  const [codeVerifier, setCodeVerifier] = useState('')
  const [status,       setStatus]       = useState('idle') // idle | waiting | success | error
  const [errorMsg,     setErrorMsg]     = useState('')

  useEffect(() => {
    loadClientId()
    // Pre-cargar client ID si ya estaba guardado
    window.electronAPI?.storeGet('spotifyClientId', '').then(id => {
      if (id) setClientId(id)
    })

    // Escuchar callback OAuth
    const handleCallback = (e) => {
      const url = e.detail
      handleOAuthCallback(url)
    }
    window.addEventListener('oauth-callback', handleCallback)
    return () => window.removeEventListener('oauth-callback', handleCallback)
  }, [])

  async function startLogin() {
    if (!clientId.trim()) {
      setErrorMsg('Ingresa tu Spotify Client ID primero')
      return
    }

    await window.electronAPI?.storeSet('spotifyClientId', clientId.trim())

    const verifier   = generateCodeVerifier()
    const challenge  = await generateCodeChallenge(verifier)
    const state      = crypto.randomUUID()

    setCodeVerifier(verifier)
    sessionStorage.setItem('pkce_verifier', verifier)
    sessionStorage.setItem('pkce_state', state)

    const params = new URLSearchParams({
      response_type:         'code',
      client_id:             clientId.trim(),
      scope:                 SCOPES,
      redirect_uri:          REDIRECT_URI,
      state,
      code_challenge_method: 'S256',
      code_challenge:        challenge,
    })

    const authUrl = `https://accounts.spotify.com/authorize?${params}`
    await window.electronAPI?.openAuthUrl(authUrl)
    setStatus('waiting')
  }

  async function handleOAuthCallback(callbackUrl) {
    try {
      const url    = new URL(callbackUrl.replace('tupperbeats://', 'https://tupperbeats/'))
      const code   = url.searchParams.get('code')
      const state  = url.searchParams.get('state')
      const error  = url.searchParams.get('error')

      if (error) throw new Error(`Spotify rechazó: ${error}`)
      if (state !== sessionStorage.getItem('pkce_state')) throw new Error('Estado inválido (CSRF)')

      const verifier = sessionStorage.getItem('pkce_verifier')
      const storedId = await window.electronAPI?.storeGet('spotifyClientId', '')

      // Intercambiar code por tokens
      const body = new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT_URI,
        client_id:     storedId,
        code_verifier: verifier,
      })

      const res = await fetch('https://accounts.spotify.com/api/token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })

      const tokens = await res.json()
      if (!tokens.access_token) throw new Error('No se recibió access_token')

      await window.electronAPI?.saveTokens(tokens)
      setAuthenticated(true)
      setStatus('success')

      setTimeout(() => navigate('/settings', { replace: true }), 1200)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-hw-negro relative overflow-hidden">
      {/* Fondo animado con partículas */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width:  `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              background: i % 3 === 0 ? '#C9A84C' : i % 3 === 1 ? '#9B5DE5' : '#FFB6C1',
              left:   `${Math.random() * 100}%`,
              bottom: `-${Math.random() * 20}%`,
            }}
            animate={{ y: [0, -(600 + Math.random() * 400)], opacity: [0, 0.8, 0] }}
            transition={{
              duration: 4 + Math.random() * 4,
              delay:    Math.random() * 3,
              repeat:   Infinity,
              ease:     'linear',
            }}
          />
        ))}
      </div>

      {/* Card de Login */}
      <motion.div
        className="z-10 w-full max-w-md mx-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="text-6xl mb-3"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎵
          </motion.div>
          <h1 className="font-magic text-4xl text-hw-oro mb-1"
              style={{ textShadow: '0 0 15px rgba(201,168,76,0.6)' }}>
            TupperBeats
          </h1>
          <p className="text-hw-crema/50 text-sm">Conecta tu Spotify para empezar la magia</p>
        </div>

        {/* Card */}
        <div className="parchment-bg rounded-2xl p-6 border border-hw-dorado/40 shadow-gold">
          <AnimatePresence mode="wait">
            {status === 'idle' || status === 'error' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Client ID input */}
                <label className="block mb-1 text-xs font-semibold text-hw-granate uppercase tracking-wider">
                  Spotify Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Pega aquí tu Client ID de Spotify..."
                  className="w-full bg-white/60 border border-hw-dorado/40 rounded-xl px-4 py-2.5 text-hw-negro text-sm outline-none focus:border-hw-dorado focus:shadow-gold transition-all mb-1 no-drag"
                  style={{ userSelect: 'text' }}
                />
                <p className="text-xs text-hw-negro/50 mb-4">
                  Obtenlo gratis en{' '}
                  <span
                    className="text-hw-granate underline cursor-pointer"
                    onClick={() => window.electronAPI?.openAuthUrl('https://developer.spotify.com/dashboard')}
                  >
                    developer.spotify.com
                  </span>
                  {' '}→ Crear App → Redirect URI: <code className="bg-white/50 px-1 rounded">tupperbeats://callback</code>
                </p>

                {errorMsg && (
                  <motion.p
                    className="text-red-600 text-xs mb-3 bg-red-50 rounded-lg px-3 py-2"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    ⚠️ {errorMsg}
                  </motion.p>
                )}

                <motion.button
                  onClick={startLogin}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm no-drag"
                  style={{ background: 'linear-gradient(135deg, #1DB954, #158a3e)' }}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(29,185,84,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  🎵 Conectar con Spotify
                </motion.button>
              </motion.div>
            ) : status === 'waiting' ? (
              <motion.div
                key="waiting"
                className="text-center py-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-4xl mb-3"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  ⚡
                </motion.div>
                <p className="text-hw-negro font-medium mb-1">Esperando autorización...</p>
                <p className="text-hw-negro/60 text-xs">Inicia sesión en el navegador que se abrió</p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                className="text-center py-4"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-5xl mb-3">✨</div>
                <p className="text-hw-negro font-semibold">¡Conectado! Bienvenida Tupper 🎂</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
