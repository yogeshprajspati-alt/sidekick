import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MOODS = ['❤️', '😊', '😢', '🥰', '✨', '😡', '🌙', '🦋', '🫂', '☕']

// Subtle label for each mood shown on hover
const MOOD_LABELS = {
    '❤️': 'Love',
    '😊': 'Happy',
    '😢': 'Sad',
    '🥰': 'Adore',
    '✨': 'Magic',
    '😡': 'Angry',
    '🌙': 'Night',
    '🦋': 'Free',
    '🫂': 'Warmth',
    '☕': 'Cozy',
}

// Wheel radius and item size
const RADIUS = 72      // px from center to emoji center
const ITEM_SIZE = 40   // px, size of each emoji button

export default function MoodWheelPicker({ mood, setMood }) {
    const [open, setOpen] = useState(false)
    const [hoveredMood, setHoveredMood] = useState(null)
    const containerRef = useRef(null)

    // Close on outside click
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

    // Spread 10 moods in a full circle, starting from top (-90°)
    const total = MOODS.length
    const getPos = (i) => {
        const angle = (i / total) * 2 * Math.PI - Math.PI / 2
        return {
            x: Math.cos(angle) * RADIUS,
            y: Math.sin(angle) * RADIUS,
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
            }}
        >
            {/* ── Trigger button — currently selected mood ── */}
            <motion.button
                onClick={() => setOpen((o) => !o)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    border: open
                        ? '1px solid rgba(183,110,121,0.45)'
                        : '1px solid rgba(183,110,121,0.18)',
                    background: open
                        ? 'linear-gradient(135deg, rgba(183,110,121,0.22), rgba(212,175,55,0.12))'
                        : 'rgba(255,255,255,0.04)',
                    boxShadow: open
                        ? '0 0 18px rgba(183,110,121,0.22), inset 0 1px 0 rgba(255,255,255,0.08)'
                        : '0 2px 8px rgba(0,0,0,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 30,
                    flexShrink: 0,
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

                {/* Tiny chevron indicator */}
                <motion.span
                    animate={{ rotate: open ? 180 : 0, opacity: open ? 0.8 : 0.35 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: 'absolute',
                        bottom: 2,
                        right: 4,
                        fontSize: 7,
                        color: '#b76e79',
                        lineHeight: 1,
                        pointerEvents: 'none',
                    }}
                >
                    ▲
                </motion.span>
            </motion.button>

            {/* ── Mood label pill ── */}
            <AnimatePresence>
                {(open && hoveredMood) && (
                    <motion.span
                        key={hoveredMood}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            bottom: -24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: 10,
                            fontFamily: 'var(--font-body, sans-serif)',
                            color: 'rgba(183,110,121,0.9)',
                            background: 'rgba(183,110,121,0.08)',
                            border: '1px solid rgba(183,110,121,0.15)',
                            borderRadius: 6,
                            padding: '2px 7px',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            zIndex: 40,
                        }}
                    >
                        {MOOD_LABELS[hoveredMood]}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* ── Radial wheel ── */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Soft backdrop blur circle */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: (RADIUS + ITEM_SIZE) * 2 + 16,
                                height: (RADIUS + ITEM_SIZE) * 2 + 16,
                                transform: 'translate(-50%, -50%)',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(183,110,121,0.07) 0%, rgba(10,10,15,0.55) 70%)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: '1px solid rgba(183,110,121,0.10)',
                                zIndex: 20,
                                pointerEvents: 'none',
                            }}
                        />

                        {/* Emoji items */}
                        {MOODS.map((m, i) => {
                            const { x, y } = getPos(i)
                            const isSelected = m === mood
                            const isHovered = m === hoveredMood
                            const delay = i * 0.028

                            return (
                                <motion.button
                                    key={m}
                                    custom={i}
                                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                                    animate={{
                                        x,
                                        y,
                                        scale: isSelected ? 1.18 : isHovered ? 1.12 : 1,
                                        opacity: 1,
                                    }}
                                    exit={{
                                        x: 0,
                                        y: 0,
                                        scale: 0,
                                        opacity: 0,
                                        transition: {
                                            duration: 0.18,
                                            delay: (total - 1 - i) * 0.018,
                                            ease: 'easeIn',
                                        },
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 320,
                                        damping: 22,
                                        delay,
                                        scale: { duration: 0.15 },
                                        opacity: { duration: 0.15, delay },
                                    }}
                                    onClick={() => handleSelect(m)}
                                    onHoverStart={() => setHoveredMood(m)}
                                    onHoverEnd={() => setHoveredMood(null)}
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        width: ITEM_SIZE,
                                        height: ITEM_SIZE,
                                        marginTop: -ITEM_SIZE / 2,
                                        marginLeft: -ITEM_SIZE / 2,
                                        borderRadius: 12,
                                        border: isSelected
                                            ? '1.5px solid rgba(183,110,121,0.55)'
                                            : isHovered
                                                ? '1px solid rgba(183,110,121,0.30)'
                                                : '1px solid rgba(255,255,255,0.06)',
                                        background: isSelected
                                            ? 'linear-gradient(135deg, rgba(183,110,121,0.28), rgba(212,175,55,0.14))'
                                            : isHovered
                                                ? 'rgba(183,110,121,0.12)'
                                                : 'rgba(255,255,255,0.05)',
                                        boxShadow: isSelected
                                            ? '0 0 14px rgba(183,110,121,0.30), inset 0 1px 0 rgba(255,255,255,0.10)'
                                            : isHovered
                                                ? '0 4px 12px rgba(183,110,121,0.18)'
                                                : '0 2px 6px rgba(0,0,0,0.18)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 18,
                                        cursor: 'pointer',
                                        zIndex: 25,
                                        // subtle ring pulse on selected
                                        outline: isSelected
                                            ? '2px solid rgba(183,110,121,0.18)'
                                            : 'none',
                                        outlineOffset: 2,
                                        transition: 'border 0.15s, background 0.15s, box-shadow 0.15s',
                                    }}
                                    title={MOOD_LABELS[m]}
                                >
                                    {m}
                                </motion.button>
                            )
                        })}

                        {/* Center dot — visual anchor */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: 'rgba(183,110,121,0.5)',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 26,
                                pointerEvents: 'none',
                                boxShadow: '0 0 8px rgba(183,110,121,0.4)',
                            }}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
