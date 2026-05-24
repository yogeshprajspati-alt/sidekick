import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GREETINGS from '../lib/greetings'

export default function GreetingBanner() {
    const [visible, setVisible] = useState(true)
    const [fadeOut, setFadeOut] = useState(false)

    // Pick a random greeting on mount
    const greeting = useMemo(() => {
        const idx = Math.floor(Math.random() * GREETINGS.length)
        return GREETINGS[idx]
    }, [])

    // Auto-dismiss after 6 seconds
    useEffect(() => {
        const fadeTimer = setTimeout(() => setFadeOut(true), 5000)
        const hideTimer = setTimeout(() => setVisible(false), 6000)
        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(hideTimer)
        }
    }, [])

    if (!visible) return null

    return (
        <AnimatePresence>
            {!fadeOut && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mx-4 sm:mx-6 mt-3 mb-1 relative overflow-hidden rounded-2xl cursor-pointer"
                    onClick={() => { setFadeOut(true); setTimeout(() => setVisible(false), 400) }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(183,110,121,0.12) 0%, rgba(212,175,55,0.06) 50%, rgba(183,110,121,0.08) 100%)',
                        border: '1px solid rgba(183,110,121,0.12)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    {/* Animated shimmer */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
                        }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                    />

                    <div className="relative z-10 px-5 py-4 flex items-start gap-3">
                        {/* Animated heart */}
                        <motion.span
                            className="text-2xl flex-shrink-0 mt-0.5"
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 5, -5, 0],
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            💌
                        </motion.span>

                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-rose-gold/40 font-body uppercase tracking-[2px] mb-1">
                                For you, Prachi
                            </p>
                            <p
                                className="font-handwriting text-[20px] sm:text-[22px] leading-snug"
                                style={{
                                    color: '#e6b8c0',
                                    textShadow: '0 0 20px rgba(183,110,121,0.15)',
                                }}
                            >
                                {greeting}
                            </p>
                        </div>
                    </div>

                    {/* Dismiss hint */}
                    <div className="absolute bottom-1.5 right-3">
                        <span className="text-[9px] text-white/10 font-body">tap to dismiss</span>
                    </div>

                    {/* Corner decoration */}
                    <div
                        className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle at top right, rgba(212,175,55,0.08) 0%, transparent 70%)',
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}
