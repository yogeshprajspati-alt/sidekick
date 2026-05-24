import { motion, AnimatePresence } from 'framer-motion'

export default function SafeWordBanner({ until, onResume }) {
    const now = Date.now()
    const remaining = Math.max(0, until - now)
    const minutes = Math.ceil(remaining / 60000)

    if (!until || remaining <= 0) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="mx-4 mb-4 rounded-2xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(15,20,40,0.97), rgba(10,15,30,0.98))',
                    border: '1px solid rgba(96,165,250,0.2)',
                    boxShadow: '0 4px 20px rgba(96,165,250,0.08)',
                }}
            >
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div>
                        <p className="font-handwriting text-[20px]" style={{ color: 'rgba(147,197,253,0.9)' }}>
                            Sab theek hai 💙
                        </p>
                        <p className="font-body text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            Break chal raha hai · {minutes} min bache hain
                        </p>
                    </div>
                    <button
                        onClick={onResume}
                        className="flex-shrink-0 px-4 py-2 rounded-xl font-body text-[12px] transition-all"
                        style={{
                            background: 'rgba(96,165,250,0.1)',
                            border: '1px solid rgba(96,165,250,0.2)',
                            color: 'rgba(147,197,253,0.7)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(96,165,250,0.18)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(96,165,250,0.1)'}
                    >
                        Resume
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
