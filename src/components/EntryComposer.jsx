import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import AreYouOkayModal from './AreYouOkayModal'
import LinkPreview, { extractFirstUrl } from './LinkPreview'
import TagsManager from './TagsManager'
import EntryTemplates from './EntryTemplates'

const MOODS = ['❤️', '😊', '😢', '🥰', '✨', '😡', '🌙', '🦋', '🫂', '☕']

// Moods that may indicate the user is not feeling great
const EMOTIONAL_MOODS = new Set(['😢', '😡', '🌙'])

// Hindi + English keywords that suggest emotional distress
const EMOTIONAL_KEYWORDS = [
    'udaas', 'rona', 'rone', 'hurt', 'sad', 'dard', 'akela', 'akeli',
    'cry', 'crying', 'pain', 'broken', 'takleef', 'pareshan', 'dukh',
    'mushkil', 'tanha', 'lonely', 'lost', 'hopeless', 'tired', 'exhaust',
]

export default function EntryComposer({ onEntryAdded, activeTab }) {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [text, setText] = useState('')
    const [mood, setMood] = useState('❤️')
    const [tags, setTags] = useState([])
    const [category, setCategory] = useState('Personal')
    const [isPrivate, setIsPrivate] = useState(false)
    const [isSecretLetter, setIsSecretLetter] = useState(false)
    const [unlockDate, setUnlockDate] = useState('')
    const [sending, setSending] = useState(false)
    const [showAreYouOkay, setShowAreYouOkay] = useState(false)
    const [errorMsg, setErrorMsg] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const textRef = useRef(null)
    const previewTimer = useRef(null)

    useEffect(() => {
        setIsPrivate(activeTab === 'personal')
    }, [activeTab])

    // Debounced URL detection for live preview
    useEffect(() => {
        clearTimeout(previewTimer.current)
        previewTimer.current = setTimeout(() => {
            setPreviewUrl(extractFirstUrl(text))
        }, 600)
        return () => clearTimeout(previewTimer.current)
    }, [text])

    useEffect(() => {
        if (isOpen && textRef.current) {
            setTimeout(() => textRef.current?.focus(), 300)
        }
    }, [isOpen])

    const handleSubmit = async () => {
        if (!text.trim() || sending) return

        setSending(true)
        try {
            const { error } = await supabase.from('entries').insert({
                user_id: user.id,
                text: text.trim(),
                mood,
                tags,
                category,
                is_private: isPrivate,
                ...(isSecretLetter && unlockDate ? { unlock_date: new Date(unlockDate).toISOString() } : {}),
            })

            if (error) throw error

            setText('')
            setMood('❤️')
            setTags([])
            setCategory('Personal')
            setIsSecretLetter(false)
            setUnlockDate('')

            // Check if entry is emotional before closing
            const lowerText = text.trim().toLowerCase()
            const hasEmotionalMood = EMOTIONAL_MOODS.has(mood)
            const hasEmotionalKeyword = EMOTIONAL_KEYWORDS.some((kw) => lowerText.includes(kw))

            if (hasEmotionalMood || hasEmotionalKeyword) {
                // Show modal first, close composer after modal is dismissed
                setShowAreYouOkay(true)
            } else {
                setIsOpen(false)
                onEntryAdded?.()
            }
        } catch (err) {
            console.error('Failed to post entry:', err)
            setErrorMsg('Could not post entry. Please try again.')
            setTimeout(() => setErrorMsg(null), 4000)
        } finally {
            setSending(false)
        }
    }

    const handleAreYouOkayClose = () => {
        setShowAreYouOkay(false)
        setIsOpen(false)
        onEntryAdded?.()
    }

    return (
        <>
            {/* Are You Okay Modal */}
            {showAreYouOkay && <AreYouOkayModal onClose={handleAreYouOkayClose} />}
            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40"
                        style={{
                            background: 'radial-gradient(circle at center bottom, rgba(183,110,121,0.08), rgba(0,0,0,0.7) 60%)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                        }}
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Composer Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6"
                        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
                    >
                        <div
                            className="p-5 max-w-lg mx-auto rounded-2xl"
                            style={{
                                background: 'linear-gradient(145deg, rgba(20, 16, 18, 0.97) 0%, rgba(14, 11, 13, 0.98) 100%)',
                                border: '1px solid rgba(183, 110, 121, 0.08)',
                                boxShadow: '0 -10px 40px rgba(0,0,0,0.4), 0 0 60px rgba(183,110,121,0.04)',
                                backdropFilter: 'blur(40px)',
                            }}
                        >
                            {/* Drag handle */}
                            <div className="w-10 h-1 rounded-full mx-auto mb-5"
                                style={{ background: 'linear-gradient(to right, rgba(183,110,121,0.2), rgba(212,175,55,0.15))' }}
                            />

                            {/* Title */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-handwriting text-[22px]" style={{ color: 'rgba(230,184,192,0.6)' }}>
                                    {isSecretLetter ? 'Dear Future...' : isPrivate ? 'Dear Diary...' : 'Dear Us...'}
                                </h3>

                                <div className="flex items-center gap-2">
                                    {/* Secret Letter Toggle */}
                                    <motion.button
                                        onClick={() => setIsSecretLetter(!isSecretLetter)}
                                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                                        style={{
                                            background: isSecretLetter
                                                ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(183,110,121,0.15))'
                                                : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${isSecretLetter ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                        }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Secret Letter"
                                    >
                                        <motion.span
                                            animate={{ rotate: isSecretLetter ? [0, -10, 10, 0] : 0 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            💌
                                        </motion.span>
                                    </motion.button>

                                    {/* Privacy Toggle */}
                                    <motion.button
                                        onClick={() => setIsPrivate(!isPrivate)}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-body"
                                        style={{
                                            background: isPrivate
                                                ? 'linear-gradient(135deg, rgba(183,110,121,0.15), rgba(183,110,121,0.08))'
                                                : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${isPrivate ? 'rgba(183,110,121,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                            color: isPrivate ? '#e6b8c0' : 'rgba(255,255,255,0.35)',
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <motion.span
                                            key={isPrivate ? 'lock' : 'globe'}
                                            initial={{ scale: 0.5, rotate: -30 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                        >
                                            {isPrivate ? '🔒' : '🌍'}
                                        </motion.span>
                                        <span>{isPrivate ? 'Private' : 'Shared'}</span>
                                    </motion.button>
                                </div>
                            </div>

                            {/* Secret Letter Date Picker */}
                            <AnimatePresence>
                                {isSecretLetter && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden mb-4"
                                    >
                                        <div
                                            className="p-3 rounded-xl"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(183,110,121,0.04))',
                                                border: '1px solid rgba(212,175,55,0.12)',
                                            }}
                                        >
                                            <p className="text-[11px] font-body mb-2" style={{ color: 'rgba(212,175,55,0.6)' }}>
                                                💌 This letter will stay sealed until the date you choose
                                            </p>
                                            <input
                                                type="date"
                                                value={unlockDate}
                                                onChange={(e) => setUnlockDate(e.target.value)}
                                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                                className="w-full px-3 py-2 rounded-lg text-[13px] font-body"
                                                style={{
                                                    background: 'rgba(0,0,0,0.3)',
                                                    border: '1px solid rgba(212,175,55,0.15)',
                                                    color: '#d4af37',
                                                    outline: 'none',
                                                    colorScheme: 'dark',
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Mood Picker */}
                            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
                                {MOODS.map((m) => (
                                    <motion.button
                                        key={m}
                                        onClick={() => setMood(m)}
                                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-200"
                                        style={{
                                            background: mood === m
                                                ? 'linear-gradient(135deg, rgba(183,110,121,0.2), rgba(212,175,55,0.1))'
                                                : 'rgba(255,255,255,0.03)',
                                            border: mood === m
                                                ? '1px solid rgba(183,110,121,0.3)'
                                                : '1px solid transparent',
                                            boxShadow: mood === m
                                                ? '0 2px 8px rgba(183,110,121,0.15)'
                                                : 'none',
                                        }}
                                        whileTap={{ scale: 0.85 }}
                                    >
                                        {m}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Templates & Tags */}
                            <EntryTemplates onSelectTemplate={(t) => {
                                setText(t.content)
                                setMood(t.mood)
                                setCategory(t.category)
                                setTags(t.tags)
                            }} />

                            <TagsManager
                                selectedCategory={category}
                                setSelectedCategory={setCategory}
                                selectedTags={tags}
                                setSelectedTags={setTags}
                            />

                            {/* Text Input — diary style */}
                            <div className="relative group mb-4">
                                <div
                                    className="absolute -inset-[1px] rounded-[13px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(183,110,121,0.2), rgba(212,175,55,0.15))',
                                    }}
                                />
                                <textarea
                                    ref={textRef}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder={isPrivate ? "Apni dil ki baat yahan likho..." : "Humari kahani likho yahan..."}
                                    rows={4}
                                    maxLength={2000}
                                    className="relative w-full px-4 py-3.5 text-[16px] leading-relaxed resize-none rounded-xl"
                                    style={{
                                        fontFamily: "'Caveat', cursive",
                                        fontSize: '18px',
                                        background: 'rgba(253, 246, 236, 0.04)',
                                        border: '1px solid rgba(253, 246, 236, 0.06)',
                                        color: '#e8e0e2',
                                        outline: 'none',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'rgba(183, 110, 121, 0.3)'
                                        e.target.style.background = 'rgba(253, 246, 236, 0.06)'
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(253, 246, 236, 0.06)'
                                        e.target.style.background = 'rgba(253, 246, 236, 0.04)'
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
                                    }}
                                />
                            </div>

                            {/* Live link preview */}
                            {previewUrl && <LinkPreview url={previewUrl} compact />}

                            {/* Error toast */}
                            <AnimatePresence>
                                {errorMsg && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="text-[11px] text-center font-body mb-2"
                                        style={{ color: 'rgba(248,113,113,0.75)' }}
                                    >
                                        ⚠️ {errorMsg}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* Bottom Bar */}
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-white/15 font-body">
                                    {text.length}/2000
                                </span>
                                <div className="flex gap-2">
                                    <motion.button
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2.5 text-[13px] text-white/30 hover:text-white/50 transition-colors rounded-xl"
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        onClick={handleSubmit}
                                        disabled={!text.trim() || sending}
                                        className="relative text-[13px] px-5 py-2.5 font-medium rounded-xl text-white overflow-hidden"
                                        style={{
                                            background: 'linear-gradient(135deg, #b76e79 0%, #a05a65 50%, #b76e79 100%)',
                                            backgroundSize: '200% auto',
                                            opacity: !text.trim() || sending ? 0.4 : 1,
                                            cursor: !text.trim() || sending ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 4px 15px rgba(183,110,121,0.25)',
                                        }}
                                        whileHover={text.trim() && !sending ? { backgroundPosition: '100% center', scale: 1.02 } : {}}
                                        whileTap={text.trim() && !sending ? { scale: 0.97 } : {}}
                                    >
                                        {sending ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </span>
                                        ) : isPrivate ? (
                                            '🔒 Save'
                                        ) : (
                                            '💕 Share'
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB — gradient ring with glow */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed z-30 flex items-center justify-center"
                style={{
                    width: 58, height: 58,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #b76e79, #d4af37)',
                    bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
                    right: '1.25rem',
                    boxShadow: '0 8px 30px rgba(183,110,121,0.4), 0 0 20px rgba(212,175,55,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
                whileHover={{ scale: 1.1, boxShadow: '0 10px 40px rgba(183,110,121,0.5)' }}
                whileTap={{ scale: 0.9 }}
                animate={isOpen
                    ? { scale: 0, opacity: 0, rotate: 90 }
                    : { scale: 1, opacity: 1, rotate: 0 }
                }
            >
                <span className="text-2xl leading-none">✍️</span>
            </motion.button>
        </>
    )
}
