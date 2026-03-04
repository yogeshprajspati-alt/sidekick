import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi

// Extract first URL from a block of text
export function extractFirstUrl(text) {
    const match = text?.match(URL_REGEX)
    return match ? match[0] : null
}

// Split text into plain parts and URLs, render URLs as tappable links
export function renderTextWithLinks(text, linkStyle = {}) {
    if (!text) return null
    const parts = text.split(/(https?:\/\/[^\s]+)/g)
    return parts.map((part, i) => {
        const isUrl = /^https?:\/\//.test(part)
        if (!isUrl) return part
        return (
            <span
                key={i}
                onClick={(e) => { e.stopPropagation(); window.open(part, '_blank', 'noopener,noreferrer') }}
                style={{
                    color: 'rgba(129,140,248,0.85)',
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(129,140,248,0.35)',
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    ...linkStyle,
                }}
            >
                {part}
            </span>
        )
    })
}

// Parse OG/meta tags from raw HTML string
function parseOGMeta(html, url) {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const getMeta = (name) =>
        doc.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ||
        doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || ''

    const title = getMeta('og:title') || getMeta('twitter:title') || doc.title || ''
    const description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description') || ''
    const image = getMeta('og:image') || getMeta('twitter:image') || ''
    const siteName = getMeta('og:site_name') || ''

    // Build favicon url
    const origin = new URL(url).origin
    const faviconEl = doc.querySelector('link[rel~="icon"]')
    let favicon = faviconEl?.getAttribute('href') || '/favicon.ico'
    if (favicon.startsWith('/')) favicon = origin + favicon
    if (favicon.startsWith('//')) favicon = 'https:' + favicon

    return { title: title.trim().slice(0, 120), description: description.trim().slice(0, 200), image, siteName, favicon, url }
}

const PROXIES = [
    (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
]

async function fetchPreview(url) {
    let lastErr
    for (const makeProxy of PROXIES) {
        try {
            const proxyUrl = makeProxy(url)
            const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) })
            if (!res.ok) throw new Error('fetch failed')
            // allorigins returns JSON { contents }, corsproxy returns raw HTML
            const contentType = res.headers.get('content-type') || ''
            let html
            if (contentType.includes('application/json')) {
                const json = await res.json()
                html = json.contents
            } else {
                html = await res.text()
            }
            if (!html) throw new Error('no content')
            return parseOGMeta(html, url)
        } catch (err) {
            lastErr = err
        }
    }
    throw lastErr
}

// Cache in memory so we don't re-fetch for the same URL in a session
const cache = new Map()

export default function LinkPreview({ url, compact = false }) {
    const [meta, setMeta] = useState(null)
    const [status, setStatus] = useState('loading') // loading | done | error
    const mounted = useRef(true)

    useEffect(() => {
        mounted.current = true
        if (!url) return
        if (cache.has(url)) {
            setMeta(cache.get(url))
            setStatus('done')
            return
        }
        setStatus('loading')
        fetchPreview(url)
            .then((data) => {
                if (!mounted.current) return
                cache.set(url, data)
                setMeta(data)
                setStatus('done')
            })
            .catch(() => {
                if (mounted.current) setStatus('error')
            })
        return () => { mounted.current = false }
    }, [url])

    if (status === 'error') return null

    const hostname = (() => {
        try { return new URL(url).hostname.replace('www.', '') } catch { return url }
    })()

    if (status === 'loading') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-lg flex-shrink-0 animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="flex-1 space-y-2">
                        <div className="h-2.5 rounded-full animate-pulse w-2/3" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <div className="h-2 rounded-full animate-pulse w-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                </div>
            </motion.div>
        )
    }

    if (!meta?.title && !meta?.description) return null

    return (
        <motion.div
            onClick={(e) => { e.stopPropagation(); window.open(url, '_blank', 'noopener,noreferrer') }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="mt-3 block rounded-xl overflow-hidden cursor-pointer group"
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
            }}
            whileHover={{ borderColor: 'rgba(183,110,121,0.25)', background: 'rgba(183,110,121,0.04)' }}
            whileTap={{ scale: 0.99 }}
        >
            {/* OG Image */}
            {!compact && meta.image && (
                <div className="w-full overflow-hidden" style={{ maxHeight: 160 }}>
                    <img
                        src={meta.image}
                        alt={meta.title}
                        className="w-full object-cover"
                        style={{ maxHeight: 160 }}
                        onError={(e) => { e.target.style.display = 'none' }}
                    />
                </div>
            )}

            <div className="p-3 flex gap-3 items-start">
                {/* Favicon */}
                <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden mt-0.5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <img
                        src={meta.favicon}
                        alt=""
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = '🔗'
                        }}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Site name */}
                    <p className="font-body text-[10px] mb-0.5 truncate" style={{ color: 'rgba(183,110,121,0.6)' }}>
                        {meta.siteName || hostname}
                    </p>
                    {/* Title */}
                    {meta.title && (
                        <p className="font-body text-[12px] font-medium leading-snug mb-1 line-clamp-2" style={{ color: 'rgba(232,224,226,0.8)' }}>
                            {meta.title}
                        </p>
                    )}
                    {/* Description */}
                    {!compact && meta.description && (
                        <p className="font-body text-[11px] leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {meta.description}
                        </p>
                    )}
                    {/* URL */}
                    <p className="font-body text-[10px] mt-1 truncate" style={{ color: 'rgba(255,255,255,0.18)' }}>
                        🔗 {hostname}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
