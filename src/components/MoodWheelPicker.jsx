import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MOODS = ['❤️', '😊', '😢', '🥰', '✨', '😡', '🌙', '🦋', '🫂', '☕']

const MOOD_LABELS = {
    '❤️': 'Love', '😊': 'Happy', '😢': 'Sad', '🥰': 'Adore',
    '✨': 'Magic', '😡': 'Angry', '🌙': 'Night', '🦋': 'Free',
    '🫂': 'Warmth', '☕': 'Cozy',
}

export default function MoodWheelPicker({ mood, setMood }) {
    const [open, setOpen] = useState(false)
    const [hoveredMood, setHoveredMood] = useState(null)
    const containerRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('pointerdown', handler)
        return () => document.removeEventListener('pointerdown', handler)
    }, [open])

    const handleSelect = (m) => {
        setMood(m)
        setOpen(false)
        setHoveredMood(null)
    }

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
            {/* Trigger button */}
            <motion.button
                onClick={() => setOpen((o) => !o)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                style={{
                    width: 44, height: 44, borderRadius: 14,
                    border: open ? '1px solid rgba(183,110,121,0.45)' : '1px solid rgba(183,110,121,0.18)',
                    background: open
                        ? 'linear-gradient(135deg, rgba(183,110,121,0.22), rgba(212,175,55,0.12))'
                        : 'rgba(255,255,255,0.04)',
                    boxShadow: open ? '0 0 18px rgba(183,110,121,0.22)' : '0 2px 8px rgba(0,0,0,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, cursor: 'pointer', position: 'relative', zIndex: 30, flexShrink: 0,
                    transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
                }}
                title="Pick a mood"
            >
                <motion.span
                    key={mood}
                    initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                    style={{ display: 'block', lineHeight: 1 }}
                >
                    {mood}
                </motion.span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0, opacity: open ? 0.8 : 0.35 }}
                    transition={{ duration: 0.2 }}
                    style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 7, color: '#b76e79', lineHeight: 1, pointerEvents: 'none' }}
                >▲</motion.span>
            </motion.button>

            {/* Popup grid — opens upward, left-aligned to trigger */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: 'absolute',
                            bottom: '110%',
                            left: 0,
                            zIndex: 50,
                            background: 'linear-gradient(145deg, rgba(22,16,18,0.98), rgba(14,10,12,0.99))',
                            border: '1px solid rgba(183,110,121,0.20)',
                            borderRadius: 16,
                            padding: '10px 8px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(183,110,121,0.06)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: 4,
                            minWidth: 200,
                        }}
                    >
                        {/* Label */}
                        <div style={{
                            gridColumn: '1 / -1',
                            fontSize: 10,
                            color: 'rgba(183,110,121,0.55)',
                            fontFamily: 'var(--font-body)',
                            marginBottom: 4,
                            paddingLeft: 2,
                        }}>
                            {hoveredMood ? `${MOOD_LABELS[hoveredMood]}` : 'Pick a mood'}
                        </div>

                        {MOODS.map((m, i) => {
                            const isSelected = m === mood
                            const isHovered = m === hoveredMood
                            return (
                                <motion.button
                                    key={m}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.025, type: 'spring', stiffness: 350, damping: 22 }}
                                    onClick={() => handleSelect(m)}
                                    onHoverStart={() => setHoveredMood(m)}
                                    onHoverEnd={() => setHoveredMood(null)}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.88 }}
                                    style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        border: isSelected
                                            ? '1.5px solid rgba(183,110,121,0.55)'
                                            : '1px solid rgba(255,255,255,0.06)',
                                        background: isSelected
                                            ? 'linear-gradient(135deg, rgba(183,110,121,0.28), rgba(212,175,55,0.14))'
                                            : isHovered ? 'rgba(183,110,121,0.10)' : 'rgba(255,255,255,0.04)',
                                        boxShadow: isSelected ? '0 0 10px rgba(183,110,121,0.25)' : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 18, cursor: 'pointer',
                                        outline: isSelected ? '2px solid rgba(183,110,121,0.15)' : 'none',
                                        outlineOffset: 2,
                                        transition: 'background 0.12s, border 0.12s',
                                    }}
                                    title={MOOD_LABELS[m]}
                                >
                                    {m}
                                </motion.button>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}