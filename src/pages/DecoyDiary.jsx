import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDecoyMode } from '../context/DecoyModeContext'
import FloatingPetals from '../components/FloatingPetals'

// Generic fake notes shown in decoy mode
const FAKE_NOTES = [
    {
        id: 1,
        emoji: '📅',
        title: 'Padhne beth jana @4 baje',
        text: 'Chemestry bachi h.',
        time: 'Today, 11:24 AM',
        tag: 'Work',
    },
    {
        id: 2,
        emoji: '👾',
        title: 'Streaching',
        text: 'Dheele dhale haath pair theek karenge.',
        time: 'Yesterday, 7:05 PM',
        tag: 'health',
    },
    {
        id: 3,
        emoji: '📞',
        title: 'Call chanchal',
        text: 'She asked me to call after 8.',
        time: 'Yesterday, 2:30 PM',
        tag: 'Personal',
    },
    {
        id: 4,
        emoji: '👱‍♀️🪮',
        title: 'Wash hair',
        text: 'Wash hair.',
        time: '2 days ago',
        tag: 'Health',
    },
    {
        id: 5,
        emoji: '🍇',
        title: 'Kuch banaungi',
        text: 'Kuch tasty bana ke akle khaungi.',
        time: '2 days ago',
        tag: 'personal',
    },
]

export default function DecoyDiary() {
    const { exitDecoyMode } = useDecoyMode()
    const [showHelp, setShowHelp] = useState(false)

    const handleLogout = () => {
        exitDecoyMode()
    }

    return (
        <div className="relative h-full flex flex-col overflow-hidden">
            <FloatingPetals />

            {/* Subtle decoy indicator — only real user knows what this means */}
            <div
                className="fixed top-3 left-3 z-50 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}
                title="Safe Mode Active"
            >
                <span className="text-[10px] opacity-30">🛡️</span>
            </div>

            {/* Header */}
            <header className="relative z-20 flex-shrink-0">
                <div
                    className="px-5 sm:px-6 pt-4 pb-3 flex items-center justify-between"
                    style={{
                        background: 'linear-gradient(180deg, rgba(10,10,15,0.98) 0%, rgba(10,10,15,0.9) 60%, rgba(10,10,15,0.7) 100%)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <div>
                        <motion.h1
                            className="font-script text-3xl sm:text-4xl bg-clip-text text-transparent leading-tight"
                            style={{
                                backgroundImage: 'linear-gradient(135deg, #e6b8c0 0%, #d4af37 45%, #e6b8c0 100%)',
                            }}
                        >
                            Notes
                        </motion.h1>
                        <p className="text-[9px] text-white/15 tracking-[2px] uppercase font-body mt-0.5">
                            My Notes
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <motion.button
                            onClick={() => setShowHelp(true)}
                            className="text-[11px] text-white/20 hover:text-white/40 transition-all duration-300 font-body px-3 py-1.5 rounded-full"
                            style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Help
                        </motion.button>
                        <motion.button
                            onClick={handleLogout}
                            className="text-[11px] text-white/20 hover:text-rose-gold/70 transition-all duration-300 font-body px-3 py-1.5 rounded-full hover:bg-rose-gold/5"
                            style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                            whileHover={{ borderColor: 'rgba(183,110,121,0.2)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Logout
                        </motion.button>
                    </div>
                </div>

                <div
                    className="h-[1px]"
                    style={{
                        background: 'linear-gradient(to right, transparent 5%, rgba(183,110,121,0.1) 30%, rgba(212,175,55,0.08) 70%, transparent 95%)',
                    }}
                />
            </header>

            {/* Notes Feed */}
            <main
                className="relative z-10 flex-1 overflow-y-auto pb-10"
                style={{
                    maskImage: 'linear-gradient(180deg, transparent 0%, black 1.5%, black 96%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 1.5%, black 96%, transparent 100%)',
                }}
            >
                <div className="px-4 sm:px-6 pt-6 space-y-4">
                    {FAKE_NOTES.map((note, i) => (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="p-4 rounded-2xl"
                            style={{
                                background: 'linear-gradient(145deg, rgba(20,16,18,0.9), rgba(14,11,13,0.95))',
                                border: '1px solid rgba(255,255,255,0.05)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            }}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xl">{note.emoji}</span>
                                    <span
                                        className="font-handwriting text-[17px]"
                                        style={{ color: 'rgba(230,184,192,0.75)' }}
                                    >
                                        {note.title}
                                    </span>
                                </div>
                                <span
                                    className="text-[9px] px-2 py-0.5 rounded-full font-body"
                                    style={{
                                        background: 'rgba(183,110,121,0.08)',
                                        border: '1px solid rgba(183,110,121,0.12)',
                                        color: 'rgba(183,110,121,0.5)',
                                    }}
                                >
                                    {note.tag}
                                </span>
                            </div>
                            <p
                                className="font-body text-[13px] leading-relaxed ml-8"
                                style={{ color: 'rgba(232,224,226,0.45)' }}
                            >
                                {note.text}
                            </p>
                            <p
                                className="font-body text-[10px] mt-2.5 ml-8"
                                style={{ color: 'rgba(255,255,255,0.15)' }}
                            >
                                {note.time}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Help Modal */}
            <AnimatePresence>
                {showHelp && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                            onClick={() => setShowHelp(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 p-6 rounded-2xl max-w-sm mx-auto"
                            style={{
                                background: 'linear-gradient(145deg, rgba(20,16,18,0.97), rgba(14,11,13,0.98))',
                                border: '1px solid rgba(183,110,121,0.1)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            }}
                        >
                            <h3 className="font-handwriting text-2xl text-center mb-4" style={{ color: 'rgba(230,184,192,0.7)' }}>
                                Help
                            </h3>
                            <div className="space-y-3 text-[13px] font-body" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                <p>• To add a new note, tap the ✍️ button</p>
                                <p>• Tap a note to expand it</p>
                                <p>• Notes are saved automatically</p>
                                <p>• For support, contact us at support@sidekick.app</p>
                            </div>
                            <motion.button
                                onClick={() => setShowHelp(false)}
                                className="mt-5 w-full py-2.5 rounded-xl text-[13px] font-body font-medium"
                                style={{
                                    background: 'linear-gradient(135deg, #b76e79, #a05a65)',
                                    color: '#fff',
                                }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Close
                            </motion.button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
