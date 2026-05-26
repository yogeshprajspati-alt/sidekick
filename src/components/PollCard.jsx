import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function PollCard({ entry, onEntryUpdated, onEntryDeleted, isArchived = false }) {
    const { user } = useAuth()
    const isOwn = entry.user_id === user?.id

    const [votes, setVotes] = useState(entry.poll_votes || {})
    const [voting, setVoting] = useState(false)

    // Edit / delete state
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(entry.text)
    const [saving, setSaving] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const textRef = useRef(null)

    const options = entry.poll_options || []
    const myVote = Object.entries(votes).find(([, uid]) => uid === user?.id)?.[0] ?? null
    const totalVotes = Object.keys(votes).length

    useEffect(() => {
        if (isEditing && textRef.current) {
            textRef.current.focus()
            textRef.current.selectionStart = textRef.current.value.length
        }
    }, [isEditing])

    // Realtime vote updates
    useEffect(() => {
        const channel = supabase
            .channel(`poll-${entry.id}`)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'entries',
                filter: `id=eq.${entry.id}`,
            }, (payload) => {
                setVotes(payload.new.poll_votes || {})
            })
            .subscribe()
        return () => supabase.removeChannel(channel)
    }, [entry.id])

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
            console.error('Failed to update poll:', err)
            alert('Could not save changes.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        const { error } = await supabase.from('entries').delete().eq('id', entry.id)
        if (error) console.error('Failed to delete poll:', error)
        setShowDeleteConfirm(false)
        setShowMenu(false)
        if (!error) onEntryDeleted?.(entry.id)
    }

    const handleVote = async (option) => {
        if (voting) return
        const newVotes = { ...votes }
        if (myVote === option) {
            Object.keys(newVotes).forEach(k => { if (newVotes[k] === user.id) delete newVotes[k] })
        } else {
            Object.keys(newVotes).forEach(k => { if (newVotes[k] === user.id) delete newVotes[k] })
            newVotes[option] = user.id
        }
        setVoting(true)
        setVotes(newVotes)
        const { error } = await supabase.from('entries').update({ poll_votes: newVotes }).eq('id', entry.id)
        if (error) console.error(error)
        setVoting(false)
        onEntryUpdated?.({ ...entry, poll_votes: newVotes })
    }

    const getOptionVotes = (option) => Object.entries(votes).filter(([k]) => k === option).length
    const getPercent = (option) => totalVotes === 0 ? 0 : Math.round((getOptionVotes(option) / totalVotes) * 100)
    const hasVotes = totalVotes > 0

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
                            <h3 className="font-handwriting text-[22px] mb-1" style={{ color: 'rgba(248,113,113,0.85)' }}>Delete this poll?</h3>
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
                    background: 'linear-gradient(145deg, rgba(20,14,28,0.98), rgba(14,10,20,0.99))',
                    border: '1px solid rgba(150,100,255,0.20)',
                    boxShadow: '0 8px 32px rgba(120,80,255,0.10)',
                    padding: '20px 18px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🗳️</span>
                    <span style={{
                        fontFamily: 'var(--font-script)', fontSize: 17,
                        background: 'linear-gradient(135deg, #c89eff, #e6b8c0)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Poll</span>

                    {/* 3-dot menu — owner only, not archived */}
                    {isOwn && !isEditing && !isArchived && (
                        <div style={{ marginLeft: 'auto', position: 'relative', zIndex: 20 }}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: showMenu ? 'rgba(150,100,255,0.12)' : 'transparent',
                                    border: 'none', cursor: 'pointer',
                                    color: 'rgba(150,100,255,0.6)',
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
                                            border: '1px solid rgba(150,100,255,0.15)',
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
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(150,100,255,0.08)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >✏️ Edit question</button>
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

                {/* Poll question — editable or display */}
                {isEditing ? (
                    <div style={{ marginBottom: 14 }}>
                        <textarea
                            ref={textRef}
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={2}
                            maxLength={500}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: 11,
                                border: '1px solid rgba(150,100,255,0.28)',
                                background: 'rgba(150,100,255,0.05)',
                                color: 'rgba(232,224,226,0.9)',
                                fontFamily: 'var(--font-body)', fontSize: 14,
                                lineHeight: 1.5, resize: 'none', outline: 'none',
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
                                    background: 'linear-gradient(135deg, #9664ff, #c89eff)',
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
                        marginBottom: 14, lineHeight: 1.5,
                    }}>
                        {entry.text}
                    </p>
                )}

                {/* Poll options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {options.map((option, i) => {
                        const isMyVote = myVote === option
                        const percent = getPercent(option)
                        const optionVotes = getOptionVotes(option)

                        return (
                            <motion.button
                                key={i}
                                onClick={() => handleVote(option)}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    position: 'relative', borderRadius: 11,
                                    border: isMyVote ? '1.5px solid rgba(150,100,255,0.55)' : '1px solid rgba(150,100,255,0.15)',
                                    background: 'rgba(150,100,255,0.05)',
                                    padding: '10px 12px', cursor: 'pointer',
                                    overflow: 'hidden', textAlign: 'left',
                                }}
                            >
                                {/* Vote bar fill */}
                                {hasVotes && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percent}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                        style={{
                                            position: 'absolute', top: 0, left: 0, bottom: 0,
                                            background: isMyVote
                                                ? 'linear-gradient(90deg, rgba(150,100,255,0.22), rgba(183,110,121,0.12))'
                                                : 'rgba(150,100,255,0.08)',
                                            borderRadius: 11, pointerEvents: 'none',
                                        }}
                                    />
                                )}
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {isMyVote && (
                                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 12 }}>✓</motion.span>
                                        )}
                                        <span style={{ fontSize: 13, color: isMyVote ? 'rgba(200,158,255,0.95)' : 'rgba(232,224,226,0.75)', fontFamily: 'var(--font-body)' }}>
                                            {option}
                                        </span>
                                    </div>
                                    {hasVotes && (
                                        <span style={{ fontSize: 11, color: 'rgba(150,100,255,0.65)', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
                                            {percent}% · {optionVotes}
                                        </span>
                                    )}
                                </div>
                            </motion.button>
                        )
                    })}
                </div>

                {/* Footer */}
                <p style={{ fontSize: 10, color: 'rgba(150,100,255,0.40)', fontFamily: 'var(--font-body)', marginTop: 10, textAlign: 'right' }}>
                    {totalVotes === 0 ? 'No votes yet' : `${totalVotes} vote${totalVotes !== 1 ? 's' : ''}`}
                    {myVote ? ' · Tap to change' : ' · Tap to vote'}
                </p>
            </motion.div>
        </>
    )
}
