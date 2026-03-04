import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const TYPE_STYLE = {
    truth: {
        icon: '🎭',
        label: 'TRUTH',
        color: 'rgba(129,140,248,0.9)',
        dim: 'rgba(129,140,248,0.5)',
        bg: 'rgba(129,140,248,0.08)',
        border: 'rgba(129,140,248,0.18)',
        glow: 'rgba(129,140,248,0.06)',
        confetti: ['🎭', '✨', '💜'],
    },
    dare: {
        icon: '🎯',
        label: 'DARE',
        color: 'rgba(251,146,60,0.9)',
        dim: 'rgba(251,146,60,0.5)',
        bg: 'rgba(251,146,60,0.07)',
        border: 'rgba(251,146,60,0.18)',
        glow: 'rgba(251,146,60,0.06)',
        confetti: ['🎯', '🔥', '⚡'],
    },
}

const INTENSITY_DOT = { soft: '#4ade80', medium: '#facc15', deep: '#f87171' }
const REPLY_REACTIONS = ['❤️', '🌸', '😊', '🥺', '💙', '✨', '😂', '🔥']
const ANSWER_TIME_LIMIT = 120 // seconds to answer

// Fixed countdown using useEffect
function UnsendTimer({ sentAt, onUnsend }) {
    const [timeLeft, setTimeLeft] = useState(() => {
        const elapsed = Date.now() - new Date(sentAt).getTime()
        return Math.max(0, 120 - Math.floor(elapsed / 1000))
    })

    useEffect(() => {
        if (timeLeft <= 0) return
        const t = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { clearInterval(t); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(t)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    if (timeLeft <= 0) return null

    const pct = timeLeft / 120
    return (
        <div className="flex items-center gap-2">
            <svg width="20" height="20" className="flex-shrink-0">
                <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                <circle
                    cx="10" cy="10" r="8" fill="none"
                    stroke="rgba(251,191,36,0.5)" strokeWidth="2"
                    strokeDasharray={`${pct * 50.3} 50.3`}
                    strokeLinecap="round"
                    transform="rotate(-90 10 10)"
                    style={{ transition: 'stroke-dasharray 1s linear' }}
                />
            </svg>
            <button
                onClick={onUnsend}
                className="text-[11px] font-body flex items-center gap-1 transition-colors"
                style={{ color: 'rgba(251,191,36,0.5)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(251,191,36,0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(251,191,36,0.5)'}
            >
                ↩ Unsend ({timeLeft}s)
            </button>
        </div>
    )
}

// Confetti burst — 3 emoji particles that fly out from center
function ConfettiBurst({ emojis, onDone }) {
    const particles = emojis.map((emoji, i) => {
        const angle = (i / emojis.length) * 360
        const rad = (angle * Math.PI) / 180
        const dist = 52 + Math.random() * 20
        return { emoji, x: Math.cos(rad) * dist, y: Math.sin(rad) * dist }
    })

    useEffect(() => {
        const t = setTimeout(onDone, 900)
        return () => clearTimeout(t)
    }, [onDone])

    return (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-30 flex items-center justify-center">
            {particles.map((p, i) => (
                <motion.span
                    key={i}
                    className="absolute text-[20px] select-none"
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{ x: p.x, y: p.y, scale: [0, 1.4, 0.8], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                >
                    {p.emoji}
                </motion.span>
            ))}
        </div>
    )
}

// ── Answer countdown timer (visible to receiver) ──
function AnswerCountdown({ sentAt, style }) {
    const [timeLeft, setTimeLeft] = useState(() => {
        const elapsed = Date.now() - new Date(sentAt).getTime()
        return Math.max(0, ANSWER_TIME_LIMIT - Math.floor(elapsed / 1000))
    })

    useEffect(() => {
        if (timeLeft <= 0) return
        const t = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { clearInterval(t); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(t)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const pct = timeLeft / ANSWER_TIME_LIMIT
    const isUrgent = timeLeft <= 30
    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60

    return (
        <motion.div
            className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl"
            style={{
                background: isUrgent ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
            }}
            animate={isUrgent ? { scale: [1, 1.01, 1] } : {}}
            transition={isUrgent ? { duration: 1, repeat: Infinity } : {}}
        >
            <svg width="24" height="24" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                <circle
                    cx="12" cy="12" r="10" fill="none"
                    stroke={isUrgent ? 'rgba(239,68,68,0.7)' : (style?.dim || 'rgba(129,140,248,0.5)')}
                    strokeWidth="2.5"
                    strokeDasharray={`${pct * 62.8} 62.8`}
                    strokeLinecap="round"
                    transform="rotate(-90 12 12)"
                    style={{ transition: 'stroke-dasharray 1s linear' }}
                />
            </svg>
            <div className="flex-1">
                <p className="font-body text-[11px] font-semibold" style={{ color: isUrgent ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.4)' }}>
                    {timeLeft <= 0 ? '⏰ Time\'s up!' : `⏱️ ${mins}:${secs.toString().padStart(2, '0')} left to answer`}
                </p>
                {isUrgent && timeLeft > 0 && (
                    <p className="font-body text-[9px]" style={{ color: 'rgba(239,68,68,0.5)' }}>Jaldi karo! ⚡</p>
                )}
            </div>
        </motion.div>
    )
}

export default function TruthDareRequestCard({ request, index, onUpdated, onPlayAgain }) {
    const { user } = useAuth()
    const isOwn = request.sender_id === user?.id
    const style = TYPE_STYLE[request.type] || TYPE_STYLE.truth

    const [answerText, setAnswerText] = useState('')
    const [showAnswer, setShowAnswer] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [isIncognito, setIsIncognito] = useState(false)
    const [replyReaction, setReplyReaction] = useState(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [otherTyping, setOtherTyping] = useState(false)
    const typingTimeout = useRef(null)
    const prevStatus = useRef(request.status)

    const isPending = request.status === 'pending'
    const isDeclined = request.status === 'declined'
    const isAnswered = request.status === 'answered' || request.status === 'approved'

    // ── Confetti: fire when status changes to answered ──
    useEffect(() => {
        if (prevStatus.current !== 'answered' && prevStatus.current !== 'approved'
            && (request.status === 'answered' || request.status === 'approved')) {
            setShowConfetti(true)
        }
        prevStatus.current = request.status
    }, [request.status])

    // ── Typing indicator via Supabase Broadcast ──
    useEffect(() => {
        if (!isPending) return

        const channel = supabase.channel(`td-typing-${request.id}`)

        channel
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                // If the other person is typing (not us)
                if (payload.user_id !== user?.id) {
                    setOtherTyping(true)
                    clearTimeout(typingTimeout.current)
                    typingTimeout.current = setTimeout(() => setOtherTyping(false), 2500)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            clearTimeout(typingTimeout.current)
        }
    }, [request.id, isPending, user?.id])

    // Broadcast our own typing
    const broadcastTyping = () => {
        if (!isPending || isOwn) return
        supabase.channel(`td-typing-${request.id}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: user?.id },
        })
    }

    const handleUnsend = async () => {
        await supabase.from('truth_dare_requests').delete().eq('id', request.id)
        onUpdated?.()
    }

    const handleDecline = async () => {
        await supabase
            .from('truth_dare_requests')
            .update({ status: 'declined', responded_at: new Date().toISOString() })
            .eq('id', request.id)
        onUpdated?.()
    }

    const handleSendReply = async () => {
        if ((!answerText.trim() && !isIncognito) || submitting) return
        setSubmitting(true)
        try {
            await supabase
                .from('truth_dare_requests')
                .update({
                    status: 'answered',
                    response_text: isIncognito ? null : answerText.trim(),
                    responded_at: new Date().toISOString(),
                })
                .eq('id', request.id)
            setShowAnswer(false)
            setAnswerText('')
            onUpdated?.()
        } finally {
            setSubmitting(false)
        }
    }

    if (isDeclined && !isOwn) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 20, scale: 0.9 }}
            animate={{ opacity: isDeclined ? 0.35 : 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ delay: index * 0.08, type: 'spring', damping: 18, stiffness: 150 }}
            className="relative rounded-2xl overflow-visible mb-3 origin-bottom text-left"
            style={{
                background: `linear-gradient(145deg, ${style.bg}, rgba(14,11,13,0.97))`,
                border: `1px solid ${style.border}`,
                boxShadow: `0 8px 32px ${style.glow}`,
                transformPerspective: 1200,
            }}
        >
            {/* Confetti burst */}
            <AnimatePresence>
                {showConfetti && (
                    <ConfettiBurst
                        emojis={style.confetti}
                        onDone={() => setShowConfetti(false)}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className="text-[10px] font-body font-semibold tracking-wider px-2.5 py-1 rounded-full"
                        style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color }}
                    >
                        {style.icon} {style.label}
                    </span>
                    <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: INTENSITY_DOT[request.intensity] || '#4ade80' }}
                        title={request.intensity}
                    />
                    {isPending && !isOwn && (
                        <motion.span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: style.color }}
                            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {/* Typing indicator for sender */}
                    <AnimatePresence>
                        {otherTyping && isOwn && isPending && (
                            <motion.span
                                initial={{ opacity: 0, x: 6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="font-body text-[10px] flex items-center gap-1"
                                style={{ color: style.dim }}
                            >
                                ✍️
                                <motion.span
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    typing...
                                </motion.span>
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <span className="font-body text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        {isOwn ? '~ me' : '~ them'} · {new Date(request.sent_at || request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    {isDeclined && <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Declined 🌙</span>}
                    {isAnswered && !isDeclined && <span className="text-[10px]" style={{ color: 'rgba(74,222,128,0.5)' }}>✓ Answered</span>}
                    {isPending && isOwn && (
                        <motion.span
                            className="text-[10px]"
                            style={{ color: 'rgba(251,191,36,0.5)' }}
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            Waiting...
                        </motion.span>
                    )}
                </div>
            </div>

            {/* Text */}
            <div className="px-4 pb-3">
                <p
                    className="whitespace-pre-wrap"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: '19px', color: 'rgba(232,224,226,0.8)', lineHeight: '26px' }}
                >
                    {request.text}
                </p>

                {/* Answered: collapsible response */}
                {isAnswered && (
                    <>
                        <motion.button
                            onClick={() => setIsExpanded(v => !v)}
                            className="mt-2 flex items-center gap-1.5 font-body text-[11px]"
                            style={{ color: style.dim }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <motion.span
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            >
                                ▶
                            </motion.span>
                            {isExpanded ? 'Hide answer' : 'Show answer'}
                        </motion.button>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                    className="overflow-hidden"
                                >
                                    {request.response_text ? (
                                        <div
                                            className="mt-3 pt-3 pl-3"
                                            style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', borderLeft: `2px solid ${style.border}` }}
                                        >
                                            <p className="font-body text-[10px] mb-1" style={{ color: style.dim }}>Answer</p>
                                            <p style={{ fontFamily: "'Caveat', cursive", fontSize: '17px', color: 'rgba(232,224,226,0.65)', lineHeight: '24px' }}>
                                                {request.response_text}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="mt-2 font-body text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                            🌙 Incognito — answer not saved
                                        </p>
                                    )}

                                    {/* Play Again button — inside expanded area */}
                                    {onPlayAgain && (
                                        <motion.button
                                            onClick={() => onPlayAgain({ type: request.type, intensity: request.intensity })}
                                            className="mt-3 w-full py-2 rounded-xl font-body text-[11px] flex items-center justify-center gap-1.5"
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${style.border}`,
                                                color: style.dim,
                                            }}
                                            whileTap={{ scale: 0.97 }}
                                            whileHover={{ background: style.bg }}
                                        >
                                            🎲 Play Again
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

            {/* Actions — only for pending */}
            {isPending && (
                <div
                    className="px-4 pb-4 pt-2 flex flex-col gap-2"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                    {isOwn ? (
                        <UnsendTimer sentAt={request.sent_at || request.created_at} onUnsend={handleUnsend} />
                    ) : (
                        <>
                            {/* Answer Timer */}
                            <AnswerCountdown sentAt={request.sent_at || request.created_at} style={style} />

                            <AnimatePresence>
                                {showAnswer && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        {/* Quick reaction strip */}
                                        <div className="flex gap-1.5 mb-2 flex-wrap">
                                            {REPLY_REACTIONS.map((emoji) => (
                                                <motion.button
                                                    key={emoji}
                                                    onClick={() => {
                                                        setReplyReaction(emoji)
                                                        setAnswerText((prev) => emoji + ' ' + prev)
                                                    }}
                                                    className="text-[18px] px-1.5 py-0.5 rounded-lg"
                                                    style={{
                                                        background: replyReaction === emoji ? style.bg : 'rgba(255,255,255,0.03)',
                                                        border: replyReaction === emoji ? `1px solid ${style.border}` : '1px solid rgba(255,255,255,0.04)',
                                                    }}
                                                    whileTap={{ scale: 0.85 }}
                                                >
                                                    {emoji}
                                                </motion.button>
                                            ))}
                                        </div>

                                        <textarea
                                            value={answerText}
                                            onChange={(e) => {
                                                setAnswerText(e.target.value.slice(0, 500))
                                                broadcastTyping()
                                            }}
                                            placeholder="Jawab likho..."
                                            rows={3}
                                            className="w-full resize-none rounded-xl px-3 py-2.5 font-body text-[13px] bg-transparent outline-none mb-2"
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${style.border}`,
                                                color: 'rgba(232,224,226,0.7)',
                                            }}
                                        />

                                        <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={isIncognito}
                                                onChange={(e) => setIsIncognito(e.target.checked)}
                                                className="accent-rose-400"
                                            />
                                            <span className="font-body text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                                🕵️ Incognito — answer save nahi hoga
                                            </span>
                                        </label>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setShowAnswer(false); setAnswerText(''); setReplyReaction(null) }}
                                                className="flex-1 py-2 rounded-xl font-body text-[12px]"
                                                style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                                            >
                                                Cancel
                                            </button>
                                            <motion.button
                                                onClick={handleSendReply}
                                                disabled={(!answerText.trim() && !isIncognito) || submitting}
                                                className="flex-1 py-2 rounded-xl font-body text-[12px] font-medium"
                                                style={{
                                                    background: (answerText.trim() || isIncognito) ? `linear-gradient(135deg, ${style.bg}, rgba(14,11,13,0.8))` : 'rgba(255,255,255,0.02)',
                                                    border: `1px solid ${style.border}`,
                                                    color: (answerText.trim() || isIncognito) ? style.color : 'rgba(255,255,255,0.2)',
                                                    boxShadow: (answerText.trim() || isIncognito) ? `0 4px 16px ${style.glow}` : 'none',
                                                }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                {submitting ? (
                                                    <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                                                        Sending...
                                                    </motion.span>
                                                ) : '📤 Send Reply'}
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!showAnswer && (
                                <motion.div className="flex gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <motion.button
                                        onClick={() => setShowAnswer(true)}
                                        className="flex-1 py-2.5 rounded-xl font-body text-[12px] font-medium"
                                        style={{
                                            background: style.bg,
                                            border: `1px solid ${style.border}`,
                                            color: style.color,
                                            boxShadow: `0 4px 16px ${style.glow}`,
                                        }}
                                        whileTap={{ scale: 0.97 }}
                                        whileHover={{ boxShadow: `0 6px 24px ${style.glow.replace('0.06', '0.14')}` }}
                                    >
                                        ✍️ Answer
                                    </motion.button>
                                    <motion.button
                                        onClick={handleDecline}
                                        className="px-4 py-2.5 rounded-xl font-body text-[12px]"
                                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}
                                        whileTap={{ scale: 0.95 }}
                                        title="Decline"
                                    >
                                        ❌
                                    </motion.button>
                                </motion.div>
                            )}
                        </>
                    )}
                </div>
            )}
        </motion.div>
    )
}
