import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function QuestionCard({ entry, onEntryUpdated, onEntryDeleted, isArchived = false }) {
    const { user } = useAuth()
    const isAuthor = entry.user_id === user?.id
    const hasAnswer = !!entry.question_answer
    const canAnswer = !isAuthor && !hasAnswer

    // Answer state
    const [answerText, setAnswerText] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [revealed, setRevealed] = useState(false)

    // Edit / delete state
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(entry.text)
    const [saving, setSaving] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const textRef = useRef(null)

    useEffect(() => {
        if (isEditing && textRef.current) {
            textRef.current.focus()
            textRef.current.selectionStart = textRef.current.value.length
        }
    }, [isEditing])

    const handleSave = async () => {
        if (!editText.trim() || saving) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('entries')
                .update({ text: editText.trim() })
                .eq('id', entry.id)
            if (error) throw error
            setIsEditing(false)
            setShowMenu(false)
            onEntryUpdated?.({ ...entry, text: editText.trim() })
        } catch (err) {
            console.error('Failed to update question:', err)
            alert('Could not save changes.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        const { error } = await supabase.from('entries').delete().eq('id', entry.id)
        if (error) console.error('Failed to delete question:', error)
        setShowDeleteConfirm(false)
        setShowMenu(false)
        if (!error) onEntryDeleted?.(entry.id)
    }

    const handleAnswer = async () => {
        if (!answerText.trim() || submitting) return
        setSubmitting(true)
        const { error } = await supabase
            .from('entries')
            .update({ question_answer: answerText.trim(), question_answered_by: user.id })
            .eq('id', entry.id)
        if (!error) {
            onEntryUpdated?.({ ...entry, question_answer: answerText.trim(), question_answered_by: user.id })
        }
        setSubmitting(false)
    }

    return (
        <>
            {/* Delete confirmation modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40"
                            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteConfirm(false)}
                        />
                        <motion.div
                            className="fixed inset-x-6 bottom-8 z-50 rounded-2xl p-5 text-center"
                            style={{
                                background: 'linear-gradient(135deg, rgba(20,15,18,0.99), rgba(12,9,11,0.99))',
                                border: '1px solid rgba(239,68,68,0.18)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            }}
                            initial={{ opacity: 0, y: 24, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        >
                            <p className="text-3xl mb-2">🗑️</p>
                            <h3 className="font-handwriting text-[22px] mb-1" style={{ color: 'rgba(248,113,113,0.85)' }}>Delete this question?</h3>
                            <p className="font-body text-[12px] mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>This cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl font-body text-[13px]"
                                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
                                >Cancel</button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-2.5 rounded-xl font-body text-[13px] font-medium"
                                    style={{ background: 'rgba(239,68,68,0.15)', color: 'rgba(248,113,113,0.9)', border: '1px solid rgba(239,68,68,0.2)' }}
                                >Delete</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Click-outside to close menu */}
            {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />}

            <motion.div
                layout
                style={{
                    borderRadius: 18,
                    background: 'linear-gradient(145deg, rgba(14,20,28,0.98), rgba(10,14,20,0.99))',
                    border: '1px solid rgba(100,160,255,0.18)',
                    boxShadow: '0 8px 32px rgba(80,130,255,0.08)',
                    padding: '18px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>❓</span>
                    <span style={{
                        fontFamily: 'var(--font-script)', fontSize: 17,
                        background: 'linear-gradient(135deg, #a0d0ff, #e6b8c0)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Question for you</span>

                    {/* 3-dot menu — author only, not archived */}
                    {isAuthor && !isEditing && !isArchived && (
                        <div style={{ marginLeft: 'auto', position: 'relative', zIndex: 20 }}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: showMenu ? 'rgba(100,160,255,0.12)' : 'transparent',
                                    border: 'none', cursor: 'pointer',
                                    color: 'rgba(100,160,255,0.6)',
                                    fontSize: 16, fontWeight: 'bold', letterSpacing: 2,
                                }}
                            >⋯</button>

                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                        transition={{ duration: 0.15 }}
                                        style={{
                                            position: 'absolute', right: 0, top: 32,
                                            background: 'rgba(45,35,30,0.97)',
                                            border: '1px solid rgba(100,160,255,0.15)',
                                            boxShadow: '0 8px 25px rgba(0,0,0,0.35)',
                                            borderRadius: 12, overflow: 'hidden',
                                            minWidth: 120, zIndex: 30,
                                            backdropFilter: 'blur(20px)',
                                        }}
                                    >
                                        <button
                                            onClick={() => { setIsEditing(true); setShowMenu(false) }}
                                            className="w-full px-3 py-2.5 text-left text-[12px] font-body flex items-center gap-2"
                                            style={{ color: '#e6b8c0', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(100,160,255,0.08)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >✏️ Edit</button>
                                        <button
                                            onClick={() => { setShowDeleteConfirm(true); setShowMenu(false) }}
                                            className="w-full px-3 py-2.5 text-left text-[12px] font-body flex items-center gap-2"
                                            style={{ color: '#ef9a9a', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,154,154,0.08)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >🗑️ Delete</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Question text — editable or display */}
                {isEditing ? (
                    <div style={{ marginBottom: 8 }}>
                        <textarea
                            ref={textRef}
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={3}
                            maxLength={1000}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: 11,
                                border: '1px solid rgba(100,160,255,0.28)',
                                background: 'rgba(100,160,255,0.05)',
                                color: 'rgba(232,224,226,0.9)',
                                fontFamily: 'var(--font-body)', fontSize: 14,
                                lineHeight: 1.55, resize: 'none', outline: 'none',
                                boxSizing: 'border-box', marginBottom: 8,
                            }}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setEditText(entry.text); setIsEditing(false) }}
                                style={{
                                    padding: '7px 14px', borderRadius: 10, fontSize: 12,
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                    color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                                }}
                            >Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={!editText.trim() || saving}
                                style={{
                                    padding: '7px 14px', borderRadius: 10, fontSize: 12,
                                    background: 'linear-gradient(135deg, #64a0ff, #a0d0ff)',
                                    border: 'none', color: '#fff',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.6 : 1,
                                    fontFamily: 'var(--font-body)', fontWeight: 500,
                                }}
                            >{saving ? 'Saving…' : '✓ Save'}</button>
                        </div>
                    </div>
                ) : (
                    <p style={{
                        fontSize: 15, color: 'rgba(232,224,226,0.88)',
                        fontFamily: 'var(--font-body)', fontWeight: 500,
                        lineHeight: 1.55, marginBottom: 16,
                    }}>
                        {entry.text}
                    </p>
                )}

                {/* Answer states */}
                {!isEditing && (
                    <AnimatePresence mode="wait">
                        {/* Author — waiting */}
                        {isAuthor && !hasAnswer && (
                            <motion.div
                                key="waiting"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    padding: '10px 12px', borderRadius: 11,
                                    background: 'rgba(100,160,255,0.06)',
                                    border: '1px dashed rgba(100,160,255,0.18)',
                                    textAlign: 'center',
                                }}
                            >
                                <motion.span
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    style={{ fontSize: 18, display: 'block', marginBottom: 6 }}
                                >⏳</motion.span>
                                <p style={{ fontSize: 12, color: 'rgba(100,160,255,0.55)', fontFamily: 'var(--font-body)' }}>
                                    Waiting for answer...
                                </p>
                            </motion.div>
                        )}

                        {/* Partner — answer input */}
                        {canAnswer && (
                            <motion.div
                                key="answer-input"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            >
                                <textarea
                                    value={answerText}
                                    onChange={e => setAnswerText(e.target.value)}
                                    placeholder="Write your answer..."
                                    rows={3}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 11,
                                        border: '1px solid rgba(100,160,255,0.20)',
                                        background: 'rgba(100,160,255,0.04)',
                                        color: 'rgba(232,224,226,0.88)',
                                        fontFamily: 'var(--font-body)', fontSize: 13,
                                        resize: 'none', outline: 'none',
                                        marginBottom: 10, boxSizing: 'border-box', lineHeight: 1.5,
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(100,160,255,0.45)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(100,160,255,0.20)'}
                                />
                                <motion.button
                                    onClick={handleAnswer}
                                    disabled={!answerText.trim() || submitting}
                                    whileHover={{ scale: answerText.trim() ? 1.02 : 1 }}
                                    whileTap={{ scale: 0.97 }}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: 11,
                                        background: answerText.trim()
                                            ? 'linear-gradient(135deg, rgba(100,160,255,0.3), rgba(183,110,121,0.2))'
                                            : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${answerText.trim() ? 'rgba(100,160,255,0.35)' : 'rgba(255,255,255,0.06)'}`,
                                        color: answerText.trim() ? 'rgba(160,208,255,0.95)' : 'rgba(255,255,255,0.25)',
                                        fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500,
                                        cursor: answerText.trim() ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {submitting ? 'Sending...' : 'Send Answer 💌'}
                                </motion.button>
                            </motion.div>
                        )}

                        {/* Has answer */}
                        {hasAnswer && (
                            <motion.div key="answered" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                {!revealed ? (
                                    <motion.button
                                        onClick={() => setRevealed(true)}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: 11,
                                            background: 'linear-gradient(135deg, rgba(100,160,255,0.15), rgba(183,110,121,0.10))',
                                            border: '1px solid rgba(100,160,255,0.25)',
                                            cursor: 'pointer', textAlign: 'center',
                                        }}
                                    >
                                        <motion.span
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            style={{ fontSize: 20, display: 'block', marginBottom: 4 }}
                                        >💌</motion.span>
                                        <p style={{ fontSize: 12, color: 'rgba(160,208,255,0.7)', fontFamily: 'var(--font-body)' }}>
                                            Answer received! Tap to reveal
                                        </p>
                                    </motion.button>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                        style={{
                                            padding: '12px 14px', borderRadius: 11,
                                            background: 'rgba(100,160,255,0.06)',
                                            border: '1px solid rgba(100,160,255,0.18)',
                                        }}
                                    >
                                        <p style={{ fontSize: 10, color: 'rgba(100,160,255,0.5)', fontFamily: 'var(--font-body)', marginBottom: 6 }}>✨ Answer</p>
                                        <p style={{ fontSize: 14, color: 'rgba(232,224,226,0.88)', fontFamily: 'var(--font-body)', lineHeight: 1.55 }}>
                                            {entry.question_answer}
                                        </p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </motion.div>
        </>
    )
}
