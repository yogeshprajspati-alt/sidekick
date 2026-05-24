import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

/**
 * ThemeToggle — animated SVG sun ↔ moon morph.
 *
 * The icon is a single SVG:
 *  - A circle that shrinks (sun core → moon body)
 *  - 8 rays that fade + scale out when going to moon
 *  - A "bite" circle that slides in from top-right to carve the crescent
 *
 * Everything is CSS-variable-aware and works on both dark and light bg.
 */
export default function ThemeToggle({ size = 32, className = '', style = {} }) {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    // Icon colour: gold in dark mode, warm rose-gold in light mode
    const color     = isDark ? '#d4af37' : '#b76e79'
    const glowColor = isDark ? 'rgba(212,175,55,0.35)' : 'rgba(183,110,121,0.30)'

    const spring = { type: 'spring', stiffness: 260, damping: 20 }
    const ease   = { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }

    // Ray positions (8 evenly spaced around the circle)
    const rays = Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 * Math.PI) / 180
        const inner = 10.5
        const outer = 14.5
        return {
            x1: 16 + inner * Math.cos(angle),
            y1: 16 + inner * Math.sin(angle),
            x2: 16 + outer * Math.cos(angle),
            y2: 16 + outer * Math.sin(angle),
        }
    })

    return (
        <motion.button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`flex items-center justify-center rounded-full relative ${className}`}
            style={{
                width: size,
                height: size,
                background: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(183,110,121,0.08)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(183,110,121,0.16)'}`,
                cursor: 'pointer',
                outline: 'none',
                flexShrink: 0,
                ...style,
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.88 }}
            animate={{
                boxShadow: isDark
                    ? `0 0 12px ${glowColor}`
                    : `0 0 10px ${glowColor}`,
            }}
            transition={spring}
        >
            <svg
                width={size * 0.55}
                height={size * 0.55}
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ overflow: 'visible' }}
            >
                {/* ── Sun rays ── */}
                {rays.map((ray, i) => (
                    <motion.line
                        key={i}
                        x1={ray.x1} y1={ray.y1}
                        x2={ray.x2} y2={ray.y2}
                        stroke={color}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        animate={{
                            opacity:      isDark ? 1 : 0,
                            scaleX:       isDark ? 1 : 0,
                            scaleY:       isDark ? 1 : 0,
                            originX:      '16px',
                            originY:      '16px',
                        }}
                        transition={{
                            ...ease,
                            delay: isDark ? i * 0.03 : (7 - i) * 0.02,
                        }}
                    />
                ))}

                {/* ── Main circle — sun core / moon body ── */}
                <motion.circle
                    cx="16"
                    cy="16"
                    fill={color}
                    animate={{ r: isDark ? 5.5 : 7 }}
                    transition={ease}
                />

                {/* ── Crescent mask — slides in to bite the circle ── */}
                <motion.circle
                    cx="16"
                    cy="16"
                    r="6"
                    fill={isDark ? 'transparent' : (theme === 'light' ? '#fdf8f2' : '#0a0a0f')}
                    animate={{
                        cx:      isDark ? 30  : 20.5,
                        cy:      isDark ? 2   : 11.5,
                        opacity: isDark ? 0   : 1,
                    }}
                    transition={ease}
                    style={{ mixBlendMode: 'normal' }}
                />

                {/* ── Tiny star dots (moon mode only) ── */}
                {[
                    { cx: 9,  cy: 8,  r: 0.9  },
                    { cx: 6,  cy: 14, r: 0.65 },
                    { cx: 11, cy: 22, r: 0.75 },
                ].map((star, i) => (
                    <motion.circle
                        key={`star-${i}`}
                        cx={star.cx}
                        cy={star.cy}
                        r={star.r}
                        fill={color}
                        animate={{
                            opacity: isDark ? 0 : 1,
                            scale:   isDark ? 0 : 1,
                        }}
                        transition={{
                            ...ease,
                            delay: isDark ? 0 : 0.18 + i * 0.06,
                        }}
                    />
                ))}
            </svg>
        </motion.button>
    )
}
