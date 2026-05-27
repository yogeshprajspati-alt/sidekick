import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const formatTime = (s) => {
    if (!s) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VoiceCard({ entry, onEntryUpdated, onEntryDeleted, isArchived = false, onRestore }) {
    const { user } = useAuth()
    const isOwn = entry.user_id === user?.id

    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(entry.voice_duration || 0)
    const audioRef = useRef(null)

    // Edit / delete state
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(entry.text || '')
    const [saving, setSaving] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const textRef = useRef(null)

    // Fake waveform bars from voice_duration seed
    const bars = Array.from({ length: 40 }, (_, i) => {
        const seed = (i * 7 + (entry.id?.charCodeAt(0) || 1) * 3) % 100
        return 8 + (seed % 32)
    })

    useEffect(() => {
        if (isEditing && textRef.current) {
            textRef.current.focus()
            textRef.current.selectionStart = textRef.current.value.length
        }
    }, [isEditing])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime)
            setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
        }
        const onLoadedMetadata = () => setDuration(audio.duration)
        const onEnded = () => { setPlaying(false); setProgress(0); setCurrentTime(0) }

        audio.addEventListener('timeupdate', onTimeUpdate)
        audio.addEventListener('loadedmetadata', onLoadedMetadata)
        audio.addEventListener('ended', onEnded)
        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate)
            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
            audio.removeEventListener('ended', onEnded)
        }
    }, [])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return
        if (playing) {
            audio.pause()
            setPlaying(false)
        } else {
            audio.play()
            setPlaying(true)
        }
    }

    const handleSeek = (e) => {
        const audio = audioRef.current
        if (!audio || !audio.duration) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        audio.currentTime = x * audio.duration
        setProgress(x)
    }

    const handleSave = async () => {
        if (saving) return
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
            console.error('Failed to update voice note:', err)
            alert('Could not save changes.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        const { error } = await supabase.from('entries').delete().eq('id', entry.id)
        if (error) console.error('Failed to delete voice note:', error)
        setShowDeleteConfirm(false)
        setShowMenu(false)
        if (!error) onEntryDeleted?.(entry.id)
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
                            <h3 className="font-handwriting text-[22px] mb-1" style={{ color: 'rgba(248,113,113,0.85)' }}>Delete this voice note?</h3>
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
                    background: 'linear-gradient(145deg, rgba(18,14,24,0.98), rgba(12,10,18,0.99))',
                    border: '1px solid rgba(183,110,121,0.18)',
                    boxShadow: '0 8px 32px rgba(183,110,121,0.08)',
                    padding: '18px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Hidden audio element */}
                <audio ref={audioRef} src={entry.voice_url} preload="metadata" />

                {/* Ambient glow when playing */}
                {playing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'radial-gradient(circle at 30% 50%, rgba(183,110,121,0.06) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }}
                    />
                )}

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 18 }}>🎙️</span>
                    <span style={{
                        fontFamily: 'var(--font-script)',
                        fontSize: 17,
                        background: 'linear-gradient(135deg, #e6b8c0, #d4af37)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>Voice Note</span>
                    <span style={{ fontSize: 11, color: 'rgba(183,110,121,0.45)', fontFamily: 'var(--font-body)', marginLeft: 'auto' }}>
                        {formatTime(duration)}
                    </span>

                    {/* 3-dot menu — owner only, not archived */}
                    {isOwn && !isEditing && !isArchived && (
                        <div style={{ position: 'relative', zIndex: 20, marginLeft: 8 }}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: showMenu ? 'rgba(183,110,121,0.12)' : 'transparent',
                                    border: 'none', cursor: 'pointer',
                                    color: 'rgba(183,110,121,0.6)',
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
                                            border: '1px solid rgba(183,110,121,0.15)',
                                            boxShadow: '0 8px 25px rgba(0,0,0,0.35)',
                                            borderRadius: 12, overflow: 'hidden',
                                            minWidth: 130, zIndex: 30,
                                            backdropFilter: 'blur(20px)',
                                        }}
                                    >
                                        <button
                                            onClick={() => { setIsEditing(true); setShowMenu(false) }}
                                            className="w-full px-3 py-2.5 text-left text-[12px] font-body flex items-center gap-2"
                                            style={{ color: '#e6b8c0', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(183,110,121,0.1)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >✏️ Edit caption</button>
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

                {/* Caption — editable or display */}
                {isEditing ? (
                    <div style={{ marginBottom: 14 }}>
                        <textarea
                            ref={textRef}
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            placeholder="Add a caption…"
                            rows={2}
                            maxLength={500}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
                                if (e.key === 'Escape') { setEditText(entry.text || ''); setIsEditing(false) }
                            }}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: 11,
                                border: '1px solid rgba(183,110,121,0.28)',
                                background: 'rgba(183,110,121,0.05)',
                                color: 'rgba(232,224,226,0.9)',
                                fontFamily: 'var(--font-body)', fontSize: 14,
                                lineHeight: 1.5, resize: 'none', outline: 'none',
                                boxSizing: 'border-box', marginBottom: 8,
                            }}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setEditText(entry.text || ''); setIsEditing(false) }}
                                style={{
                                    padding: '7px 14px', borderRadius: 10, fontSize: 12,
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                    color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                                }}
                            >Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    padding: '7px 14px', borderRadius: 10, fontSize: 12,
                                    background: 'linear-gradient(135deg, #b76e79, #d4af37)',
                                    border: 'none', color: '#fff',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.6 : 1,
                                    fontFamily: 'var(--font-body)', fontWeight: 500,
                                }}
                            >{saving ? 'Saving…' : '✓ Save'}</button>
                        </div>
                    </div>
                ) : entry.text ? (
                    <p style={{
                        fontSize: 13, color: 'rgba(232,224,226,0.65)',
                        fontFamily: 'var(--font-body)', marginBottom: 14,
                        fontStyle: 'italic', lineHeight: 1.5,
                    }}>
                        "{entry.text}"
                    </p>
                ) : null}

                {/* Player row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Play/Pause button */}
                    <motion.button
                        onClick={togglePlay}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.88 }}
                        style={{
                            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                            background: playing
                                ? 'linear-gradient(135deg, rgba(183,110,121,0.9), rgba(212,175,55,0.7))'
                                : 'linear-gradient(135deg, rgba(183,110,121,0.3), rgba(212,175,55,0.2))',
                            border: '1px solid rgba(183,110,121,0.35)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18,
                            boxShadow: playing ? '0 0 16px rgba(183,110,121,0.35)' : 'none',
                            transition: 'background 0.2s, box-shadow 0.2s',
                        }}
                    >
                        <motion.span
                            key={playing ? 'pause' : 'play'}
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.15 }}
                        >
                            {playing ? '⏸' : '▶️'}
                        </motion.span>
                    </motion.button>

                    {/* Waveform + progress */}
                    <div style={{ flex: 1 }}>
                        {/* Waveform bars — clickable seek */}
                        <div
                            onClick={handleSeek}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 2,
                                height: 40, cursor: 'pointer', marginBottom: 4,
                            }}
                        >
                            {bars.map((h, i) => {
                                const barProgress = i / bars.length
                                const isPast = barProgress < progress
                                const isActive = playing && Math.abs(barProgress - progress) < 0.04

                                return (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            height: isActive ? h * 1.3 : h,
                                            scaleY: isActive ? 1.1 : 1,
                                        }}
                                        transition={{ duration: 0.1 }}
                                        style={{
                                            flex: 1, borderRadius: 2,
                                            background: isPast
                                                ? 'linear-gradient(180deg, rgba(183,110,121,0.85), rgba(212,175,55,0.6))'
                                                : 'rgba(255,255,255,0.10)',
                                            minHeight: 4,
                                            transition: 'background 0.1s',
                                        }}
                                    />
                                )
                            })}
                        </div>

                        {/* Time */}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10, color: 'rgba(183,110,121,0.5)', fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums' }}>
                                {formatTime(currentTime)}
                            </span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.20)', fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums' }}>
                                {formatTime(duration)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Restore button — only in archive tab */}
                {isArchived && onRestore && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed rgba(183,110,121,0.15)' }}
                    >
                        <button
                            onClick={onRestore}
                            style={{
                                width: '100%', padding: '8px 0', borderRadius: 12,
                                background: 'rgba(183,110,121,0.08)',
                                border: '1px solid rgba(183,110,121,0.15)',
                                color: '#b76e79', cursor: 'pointer',
                                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(183,110,121,0.14)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(183,110,121,0.08)'}
                        >
                            🔄 Restore to diary
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </>
    )
}
