import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

function Heart({ id, x, y, size, delay }) {
    return (
        <motion.div
            key={id}
            className="absolute pointer-events-none select-none"
            style={{ left: x, top: y, fontSize: size }}
            initial={{ scale: 0, opacity: 1, y: 0 }}
            animate={{
                scale: [0, 1.4, 0.8, 1.1, 0],
                opacity: [1, 1, 0.8, 0.5, 0],
                y: [0, -60, -100, -140, -180],
                x: [0, (Math.random() - 0.5) * 80],
                rotate: [0, (Math.random() - 0.5) * 40],
            }}
            transition={{ duration: 1.8, delay, ease: 'easeOut' }}
        >
            💕
        </motion.div>
    )
}

export default function HeartBurst({ trigger }) {
    const [hearts, setHearts] = useState([])

    useEffect(() => {
        if (trigger > 0) {
            const newHearts = Array.from({ length: 8 }, (_, i) => ({
                id: `${trigger}-${i}`,
                x: `${30 + Math.random() * 40}%`,
                y: `${40 + Math.random() * 30}%`,
                size: `${1.2 + Math.random() * 1.2}rem`,
                delay: i * 0.08,
            }))
            setHearts(newHearts)

            const timer = setTimeout(() => setHearts([]), 2500)
            return () => clearTimeout(timer)
        }
    }, [trigger])

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            <AnimatePresence>
                {hearts.map((h) => (
                    <Heart key={h.id} {...h} />
                ))}
            </AnimatePresence>
        </div>
    )
}
