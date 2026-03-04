import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MOOD_COLORS = {
    '😡': { bg: 'rgba(239,68,68,0.15)', glow: 'rgba(239,68,68,0.4)', border: 'rgba(239,68,68,0.3)', label: 'Angry', hex: '#ef4444' },
    '😢': { bg: 'rgba(96,165,250,0.15)', glow: 'rgba(96,165,250,0.4)', border: 'rgba(96,165,250,0.3)', label: 'Sad', hex: '#60a5fa' },
    '🌙': { bg: 'rgba(129,140,248,0.15)', glow: 'rgba(129,140,248,0.4)', border: 'rgba(129,140,248,0.3)', label: 'Moody', hex: '#818cf8' },
    '😊': { bg: 'rgba(251,191,36,0.15)', glow: 'rgba(251,191,36,0.4)', border: 'rgba(251,191,36,0.3)', label: 'Happy', hex: '#fbbf24' },
    '❤️': { bg: 'rgba(244,63,94,0.15)', glow: 'rgba(244,63,94,0.4)', border: 'rgba(244,63,94,0.3)', label: 'Love', hex: '#f43f5e' },
    '🥰': { bg: 'rgba(251,113,133,0.15)', glow: 'rgba(251,113,133,0.4)', border: 'rgba(251,113,133,0.3)', label: 'Loved', hex: '#fb7185' },
    '✨': { bg: 'rgba(212,175,55,0.15)', glow: 'rgba(212,175,55,0.4)', border: 'rgba(212,175,55,0.3)', label: 'Magic', hex: '#d4af37' },
    '🦋': { bg: 'rgba(45,212,191,0.15)', glow: 'rgba(45,212,191,0.4)', border: 'rgba(45,212,191,0.3)', label: 'Free', hex: '#2dd4bf' },
    '🫂': { bg: 'rgba(192,132,252,0.15)', glow: 'rgba(192,132,252,0.4)', border: 'rgba(192,132,252,0.3)', label: 'Comfort', hex: '#c084fc' },
    '☕': { bg: 'rgba(180,83,9,0.15)', glow: 'rgba(180,83,9,0.35)', border: 'rgba(180,83,9,0.3)', label: 'Cozy', hex: '#b45309' },
}

const DEFAULT_COLOR = { bg: 'rgba(183,110,121,0.15)', glow: 'rgba(183,110,121,0.4)', border: 'rgba(183,110,121,0.3)', label: 'Feeling', hex: '#b76e79' }

function getMoodColor(mood) {
    return MOOD_COLORS[mood] || DEFAULT_COLOR
}

export default function MoodTimeline({ entries }) {
    const [expandedId, setExpandedId] = useState(null)

    if (!entries || entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <motion.div
                    className="text-5xl mb-4"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >🌈</motion.div>
                <p className="font-handwriting text-2xl" style={{ color: 'rgba(230,184,192,0.4)' }}>
                    No moods yet
                </p>
                <p className="font-body text-[12px] mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Write your first entry to see your mood journey
                </p>
            </div>
        )
    }

    // Count moods for mini legend
    const moodCount = entries.reduce((acc, e) => {
        acc[e.mood] = (acc[e.mood] || 0) + 1
        return acc
    }, {})
    const topMoods = Object.entries(moodCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

    return (
        <div className="px-4 sm:px-6 pt-4 pb-24">
            {/* Mini legend */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 mb-6"
            >
                {topMoods.map(([mood, count]) => {
                    const c = getMoodColor(mood)
                    return (
                        <div
                            key={mood}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-body"
                            style={{
                                background: c.bg,
                                border: `1px solid ${c.border}`,
                                color: c.hex,
                            }}
                        >
                            <span>{mood}</span>
                            <span style={{ opacity: 0.7 }}>{count}×</span>
                        </div>
                    )
                })}
            </motion.div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical line */}
                <div
                    className="absolute left-[18px] top-2 bottom-2 w-[2px] rounded-full"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(183,110,121,0.25), rgba(212,175,55,0.1), transparent)',
                    }}
                />

                <div className="space-y-3">
                    {entries.map((entry, i) => {
                        const c = getMoodColor(entry.mood)
                        const isExpanded = expandedId === entry.id
                        const date = new Date(entry.created_at)
                        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                        const preview = entry.text.length > 80 ? entry.text.slice(0, 80) + '…' : entry.text

                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="relative pl-10"
                            >
                                {/* Mood dot */}
                                <motion.div
                                    className="absolute left-0 top-3 w-9 h-9 rounded-full flex items-center justify-center text-lg"
                                    style={{
                                        background: c.bg,
                                        border: `1.5px solid ${c.border}`,
                                        boxShadow: isExpanded ? `0 0 14px ${c.glow}` : `0 0 6px ${c.glow}`,
                                    }}
                                    animate={{
                                        boxShadow: isExpanded
                                            ? [`0 0 14px ${c.glow}`, `0 0 22px ${c.glow}`, `0 0 14px ${c.glow}`]
                                            : `0 0 6px ${c.glow}`,
                                    }}
                                    transition={{ duration: 2, repeat: isExpanded ? Infinity : 0, ease: 'easeInOut' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                >
                                    {entry.mood}
                                </motion.div>

                                {/* Card */}
                                <motion.div
                                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                    className="rounded-2xl overflow-hidden cursor-pointer"
                                    style={{
                                        background: isExpanded
                                            ? `linear-gradient(135deg, ${c.bg}, rgba(14,11,13,0.95))`
                                            : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${isExpanded ? c.border : 'rgba(255,255,255,0.05)'}`,
                                        boxShadow: isExpanded ? `0 4px 20px ${c.glow}` : 'none',
                                        transition: 'all 0.3s ease',
                                    }}
                                    layout
                                >
                                    {/* Header row */}
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="font-body text-[10px] uppercase tracking-wider font-medium"
                                                style={{ color: c.hex }}
                                            >
                                                {getMoodColor(entry.mood).label}
                                            </span>
                                            {entry.is_private && (
                                                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>🔒</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-body text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                                {dateStr} · {timeStr}
                                            </span>
                                            <motion.span
                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="text-[10px]"
                                                style={{ color: 'rgba(255,255,255,0.2)' }}
                                            >▾</motion.span>
                                        </div>
                                    </div>

                                    {/* Preview / Full text */}
                                    <div className="px-4 pb-3">
                                        <AnimatePresence mode="wait">
                                            {isExpanded ? (
                                                <motion.p
                                                    key="full"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="font-body text-[14px] leading-relaxed"
                                                    style={{
                                                        fontFamily: "'Caveat', cursive",
                                                        fontSize: '16px',
                                                        color: 'rgba(232,224,226,0.75)',
                                                    }}
                                                >
                                                    {entry.text}
                                                </motion.p>
                                            ) : (
                                                <motion.p
                                                    key="preview"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="font-body text-[13px] leading-relaxed"
                                                    style={{ color: 'rgba(255,255,255,0.3)' }}
                                                >
                                                    {preview}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
