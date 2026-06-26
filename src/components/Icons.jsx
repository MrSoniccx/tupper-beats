// Icons.jsx — Librería de íconos SVG para TupperBeats
// Todos los íconos aceptan: size (número), className (string), color (string)

const base = (size, className) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  className,
  'aria-hidden': true,
})

export function IconPlay({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path d="M6 4.75a.75.75 0 0 0-1.166.625v13.25a.75.75 0 0 0 1.166.624l10.5-6.625a.75.75 0 0 0 0-1.248L6 4.75z" />
    </svg>
  )
}

export function IconPause({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path d="M6.5 5.5a1 1 0 0 0-1 1v11a1 1 0 0 0 2 0v-11a1 1 0 0 0-1-1zM17.5 5.5a1 1 0 0 0-1 1v11a1 1 0 0 0 2 0v-11a1 1 0 0 0-1-1z" />
    </svg>
  )
}

export function IconSkipNext({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path d="M5.055 3.81a.75.75 0 0 0-1.22.583v15.214a.75.75 0 0 0 1.22.583l10.5-7.607a.75.75 0 0 0 0-1.166L5.055 3.81zM19.25 3.75a.75.75 0 0 0-.75.75v15a.75.75 0 0 0 1.5 0v-15a.75.75 0 0 0-.75-.75z" />
    </svg>
  )
}

export function IconSkipPrev({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path d="M18.945 3.81a.75.75 0 0 1 1.22.583v15.214a.75.75 0 0 1-1.22.583l-10.5-7.607a.75.75 0 0 1 0-1.166L18.945 3.81zM4.75 3.75a.75.75 0 0 1 .75.75v15a.75.75 0 0 1-1.5 0v-15a.75.75 0 0 1 .75-.75z" />
    </svg>
  )
}

export function IconVolumeHigh({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zm4.46 1.867a.75.75 0 0 1 1.038.218c.636.943 1.002 2.079 1.002 3.305 0 1.226-.366 2.362-1.002 3.305a.75.75 0 1 1-1.256-.82A5.491 5.491 0 0 0 18.75 9.45a5.491 5.491 0 0 0-.748-2.485.75.75 0 0 1 .208-1.038zm1.995-2.33a.75.75 0 0 1 1.06.024A10.482 10.482 0 0 1 23.25 9.45c0 2.362-.78 4.544-2.088 6.283a.75.75 0 1 1-1.202-.9A8.982 8.982 0 0 0 21.75 9.45a8.982 8.982 0 0 0-1.79-5.384.75.75 0 0 1 .025-1.06z" />
    </svg>
  )
}

export function IconVolumeLow({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zm4.46 1.867a.75.75 0 0 1 1.038.218c.636.943 1.002 2.079 1.002 3.305 0 1.226-.366 2.362-1.002 3.305a.75.75 0 1 1-1.256-.82A5.491 5.491 0 0 0 18.75 9.45a5.491 5.491 0 0 0-.748-2.485.75.75 0 0 1 .208-1.038z" />
    </svg>
  )
}

export function IconVolumeMute({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zm5.47 5.409a.75.75 0 0 1 1.06 0l1.22 1.22 1.22-1.22a.75.75 0 1 1 1.06 1.06l-1.22 1.22 1.22 1.22a.75.75 0 1 1-1.06 1.06L21.25 13l-1.22 1.22a.75.75 0 1 1-1.06-1.06l1.22-1.22-1.22-1.22a.75.75 0 0 1 0-1.06z" />
    </svg>
  )
}

export function IconClose({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06z" />
    </svg>
  )
}

export function IconMinimize({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path fillRule="evenodd" d="M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75z" />
    </svg>
  )
}

export function IconMaximize({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path fillRule="evenodd" d="M3 6.25A3.25 3.25 0 0 1 6.25 3h11.5A3.25 3.25 0 0 1 21 6.25v11.5A3.25 3.25 0 0 1 17.75 21H6.25A3.25 3.25 0 0 1 3 17.75V6.25zm3.25-1.75A1.75 1.75 0 0 0 4.5 6.25v11.5c0 .966.784 1.75 1.75 1.75h11.5A1.75 1.75 0 0 0 19.5 17.75V6.25A1.75 1.75 0 0 0 17.75 4.5H6.25z" />
    </svg>
  )
}

export function IconSettings({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5z" />
    </svg>
  )
}

export function IconMusic({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66A1.5 1.5 0 0 0 8.25 15.55V5.035a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.337z" />
    </svg>
  )
}

export function IconSparkle({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5zM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5z" />
    </svg>
  )
}

export function IconRefresh({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918z" />
    </svg>
  )
}

export function IconCheck({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207z" />
    </svg>
  )
}

export function IconLogout({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06z" />
    </svg>
  )
}

export function IconBell({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0z" />
    </svg>
  )
}

export function IconPalette({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path fillRule="evenodd" d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65 2.249 2.249 0 0 0 0 3.898.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65 2.249 2.249 0 0 0 0-3.898.75.75 0 0 1-.374-.65V6.375zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75zm.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0v-.75zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75zm.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-.75zM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3z" />
    </svg>
  )
}

export function IconInfo({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} fill="currentColor">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022zM12 9a.75.75 0 1 0 0-1.5A.75.75 0 0 0 12 9z" />
    </svg>
  )
}

export function IconShuffle({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path fillRule="evenodd" d="M15.22 3.22a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H14a3.75 3.75 0 0 0-2.652 1.098L8.836 11.11a5.25 5.25 0 0 1-3.712 1.538H3a.75.75 0 0 1 0-1.5h2.124a3.75 3.75 0 0 0 2.652-1.098l2.512-2.512A5.25 5.25 0 0 1 14 6h2.94L15.22 4.28a.75.75 0 0 1 0-1.06zm0 13.5a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H14a5.25 5.25 0 0 1-3.716-1.541l-2.512-2.512A3.75 3.75 0 0 0 5.124 15.75H3a.75.75 0 0 1 0-1.5h2.124a5.25 5.25 0 0 1 3.716 1.541l2.512 2.512A3.75 3.75 0 0 0 14 19.5h2.94l-1.72-1.72a.75.75 0 0 1 0-1.06z" />
    </svg>
  )
}
export function IconRepeatContext({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path fillRule="evenodd" d="M2.25 9a.75.75 0 0 1 .75-.75h14.25l-2.47-2.47a.75.75 0 1 1 1.06-1.06l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 0 1-1.06-1.06L17.25 9.75H3A.75.75 0 0 1 2.25 9zm19.5 6a.75.75 0 0 1-.75.75H6.75l2.47 2.47a.75.75 0 1 1-1.06 1.06l-3.75-3.75a.75.75 0 0 1 0-1.06l3.75-3.75a.75.75 0 0 1 1.06 1.06L6.75 14.25H21a.75.75 0 0 1 .75.75z" />
    </svg>
  )
}

export function IconRepeatOne({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path fillRule="evenodd" d="M2.25 9a.75.75 0 0 1 .75-.75h14.25l-2.47-2.47a.75.75 0 1 1 1.06-1.06l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 0 1-1.06-1.06L17.25 9.75H3A.75.75 0 0 1 2.25 9zm19.5 6a.75.75 0 0 1-.75.75H6.75l2.47 2.47a.75.75 0 1 1-1.06 1.06l-3.75-3.75a.75.75 0 0 1 0-1.06l3.75-3.75a.75.75 0 0 1 1.06 1.06L6.75 14.25H21a.75.75 0 0 1 .75.75z M12 10.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-1.5h-.75a.75.75 0 0 1 0-1.5H12z" />
    </svg>
  )
}

export function IconSearch({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export function IconPower({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

export function IconQueueAdd({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <path d="M3 18h3m0 0v3m0-3v-3" />
    </svg>
  )
}



// Ícono de Spotify (wordmark simplificado)
export function IconSpotify({ size = 16, className = '' }) {
  return (
    <svg {...base(size, className)} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}
