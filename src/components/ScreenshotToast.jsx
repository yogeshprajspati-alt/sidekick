import { motion, AnimatePresence } from 'framer-motion'

export default function ScreenshotToast({ visible, onDismiss }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-3 rounded-2xl flex items-center gap-3 cursor-pointer"
                    style={{
                        background: 'linear-gradient(135deg, rgba(30,24,10,0.97), rgba(20,16,8,0.98))',
                        border: '1px solid rgba(251,191,36,0.2)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 20px rgba(251,191,36,0.08)',
                        backdropFilter: 'blur(20px)',
                        maxWidth: '85vw',
                    }}
                    onClick={onDismiss}
                >
                    {/* Amber glow dot */}
                    <motion.div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: '#fbbf24' }}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <p className="font-body text-[12px] leading-snug" style={{ color: 'rgba(251,191,36,0.8)' }}>
                        📸 Koi dekh raha tha?
                        <span className="block text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            Tab ne focus khoya — sirf tumhare liye 🛡️
                        </span>
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
