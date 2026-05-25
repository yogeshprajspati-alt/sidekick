import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './diary-enhancements.css'

// Apply saved diary preferences IMMEDIATELY (before React paints)
// This prevents the "flash of default theme" on page load
try {
    const saved = localStorage.getItem('sidekick-diary-prefs')
    if (saved) {
        const p = JSON.parse(saved)
        const el = document.documentElement
        if (p.theme) el.setAttribute('data-diary-theme', p.theme)
        if (p.font) el.setAttribute('data-diary-font', p.font)
        if (p.layout) el.setAttribute('data-diary-layout', p.layout)
        if (p.fontSize) el.style.setProperty('--diary-font-size', `${p.fontSize}px`)
    }
} catch { /* ignore */ }

// Detect Supabase password recovery BEFORE React mounts
// This is the most reliable way — hash is still intact at this point
try {
    const hash = window.location.hash
    if (hash.includes('type=recovery') && hash.includes('access_token')) {
        sessionStorage.setItem('sidekick_password_recovery', '1')
    }
} catch { /* ignore */ }

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
