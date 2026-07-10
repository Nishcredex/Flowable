import React from "react"
export const IcoDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
  </svg>
)

export const IcoInbox = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
  </svg>
)

export const IcoDetail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

export const IcoWorkflow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="5" cy="12" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="19" cy="18" r="2" />
    <path d="M7 12h10M17 6L7 12M17 18L7 12" />
  </svg>
)

export const IcoReports = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-5" />
  </svg>
)

export const IcoAdmin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
)

export const IcoSearch = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
)

export const IcoBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 01-3.4 0" />
  </svg>
)

export const IcoHelp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12" y2="17.01" />
  </svg>
)

export const IcoDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

export const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export const IcoInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#075985" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

export const IcoGoogle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3.1-4.3 3.1-7.3z" fill="#4285F4" />
    <path d="M12 22c2.7 0 5-.9 6.7-2.5L15.5 17c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.7C4.6 19.6 8 22 12 22z" fill="#34A853" />
    <path d="M6.2 13.7c-.2-.6-.3-1.2-.3-1.7s.1-1.2.3-1.7V7.6H2.9C2.3 8.9 2 10.4 2 12s.3 3.1.9 4.4l3.3-2.7z" fill="#FBBC05" />
    <path d="M12 6c1.5 0 2.8.5 3.9 1.5l2.8-2.8C16.9 3.1 14.7 2 12 2 8 2 4.6 4.4 2.9 7.6l3.3 2.7C7 7.8 9.3 6 12 6z" fill="#EA4335" />
  </svg>
)

export const IcoMicrosoft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#00A4EF" d="M11.5 11.5H2V2h9.5z" /><path fill="#FFB900" d="M22 11.5h-9.5V2H22z" />
    <path fill="#F25022" d="M11.5 22H2v-9.5h9.5z" /><path fill="#7FBA00" d="M22 22h-9.5v-9.5H22z" />
  </svg>
)
