import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Comments({ entryId }) {
    const { user } = useAuth()
    const [comments, setComments] = useState([])
    const [showComments, setShowComments] = useState(false)
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const inputRef = useRef(null)

    useEffect(() => {
        if (showComments) fetchComments()

        const channel = supabase
            .channel(`comments-${entryId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'comments', filter: `entry_id=eq.${entryId}` },
                () => fetchComments()
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [entryId, showComments])

    const fetchComments = async () => {
        const { data } = await supabase
            .from('comments')
            .select('*')
            .eq('entry_id', entryId)
            .order('created_at', { ascending: true })
        setComments(data || [])
    }

    const handleSubmit = async (e) => {
        e?.preventDefault()
        if (!text.trim() || sending) return
        setSending(true)
        try {
            const { error } = await supabase.from('comments').insert({
                entry_id: entryId,
                user_id: user.id,
                text: text.trim(),
            })
            if (error) throw error
            setText('')
            if (!showComments) setShowComments(true)
        } catch (err) {
            console.error('Failed to post comment:', err)
        } finally {
            setSending(false)
        }
    }

    const handleDelete = async (id) => {
        await supabase.from('comments').delete().eq('id', id)
    }

    const formatTime = (dateStr) => {
        const d = new Date(dateStr)
        const now = new Date()
        const mins = Math.floor((now - d) / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        return `${Math.floor(hours / 24)}d ago`
    }

    return (
        <div className="relative z-10 mt-2">
            {/* Toggle */}
            <button
                onClick={() => { setShowComments(!showComments); if (!showComments) fetchComments() }}
                className="flex items-center gap-[6px] py-1 transition-all"
                style={{
                    fontSize: 11,
                    fontFamily: "'Inter', sans-serif",
                    color: showComments ? '#b76e79' : '#9a8b7a',
                    letterSpacing: '0.2px',
                }}
            >
                <span style={{ fontSize: 13 }}>💬</span>
                <span style={{ fontWeight: 500 }}>
                    {comments.length > 0
                        ? `${comments.length} note${comments.length > 1 ? 's' : ''}`
                        : 'Leave a note'}
                </span>
                <motion.span
                    animate={{ rotate: showComments ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ fontSize: 8, opacity: 0.5 }}
                >
                    ▼
                </motion.span>
            </button>

            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        {/* Comment thread */}
                        <div
                            className="mt-2 space-y-[10px] max-h-44 overflow-y-auto scrollbar-hide"
                            style={{
                                paddingLeft: 12,
                                borderLeft: '2px solid rgba(183,110,121,0.08)',
                            }}
                        >
                            {comments.length === 0 && (
                                <p style={{
                                    fontSize: 12,
                                    fontFamily: "'Caveat', cursive",
                                    color: 'rgba(107,76,59,0.3)',
                                    fontStyle: 'italic',
                                    padding: '4px 0',
                                }}>
                                    No notes yet... be the first 💕
                                </p>
                            )}
                            {comments.map((c, i) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group"
                                >
                                    {/* Bubble */}
                                    <div
                                        className="rounded-xl px-3 py-2"
                                        style={{
                                            background: c.user_id === user?.id
                                                ? 'linear-gradient(135deg, rgba(183,110,121,0.06), rgba(253,246,236,0.5))'
                                                : 'rgba(253,246,236,0.5)',
                                            border: c.user_id === user?.id
                                                ? '1px solid rgba(183,110,121,0.08)'
                                                : '1px solid rgba(180,160,140,0.06)',
                                        }}
                                    >
                                        <p
                                            className="font-handwriting leading-snug break-words"
                                            style={{
                                                fontSize: 16,
                                                color: '#4a3a35',
                                            }}
                                        >
                                            {c.text}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span style={{
                                                fontSize: 9,
                                                color: 'rgba(107,76,59,0.3)',
                                                fontFamily: "'Inter', sans-serif",
                                            }}>
                                                {c.user_id === user?.id ? '💗 me' : '🤍 them'} · {formatTime(c.created_at)}
                                            </span>
                                            {c.user_id === user?.id && (
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{
                                                        fontSize: 9,
                                                        color: '#c07070',
                                                        fontFamily: "'Inter', sans-serif",
                                                    }}
                                                >
                                                    delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
                            <input
                                ref={inputRef}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Write something sweet..."
                                maxLength={500}
                                className="flex-1 px-3 py-[8px] rounded-xl font-handwriting"
                                style={{
                                    fontSize: 15,
                                    background: 'rgba(253,246,236,0.4)',
                                    border: '1px solid rgba(180,160,140,0.1)',
                                    color: '#3a2e2f',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'rgba(183,110,121,0.2)'
                                    e.target.style.boxShadow = '0 0 0 3px rgba(183,110,121,0.04)'
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(180,160,140,0.1)'
                                    e.target.style.boxShadow = 'none'
                                }}
                            />
                            <motion.button
                                type="submit"
                                disabled={!text.trim() || sending}
                                className="rounded-xl font-body font-medium text-white"
                                style={{
                                    padding: '8px 14px',
                                    fontSize: 13,
                                    background: 'linear-gradient(135deg, #b76e79, #a05a65)',
                                    opacity: !text.trim() || sending ? 0.35 : 1,
                                    boxShadow: text.trim() && !sending ? '0 2px 8px rgba(183,110,121,0.15)' : 'none',
                                    transition: 'opacity 0.2s, box-shadow 0.2s',
                                }}
                                whileTap={{ scale: 0.93 }}
                            >
                                {sending ? '...' : '💌'}
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
