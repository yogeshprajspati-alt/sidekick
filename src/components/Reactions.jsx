import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const REACTION_EMOJIS = [
    '❤️', '💕', '💗', '💘', '💝', '🥺', '🥰', '😍', '😘',
    '😂', '🤣', '😭', '😢', '🫂', '🤗', '🥹',
    '🔥', '💯', '👑', '⭐', '✨', '🌹', '💋', '🦋',
    '🎉', '👏', '💪', '🙈', '☕', '🍫',
]

export default function Reactions({ entryId }) {
    const { user } = useAuth()
    const [reactions, setReactions] = useState([])
    const [showPicker, setShowPicker] = useState(false)

    useEffect(() => {
        fetchReactions()

        const channel = supabase
            .channel(`reactions-${entryId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reactions', filter: `entry_id=eq.${entryId}` },
                () => fetchReactions()
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [entryId])

    const fetchReactions = async () => {
        const { data } = await supabase
            .from('reactions')
            .select('*')
            .eq('entry_id', entryId)
        setReactions(data || [])
    }

    const grouped = reactions.reduce((acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false }
        acc[r.emoji].count++
        if (r.user_id === user?.id) acc[r.emoji].mine = true
        return acc
    }, {})

    const hasReactions = Object.keys(grouped).length > 0

    const toggleReaction = async (emoji) => {
        const existing = reactions.find(
            (r) => r.emoji === emoji && r.user_id === user?.id
        )
        if (existing) {
            await supabase.from('reactions').delete().eq('id', existing.id)
        } else {
            await supabase.from('reactions').insert({
                entry_id: entryId,
                user_id: user.id,
                emoji,
            })
        }
        setShowPicker(false)
        fetchReactions()
    }

    return (
        <>
            {/* Soft divider before reactions area */}
            <div
                className="relative z-10 mt-4 mb-2"
                style={{
                    height: 1,
                    background: 'linear-gradient(to right, transparent 5%, rgba(183,110,121,0.08) 30%, rgba(183,110,121,0.08) 70%, transparent 95%)',
                }}
            />

            {/* Reaction pills + add button */}
            <div className="relative z-10 flex items-center gap-[6px] flex-wrap">
                {Object.entries(grouped).map(([emoji, data]) => (
                    <motion.button
                        key={emoji}
                        onClick={() => toggleReaction(emoji)}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-[3px] rounded-full transition-all"
                        style={{
                            padding: '4px 10px 4px 7px',
                            background: data.mine
                                ? 'linear-gradient(135deg, rgba(183,110,121,0.12), rgba(212,175,55,0.06))'
                                : 'rgba(253,246,236,0.6)',
                            border: data.mine
                                ? '1px solid rgba(183,110,121,0.2)'
                                : '1px solid rgba(180,160,140,0.12)',
                            boxShadow: data.mine
                                ? '0 1px 4px rgba(183,110,121,0.08)'
                                : '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                        whileTap={{ scale: 0.9 }}
                        layout
                    >
                        <span style={{ fontSize: 15, lineHeight: 1 }}>{emoji}</span>
                        <span style={{
                            color: data.mine ? '#b76e79' : '#9a8b7a',
                            fontSize: 11,
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 600,
                            letterSpacing: '-0.3px',
                        }}>
                            {data.count}
                        </span>
                    </motion.button>
                ))}

                {/* + button */}
                <motion.button
                    onClick={() => setShowPicker(true)}
                    className="flex items-center justify-center rounded-full transition-all"
                    style={{
                        width: hasReactions ? 28 : 'auto',
                        height: 28,
                        padding: hasReactions ? 0 : '0 10px',
                        background: 'rgba(253,246,236,0.4)',
                        border: '1px dashed rgba(180,160,140,0.15)',
                        color: '#a09080',
                        fontSize: hasReactions ? 15 : 11,
                        fontFamily: "'Inter', sans-serif",
                        gap: 4,
                    }}
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ borderColor: 'rgba(183,110,121,0.2)' }}
                >
                    {hasReactions ? '+' : <><span>✨</span><span>React</span></>}
                </motion.button>
            </div>

            {/* Bottom sheet picker — portaled to body */}
            {createPortal(
                <AnimatePresence>
                    {showPicker && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 z-[100]"
                                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
                                onClick={() => setShowPicker(false)}
                            />

                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                                className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-3xl"
                                style={{
                                    background: 'linear-gradient(180deg, #fdf6ec 0%, #f5ead6 100%)',
                                    boxShadow: '0 -12px 40px rgba(0,0,0,0.12), 0 -2px 10px rgba(183,110,121,0.06)',
                                    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                                }}
                            >
                                {/* Handle */}
                                <div className="flex justify-center pt-3 pb-1">
                                    <div style={{
                                        width: 32, height: 4, borderRadius: 2,
                                        background: 'linear-gradient(to right, rgba(183,110,121,0.15), rgba(212,175,55,0.12))',
                                    }} />
                                </div>

                                {/* Title */}
                                <p style={{
                                    textAlign: 'center',
                                    fontFamily: "'Caveat', cursive",
                                    fontSize: 20,
                                    color: '#6b4c3b',
                                    margin: '4px 0 14px',
                                }}>
                                    How does this make you feel? ✨
                                </p>

                                {/* Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(6, 1fr)',
                                    gap: 6,
                                    padding: '0 14px 14px',
                                    maxWidth: 360,
                                    margin: '0 auto',
                                }}>
                                    {REACTION_EMOJIS.map((emoji, i) => (
                                        <motion.button
                                            key={emoji}
                                            onClick={() => toggleReaction(emoji)}
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.015, duration: 0.2 }}
                                            className="flex items-center justify-center rounded-2xl transition-all"
                                            style={{
                                                aspectRatio: '1',
                                                fontSize: 22,
                                                background: grouped[emoji]?.mine
                                                    ? 'linear-gradient(135deg, rgba(183,110,121,0.15), rgba(212,175,55,0.08))'
                                                    : 'rgba(255,255,255,0.6)',
                                                border: grouped[emoji]?.mine
                                                    ? '2px solid rgba(183,110,121,0.25)'
                                                    : '1px solid rgba(180,160,140,0.08)',
                                                boxShadow: grouped[emoji]?.mine
                                                    ? '0 2px 8px rgba(183,110,121,0.1)'
                                                    : '0 1px 3px rgba(0,0,0,0.04)',
                                            }}
                                            whileTap={{ scale: 0.8 }}
                                        >
                                            {emoji}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    )
}
