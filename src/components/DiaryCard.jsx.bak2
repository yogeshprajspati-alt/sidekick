import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Reactions from './Reactions'
import Comments from './Comments'
import LinkPreview, { extractFirstUrl, renderTextWithLinks } from './LinkPreview'

function formatDiaryDate(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 6) return `${hours}h ago`

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return `${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`
}

function formatTime(dateStr) {
    const date = new Date(dateStr)
    let h = date.getHours()
    const m = String(date.getMinutes()).padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m} ${ampm}`
}

export default function DiaryCard({ entry, index, onEntryUpdated, onEntryDeleted, isArchived = false, onRestore }) {
    const { user, isAdmin } = useAuth()
    const isOwn = entry.user_id === user?.id
    const isLocked = entry.unlock_date && new Date(entry.unlock_date) > new Date()
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(entry.text)
    const [editMood, setEditMood] = useState(entry.mood)
    const [saving, setSaving] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const textRef = useRef(null)

    const MOODS = ['❤️', '😊', '😢', '🥰', '✨', '😡', '🌙', '🦋', '🫂', '☕']

    // Slight random rotation for organic feel
    const tilt = ((index % 5) - 2) * 0.3

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
                .update({ text: editText.trim(), mood: editMood })
                .eq('id', entry.id)

            if (error) throw error

            setIsEditing(false)
            setShowMenu(false)
            onEntryUpdated?.({ ...entry, text: editText.trim(), mood: editMood })
        } catch (err) {
            console.error('Failed to update entry:', err)
            alert('Could not save changes.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        const { error } = await supabase
            .from('entries')
            .delete()
            .eq('id', entry.id)
        if (error) console.error('Failed to delete entry:', error)
        setShowDeleteConfirm(false)
        setShowMenu(false)
        if (!error) onEntryDeleted?.(entry.id)
    }

    const handleCancel = () => {
        setEditText(entry.text)
        setEditMood(entry.mood)
        setIsEditing(false)
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30, rotateZ: tilt * 2 }}
            animate={{ opacity: 1, y: 0, rotateZ: tilt }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{
                duration: 0.6,
                delay: Math.min(index * 0.06, 0.5),
                ease: [0.22, 1, 0.36, 1],
            }}
            className="diary-page relative"
            style={{ transform: `rotate(${tilt}deg)` }}
        >
            {/* Spiral holes */}
            <div className="diary-page-holes">
                <div className="diary-hole" />
                <div className="diary-hole" />
                <div className="diary-hole" />
                <div className="diary-hole" />
            </div>

            {/* Mood sticker — with tape effect */}
            <div className="absolute top-2 right-3 z-10">
                <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2"
                    style={{
                        width: 28, height: 10,
                        background: 'rgba(255,255,200,0.35)',
                        borderRadius: 1,
                        transform: 'rotate(-3deg)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    }}
                />
                <span className="text-2xl block mt-1" style={{ transform: 'rotate(8deg)' }}>
                    {isEditing ? editMood : entry.mood}
                </span>
            </div>

            {/* Page corner fold */}
            <div
                className="absolute bottom-0 right-0 z-10"
                style={{
                    width: 20, height: 20,
                    background: 'linear-gradient(135deg, var(--paper-cream) 45%, #e8dbc8 50%, #ddd0bb 100%)',
                    borderTopLeftRadius: 4,
                    boxShadow: '-1px -1px 3px rgba(0,0,0,0.06)',
                }}
            />

            {/* 3-dot menu for own entries — hidden when archived */}
            {isOwn && !isEditing && !isArchived && (
                <div className="absolute top-2 right-12 z-20">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                        style={{
                            background: showMenu ? 'rgba(107,76,59,0.1)' : 'transparent',
                            color: '#8a6b4a',
                        }}
                    >
                        <span className="text-[14px] font-bold tracking-wider">⋯</span>
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-8 rounded-lg overflow-hidden z-30"
                                style={{
                                    background: 'rgba(45, 35, 30, 0.95)',
                                    border: '1px solid rgba(183,110,121,0.15)',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                                    minWidth: 120,
                                    backdropFilter: 'blur(20px)',
                                }}
                            >
                                <button
                                    onClick={() => { setIsEditing(true); setShowMenu(false) }}
                                    className="w-full px-3 py-2.5 text-left text-[12px] font-body flex items-center gap-2 transition-colors"
                                    style={{ color: '#e6b8c0' }}
                                    onMouseEnter={(e) => e.target.style.background = 'rgba(183,110,121,0.1)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => { setShowDeleteConfirm(true); setShowMenu(false) }}
                                    className="w-full px-3 py-2.5 text-left text-[12px] font-body flex items-center gap-2 transition-colors"
                                    style={{ color: '#ef9a9a' }}
                                    onMouseEnter={(e) => e.target.style.background = 'rgba(239,154,154,0.08)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                    🗑️ Delete
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Delete confirmation modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40"
                            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
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
                            <h3 className="font-handwriting text-[22px] mb-1" style={{ color: 'rgba(248,113,113,0.85)' }}>Delete this entry?</h3>
                            <p className="font-body text-[12px] mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>This cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl font-body text-[13px]"
                                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-2.5 rounded-xl font-body text-[13px] font-medium"
                                    style={{ background: 'rgba(239,68,68,0.15)', color: 'rgba(248,113,113,0.9)', border: '1px solid rgba(239,68,68,0.2)' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Click outside to close menu */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                />
            )}

            {/* Date + Time header */}
            <div className="relative z-10 mb-1 flex items-baseline justify-between pr-16">
                <span
                    className="font-handwriting text-[20px] font-bold"
                    style={{ color: '#6b4c3b', textShadow: '0 1px 0 rgba(255,255,255,0.3)' }}
                >
                    {formatDiaryDate(entry.created_at)}
                </span>
                <span className="text-[10px] font-body" style={{ color: 'rgba(100, 80, 60, 0.35)' }}>
                    {formatTime(entry.created_at)}
                </span>
            </div>

            {/* Category and Tags Display */}
            {(entry.category || (entry.tags && entry.tags.length > 0)) && !isEditing && (
                <div className="relative z-10 flex flex-wrap items-center gap-1.5 mb-2 mt-1">
                    {entry.category && (
                        <span className="text-[9px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-md"
                            style={{ background: 'rgba(183,110,121,0.1)', color: '#a05a65', border: '1px solid rgba(183,110,121,0.15)' }}>
                            {entry.category}
                        </span>
                    )}
                    {entry.tags?.map(tag => (
                        <span key={tag} className="text-[10px] text-[#8a6b4a] font-body flex items-center gap-0.5">
                            <span style={{ color: '#d4af37' }}>#</span>{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Decorative underline */}
            <div
                className="relative z-10 mb-3"
                style={{
                    height: 1,
                    background: 'linear-gradient(to right, rgba(107,76,59,0.2) 0%, rgba(107,76,59,0.05) 70%, transparent 100%)',
                }}
            />

            {/* Author tag + badges */}
            <div className="relative z-10 flex items-center gap-2 mb-2">
                <span
                    className="text-[10px] font-body uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                        color: isOwn ? '#b76e79' : '#7a6b4a',
                        background: isOwn ? 'rgba(183,110,121,0.1)' : 'rgba(122,107,74,0.1)',
                        border: `1px solid ${isOwn ? 'rgba(183,110,121,0.12)' : 'rgba(122,107,74,0.1)'}`,
                    }}
                >
                    {isOwn
                        ? '~ me'
                        : (isAdmin && entry.author?.full_name
                            ? `~ ${entry.author.full_name}`
                            : `~ ${entry.author_name || 'Anonymous'}`)
                    }
                </span>
                {entry.is_private && (
                    <span
                        className="text-[9px] font-body flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                            color: '#b76e79',
                            background: 'rgba(183,110,121,0.08)',
                            border: '1px solid rgba(183,110,121,0.1)',
                        }}
                    >
                        🔒 private
                    </span>
                )}
                {isAdmin && !isOwn && (
                    <span className="text-[10px]" title="Admin view">👑</span>
                )}
            </div>

            {/* Entry content — view or edit mode */}
            {isEditing ? (
                <div className="relative z-10">
                    {/* Mood picker for editing */}
                    <div className="flex items-center gap-1 mb-2 overflow-x-auto scrollbar-hide pb-1">
                        {MOODS.map((m) => (
                            <button
                                key={m}
                                onClick={() => setEditMood(m)}
                                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all"
                                style={{
                                    background: editMood === m
                                        ? 'rgba(183,110,121,0.15)'
                                        : 'rgba(107,76,59,0.05)',
                                    border: editMood === m
                                        ? '1px solid rgba(183,110,121,0.3)'
                                        : '1px solid transparent',
                                }}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    {/* Edit textarea */}
                    <textarea
                        ref={textRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        maxLength={2000}
                        rows={4}
                        className="w-full resize-none rounded-lg px-3 py-2 font-handwriting text-[20px]"
                        style={{
                            background: 'rgba(253,246,236,0.6)',
                            border: '1.5px solid rgba(183,110,121,0.25)',
                            color: '#3a2e2f',
                            lineHeight: '28px',
                            outline: 'none',
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
                            if (e.key === 'Escape') handleCancel()
                        }}
                    />

                    {/* Edit actions */}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px]" style={{ color: 'rgba(107,76,59,0.3)' }}>
                            {editText.length}/2000 · Ctrl+Enter to save
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                className="px-3 py-1.5 text-[11px] rounded-lg font-body transition-colors"
                                style={{ color: '#8a6b4a', background: 'rgba(107,76,59,0.06)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!editText.trim() || saving}
                                className="px-3 py-1.5 text-[11px] rounded-lg font-body font-medium text-white"
                                style={{
                                    background: 'linear-gradient(135deg, #b76e79, #a05a65)',
                                    opacity: !editText.trim() || saving ? 0.5 : 1,
                                }}
                            >
                                {saving ? 'Saving...' : '✓ Save'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : isLocked ? (
                /* Secret letter — locked state */
                <div className="relative z-10 text-center py-6">
                    <motion.div
                        className="text-4xl mb-2"
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        💌
                    </motion.div>
                    <p className="font-handwriting text-[18px]" style={{ color: '#b76e79' }}>
                        A secret letter awaits...
                    </p>
                    <p className="text-[11px] font-body mt-1" style={{ color: 'rgba(107,76,59,0.4)' }}>
                        Opens on {new Date(entry.unlock_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            ) : (
                <div className="relative z-10" onDoubleClick={() => isOwn && setIsEditing(true)}>
                    <p
                        className="font-handwriting text-[21px] sm:text-[23px] whitespace-pre-wrap break-words"
                        style={{ color: '#3a2e2f', lineHeight: '28px', textShadow: '0 0.5px 0 rgba(255,255,255,0.2)' }}
                    >
                        {renderTextWithLinks(entry.text, { color: 'rgba(99,102,241,0.85)', textDecorationColor: 'rgba(99,102,241,0.3)' })}
                    </p>
                    {extractFirstUrl(entry.text) && (
                        <LinkPreview url={extractFirstUrl(entry.text)} />
                    )}
                </div>
            )}

            {/* Reactions + Comments — only show if not locked and not archived */}
            {!isLocked && !isEditing && !isArchived && (
                <>
                    <Reactions entryId={entry.id} />
                    <Comments entryId={entry.id} />
                </>
            )}

            {/* Restore button — only in archive tab */}
            {isArchived && onRestore && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative z-10 mt-4 pt-3"
                    style={{ borderTop: '1px dashed rgba(107,76,59,0.15)' }}
                >
                    <button
                        onClick={onRestore}
                        className="w-full py-2 rounded-xl text-[12px] font-body font-medium flex items-center justify-center gap-2 transition-all"
                        style={{
                            background: 'rgba(183,110,121,0.08)',
                            border: '1px solid rgba(183,110,121,0.15)',
                            color: '#b76e79',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(183,110,121,0.14)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(183,110,121,0.08)'}
                    >
                        🔄 Restore to diary
                    </button>
                </motion.div>
            )}

            {/* Coffee stain watermark */}
            {index % 4 === 1 && (
                <div
                    className="absolute pointer-events-none z-[1]"
                    style={{
                        width: 45, height: 45,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(160,120,80,0.06) 30%, rgba(160,120,80,0.02) 60%, transparent 70%)',
                        bottom: 15, left: 50,
                    }}
                />
            )}

            {/* Torn edge */}
            <div className="diary-torn-edge" />
        </motion.div>
    )
}
