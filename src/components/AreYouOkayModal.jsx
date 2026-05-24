import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AreYouOkayModal({ onClose }) {
    const [response, setResponse] = useState(null) // null | 'okay' | 'talk' | 'hard'

    const handleClose = () => {
        setResponse(null)
        onClose()
    }

    return (
        <AnimatePresence>
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60]"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(183,110,121,0.12), rgba(0,0,0,0.75) 70%)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                    }}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.93 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                    className="fixed bottom-0 left-0 right-0 z-[70] px-4 pb-6"
                    style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
                >
                    <div
                        className="p-6 max-w-sm mx-auto rounded-3xl relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(145deg, rgba(22,16,19,0.98) 0%, rgba(14,11,13,0.99) 100%)',
                            border: '1px solid rgba(183,110,121,0.12)',
                            boxShadow: '0 -8px 40px rgba(0,0,0,0.4), 0 0 60px rgba(183,110,121,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
                        }}
                    >
                        {/* Ambient glow */}
                        <div
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full"
                            style={{
                                background: 'radial-gradient(ellipse, rgba(183,110,121,0.12) 0%, transparent 70%)',
                                filter: 'blur(20px)',
                            }}
                        />

                        {/* Drag handle */}
                        <div
                            className="w-10 h-1 rounded-full mx-auto mb-5"
                            style={{ background: 'linear-gradient(to right, rgba(183,110,121,0.3), rgba(212,175,55,0.2))' }}
                        />

                        <AnimatePresence mode="wait">
                            {!response ? (
                                /* Initial state */
                                <motion.div
                                    key="question"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Flower emoji with soft pulse */}
                                    <motion.div
                                        className="text-center mb-4"
                                        animate={{ scale: [1, 1.08, 1] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <span className="text-4xl">🌸</span>
                                    </motion.div>

                                    <h3
                                        className="font-handwriting text-[24px] text-center mb-1.5"
                                        style={{ color: 'rgba(230,184,192,0.85)' }}
                                    >
                                        Hey, sab theek hai?
                                    </h3>

                                    <p
                                        className="font-body text-[13px] text-center leading-relaxed mb-6"
                                        style={{ color: 'rgba(255,255,255,0.3)' }}
                                    >
                                        Tumne kuch likha jo bahut dil ka tha.{' '}
                                        <span style={{ color: 'rgba(183,110,121,0.6)' }}>Main bas yahan hoon. 💕</span>
                                    </p>

                                    {/* Response buttons */}
                                    <div className="space-y-2.5">
                                        <motion.button
                                            onClick={() => { setResponse('okay'); setTimeout(handleClose, 1200) }}
                                            className="w-full py-3.5 rounded-2xl text-[14px] font-body font-medium relative overflow-hidden"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(183,110,121,0.15), rgba(212,175,55,0.08))',
                                                border: '1px solid rgba(183,110,121,0.2)',
                                                color: '#e6b8c0',
                                            }}
                                            whileHover={{ scale: 1.01, borderColor: 'rgba(183,110,121,0.35)' }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            Haan, sab theek hai ✨
                                        </motion.button>

                                        <motion.button
                                            onClick={() => setResponse('talk')}
                                            className="w-full py-3.5 rounded-2xl text-[14px] font-body font-medium"
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                color: 'rgba(255,255,255,0.5)',
                                            }}
                                            whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.15)' }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            Baat karni hai 💬
                                        </motion.button>

                                        <motion.button
                                            onClick={() => setResponse('hard')}
                                            className="w-full py-3.5 rounded-2xl text-[14px] font-body font-medium"
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                color: 'rgba(255,255,255,0.3)',
                                            }}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            Nahi, aaj thoda mushkil hai 😢
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ) : response === 'okay' ? (
                                /* Okay response */
                                <motion.div
                                    key="okay-resp"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center py-4"
                                >
                                    <motion.span
                                        className="text-5xl block mb-3"
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 0.6 }}
                                    >✨</motion.span>
                                    <p className="font-handwriting text-[20px]" style={{ color: 'rgba(230,184,192,0.7)' }}>
                                        Yahi sunna chahta tha 💕
                                    </p>
                                </motion.div>
                            ) : response === 'talk' ? (
                                /* Talk response */
                                <motion.div
                                    key="talk-resp"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="text-center mb-4">
                                        <span className="text-4xl">💬</span>
                                    </div>
                                    <div
                                        className="p-4 rounded-2xl mb-4"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(183,110,121,0.08), rgba(212,175,55,0.05))',
                                            border: '1px solid rgba(183,110,121,0.12)',
                                        }}
                                    >
                                        <p
                                            className="font-body text-[14px] text-center leading-relaxed"
                                            style={{ color: 'rgba(255,255,255,0.55)' }}
                                        >
                                            Deepak se baat karo —{' '}
                                            <span style={{ color: 'rgba(230,184,192,0.7)' }}>woh hamesha sunenge. 💕</span>
                                        </p>
                                        <p
                                            className="font-body text-[12px] text-center mt-2"
                                            style={{ color: 'rgba(255,255,255,0.2)' }}
                                        >
                                            Tum akeli nahi ho. Kabhi nahi.
                                        </p>
                                    </div>
                                    <motion.button
                                        onClick={handleClose}
                                        className="w-full py-3 rounded-2xl text-[13px] font-body"
                                        style={{
                                            background: 'linear-gradient(135deg, #b76e79, #a05a65)',
                                            color: '#fff',
                                        }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        Theek hai 💕
                                    </motion.button>
                                </motion.div>
                            ) : (
                                /* Hard day response */
                                <motion.div
                                    key="hard-resp"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="text-center mb-4">
                                        <motion.span
                                            className="text-4xl block"
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        >🌙</motion.span>
                                    </div>
                                    <div
                                        className="p-4 rounded-2xl mb-4"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(100,80,180,0.08), rgba(183,110,121,0.06))',
                                            border: '1px solid rgba(183,110,121,0.1)',
                                        }}
                                    >
                                        <p
                                            className="font-handwriting text-[18px] text-center mb-2"
                                            style={{ color: 'rgba(230,184,192,0.7)' }}
                                        >
                                            That's okay.
                                        </p>
                                        <p
                                            className="font-body text-[13px] text-center leading-relaxed"
                                            style={{ color: 'rgba(255,255,255,0.4)' }}
                                        >
                                            Kuch din bhari hoti hai.{' '}
                                            <span style={{ color: 'rgba(183,110,121,0.65)' }}>
                                                Tum bahut zyada pyaari ho aur bahut zyada loved ho.
                                            </span>{' '}
                                            Yeh feeling guzar jaayegi. 💕
                                        </p>
                                    </div>
                                    <motion.button
                                        onClick={handleClose}
                                        className="w-full py-3 rounded-2xl text-[13px] font-body"
                                        style={{
                                            background: 'linear-gradient(135deg, #b76e79, #a05a65)',
                                            color: '#fff',
                                        }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        Shukriya 🌸
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </>
        </AnimatePresence>
    )
}
