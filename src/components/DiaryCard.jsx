import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Reactions from './Reactions'
import Comments from './Comments'
import PollCard from './PollCard'
import MysteryCard from './MysteryCard'
import QuestionCard from './QuestionCard'
import VoiceCard from './VoiceCard'
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
    const [isRevealed, setIsRevealed] = useState(false) // for letter & gift cards

    const entryType = entry.entry_type || 'normal'
    const isLetter = entryType === 'letter'
    const isGift = entryType === 'gift'
    const isScroll = entryType === 'scroll'
    const isApology = entryType === 'apology'
    const isAppreciation = entryType === 'appreciation'
    const isCelebration = entryType === 'celebration'
    const isSpecial = isLetter || isGift || isScroll || isApology || isAppreciation || isCelebration

    const SPECIAL_HEADERS = {
        letter:        { emoji: '💌', text: 'A letter for you',      color: 'linear-gradient(135deg, #e6b8c0, #d4af37)' },
        gift:          { emoji: '🎀', text: 'A gift note for you',   color: 'linear-gradient(135deg, #d4af37, #e6b8c0)' },
        scroll:        { emoji: '📜', text: 'An ancient scroll',     color: 'linear-gradient(135deg, #c4956a, #d4af37)' },
        apology:       { emoji: '💐', text: 'A heartfelt apology',   color: 'linear-gradient(135deg, #ffb4c8, #e6b8c0)' },
        appreciation:  { emoji: '🌟', text: 'An appreciation note',  color: 'linear-gradient(135deg, #d4af37, #ffe066)' },
        celebration:   { emoji: '🎉', text: 'A celebration!',        color: 'linear-gradient(135deg, #c89eff, #e6b8c0)' },
    }

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

    const CONFETTI = ['🌸', '✨', '💛', '🎊', '💕', '⭐', '🌟', '💫']
    const STARS    = ['⭐', '🌟', '✨', '💫', '⭐', '🌟', '✨', '💫', '⭐', '🌟']
    const FLOWERS  = ['🌸', '🌷', '💐', '🌹', '🌺', '🌼', '🌸', '🌷', '💐', '🌹']
    const PARTY    = ['🎊', '🎉', '✨', '🎈', '💥', '🎊', '🎉', '✨', '🎈', '💥']

    // ── Sticky Note Card ──
    if (entryType === 'sticky') {
        const color = entry.note_color || '#f9e4b7'
        const textColor = '#3a2e1a'
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: (index % 3 - 1) * 2 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{ maxWidth: 320, margin: '0 auto', width: '100%' }}
            >
                <motion.div
                    whileHover={{ y: -4, rotate: 0, boxShadow: '0 16px 40px rgba(0,0,0,0.25)' }}
                    style={{
                        background: color,
                        borderRadius: '2px 18px 18px 2px',
                        padding: '20px 18px 24px',
                        position: 'relative',
                        boxShadow: '3px 4px 18px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.5)',
                        minHeight: 120,
                    }}
                >
                    {/* Tape top */}
                    <div style={{
                        position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                        width: 50, height: 16, borderRadius: 2,
                        background: 'rgba(255,255,200,0.55)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }} />
                    {/* Fold corner */}
                    <div style={{
                        position: 'absolute', bottom: 0, right: 0, width: 0, height: 0,
                        borderStyle: 'solid',
                        borderWidth: '0 0 22px 22px',
                        borderColor: `transparent transparent rgba(0,0,0,0.12) transparent`,
                    }} />
                    <p style={{ fontSize: 13, color: 'rgba(58,46,26,0.5)', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
                        🗒️ {formatDiaryDate(entry.created_at)}
                    </p>
                    <p style={{ fontSize: 15, color: textColor, fontFamily: 'var(--font-handwriting, cursive)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {entry.text}
                    </p>
                </motion.div>
            </motion.div>
        )
    }

    // ── Scroll Card ──
    if (entryType === 'scroll' && !isRevealed) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                onClick={() => setIsRevealed(true)}
                style={{ cursor: 'pointer', maxWidth: 420, margin: '0 auto', width: '100%' }}
            >
                <motion.div
                    whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(139,100,60,0.25)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        background: 'linear-gradient(180deg, #c4956a 0%, #d4a574 8%, #f5e6c8 15%, #fdf3dc 50%, #f5e6c8 85%, #d4a574 92%, #c4956a 100%)',
                        borderRadius: 12,
                        padding: '24px 28px',
                        position: 'relative',
                        boxShadow: '0 4px 20px rgba(100,70,30,0.20)',
                        textAlign: 'center',
                        border: '1px solid rgba(180,130,70,0.3)',
                    }}
                >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18, background: 'linear-gradient(180deg, #8b5e3c, #c4956a)', borderRadius: '12px 12px 0 0', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, background: 'linear-gradient(180deg, #c4956a, #8b5e3c)', borderRadius: '0 0 12px 12px', boxShadow: '0 -2px 6px rgba(0,0,0,0.2)' }} />
                    <div style={{ paddingTop: 12, paddingBottom: 12 }}>
                        <motion.span animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: 32, display: 'block', marginBottom: 10 }}>📜</motion.span>
                        <p style={{ fontFamily: 'var(--font-script)', fontSize: 18, color: '#5c3d1e', marginBottom: 4 }}>A scroll awaits you</p>
                        <p style={{ fontSize: 10, color: 'rgba(92,61,30,0.5)', fontFamily: 'var(--font-body)' }}>Tap to unroll ✨</p>
                    </div>
                </motion.div>
            </motion.div>
        )
    }

    // ── Apology Note Card ──
    if (entryType === 'apology' && !isRevealed) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                onClick={() => setIsRevealed(true)}
                style={{ cursor: 'pointer', maxWidth: 420, margin: '0 auto', width: '100%' }}
            >
                <motion.div
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ borderRadius: 18, background: 'linear-gradient(145deg, rgba(40,20,28,0.98), rgba(30,14,20,0.99))', border: '1px solid rgba(255,150,180,0.20)', boxShadow: '0 8px 32px rgba(255,100,150,0.10)', padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
                >
                    {FLOWERS.slice(0,5).map((f, i) => (
                        <motion.span key={i} animate={{ y: ['-10%', '110%'], x: [0, (i % 2 === 0 ? 10 : -10)], opacity: [0, 1, 0] }} transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.6, ease: 'linear' }} style={{ position: 'absolute', left: `${10 + i * 18}%`, top: 0, fontSize: 16, pointerEvents: 'none', opacity: 0 }}>{f}</motion.span>
                    ))}
                    <motion.span animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: 40, display: 'block', marginBottom: 12, position: 'relative', zIndex: 1 }}>💐</motion.span>
                    <p style={{ fontFamily: 'var(--font-script)', fontSize: 20, color: 'rgba(255,180,200,0.85)', marginBottom: 6, position: 'relative', zIndex: 1 }}>I'm sorry...</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,150,180,0.4)', fontFamily: 'var(--font-body)', position: 'relative', zIndex: 1 }}>Tap to read 🌸</p>
                </motion.div>
            </motion.div>
        )
    }

    // ── Appreciation Card ──
    if (entryType === 'appreciation' && !isRevealed) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                onClick={() => setIsRevealed(true)}
                style={{ cursor: 'pointer', maxWidth: 420, margin: '0 auto', width: '100%' }}
            >
                <motion.div
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ borderRadius: 18, background: 'linear-gradient(145deg, rgba(28,24,10,0.98), rgba(20,18,6,0.99))', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 8px 32px rgba(212,175,55,0.12)', padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
                >
                    {STARS.slice(0,5).map((s, i) => (
                        <motion.span key={i} animate={{ y: ['110%', '-10%'], opacity: [0, 1, 0] }} transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.5, ease: 'linear' }} style={{ position: 'absolute', left: `${8 + i * 19}%`, bottom: 0, fontSize: 14, pointerEvents: 'none', opacity: 0 }}>{s}</motion.span>
                    ))}
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 40, display: 'block', marginBottom: 12, position: 'relative', zIndex: 1 }}>🌟</motion.span>
                    <p style={{ fontFamily: 'var(--font-script)', fontSize: 20, color: 'rgba(212,175,55,0.85)', marginBottom: 6, position: 'relative', zIndex: 1 }}>You're amazing ✨</p>
                    <p style={{ fontSize: 10, color: 'rgba(212,175,55,0.4)', fontFamily: 'var(--font-body)', position: 'relative', zIndex: 1 }}>Tap to read 🌟</p>
                </motion.div>
            </motion.div>
        )
    }

    // ── Celebration Card ──
    if (entryType === 'celebration' && !isRevealed) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                onClick={() => setIsRevealed(true)}
                style={{ cursor: 'pointer', maxWidth: 420, margin: '0 auto', width: '100%' }}
            >
                <motion.div
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ borderRadius: 18, background: 'linear-gradient(145deg, rgba(20,10,35,0.98), rgba(15,8,28,0.99))', border: '1px solid rgba(150,100,255,0.25)', boxShadow: '0 8px 32px rgba(130,80,255,0.12)', padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
                >
                    {PARTY.slice(0,5).map((p, i) => (
                        <motion.span key={i} animate={{ y: ['-10%', '110%'], x: [(i % 2 === 0 ? -15 : 15), 0], opacity: [0, 1, 0] }} transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.45, ease: 'linear' }} style={{ position: 'absolute', left: `${5 + i * 20}%`, top: 0, fontSize: 16, pointerEvents: 'none', opacity: 0 }}>{p}</motion.span>
                    ))}
                    <motion.span animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: 40, display: 'block', marginBottom: 12, position: 'relative', zIndex: 1 }}>🎉</motion.span>
                    <p style={{ fontFamily: 'var(--font-script)', fontSize: 20, color: 'rgba(200,160,255,0.88)', marginBottom: 6, position: 'relative', zIndex: 1 }}>Let's celebrate! 🎊</p>
                    <p style={{ fontSize: 10, color: 'rgba(180,130,255,0.4)', fontFamily: 'var(--font-body)', position: 'relative', zIndex: 1 }}>Tap to see what! 🎈</p>
                </motion.div>
            </motion.div>
        )
    }

    // ── Sealed Letter Card ──
    if (isLetter && !isRevealed) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                onClick={() => setIsRevealed(true)}
                style={{
                    cursor: 'pointer',
                    margin: '0 auto',
                    maxWidth: 420,
                    width: '100%',
                }}
            >
                <motion.div
                    whileHover={{ y: -4, boxShadow: '0 20px 50px rgba(183,110,121,0.25)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        borderRadius: 18,
                        background: 'linear-gradient(145deg, rgba(40,28,32,0.97), rgba(26,18,20,0.99))',
                        border: '1px solid rgba(183,110,121,0.25)',
                        boxShadow: '0 8px 32px rgba(183,110,121,0.12)',
                        padding: '28px 24px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Envelope flap top */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: 60,
                        background: 'linear-gradient(135deg, rgba(183,110,121,0.12), rgba(212,175,55,0.08))',
                        borderBottom: '1px solid rgba(183,110,121,0.12)',
                        clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                    }} />

                    {/* Wax seal */}
                    <motion.div
                        animate={{ rotate: [0, 2, -2, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'radial-gradient(circle at 35% 35%, rgba(220,100,120,0.9), rgba(160,60,80,0.95))',
                            border: '2px solid rgba(255,180,180,0.3)',
                            boxShadow: '0 4px 16px rgba(183,110,121,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, margin: '16px auto 20px',
                            position: 'relative', zIndex: 1,
                        }}
                    >💌</motion.div>

                    {/* Sender info */}
                    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        <p style={{
                            fontFamily: 'var(--font-script)',
                            fontSize: 20,
                            background: 'linear-gradient(135deg, #e6b8c0, #d4af37)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: 6,
                        }}>A letter for you</p>
                        <p style={{ fontSize: 11, color: 'rgba(183,110,121,0.55)', fontFamily: 'var(--font-body)' }}>
                            {formatDiaryDate(entry.created_at)} · {formatTime(entry.created_at)}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(232,224,226,0.25)', fontFamily: 'var(--font-body)', marginTop: 16 }}>
                            Tap to break the seal 🕯️
                        </p>
                    </div>

                    {/* Subtle lines like envelope */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
                        background: 'linear-gradient(135deg, rgba(183,110,121,0.06), rgba(212,175,55,0.04))',
                        borderTop: '1px solid rgba(183,110,121,0.08)',
                    }} />
                </motion.div>
            </motion.div>
        )
    }

    // ── Gift Box Card ──
    if (isGift && !isRevealed) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                onClick={() => setIsRevealed(true)}
                style={{ cursor: 'pointer', margin: '0 auto', maxWidth: 420, width: '100%' }}
            >
                <motion.div
                    whileHover={{ y: -4, boxShadow: '0 20px 50px rgba(212,175,55,0.20)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        borderRadius: 18,
                        background: 'linear-gradient(145deg, rgba(36,28,18,0.97), rgba(24,18,10,0.99))',
                        border: '1px solid rgba(212,175,55,0.22)',
                        boxShadow: '0 8px 32px rgba(212,175,55,0.10)',
                        padding: '28px 24px',
                        position: 'relative',
                        overflow: 'hidden',
                        textAlign: 'center',
                    }}
                >
                    {/* Ribbon horizontal */}
                    <div style={{
                        position: 'absolute', top: 0, bottom: 0, left: '50%',
                        transform: 'translateX(-50%)',
                        width: 2,
                        background: 'linear-gradient(180deg, rgba(212,175,55,0.5), rgba(183,110,121,0.4))',
                    }} />
                    {/* Ribbon vertical */}
                    <div style={{
                        position: 'absolute', left: 0, right: 0, top: '42%',
                        height: 2,
                        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), rgba(183,110,121,0.4), transparent)',
                    }} />

                    {/* Bow */}
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ fontSize: 44, marginBottom: 12, position: 'relative', zIndex: 1 }}
                    >🎀</motion.div>

                    <p style={{
                        fontFamily: 'var(--font-script)',
                        fontSize: 20,
                        background: 'linear-gradient(135deg, #d4af37, #e6b8c0)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 6,
                        position: 'relative', zIndex: 1,
                    }}>A gift for you 🎁</p>

                    <p style={{ fontSize: 11, color: 'rgba(212,175,55,0.5)', fontFamily: 'var(--font-body)', position: 'relative', zIndex: 1 }}>
                        {formatDiaryDate(entry.created_at)} · {formatTime(entry.created_at)}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(232,224,226,0.22)', fontFamily: 'var(--font-body)', marginTop: 16, position: 'relative', zIndex: 1 }}>
                        Tap to unwrap ✨
                    </p>
                </motion.div>
            </motion.div>
        )
    }

    // ── Voice Card ──
    if (entryType === 'voice') {
        return <VoiceCard entry={entry} onEntryUpdated={onEntryUpdated} onEntryDeleted={onEntryDeleted} isArchived={isArchived} onRestore={onRestore} />
    }

    // ── Poll Card ──
    if (entryType === 'poll') {
        return <PollCard entry={entry} onEntryUpdated={onEntryUpdated} onEntryDeleted={onEntryDeleted} isArchived={isArchived} />
    }

    // ── Mystery Card ──
    if (entryType === 'mystery') {
        return <MysteryCard entry={entry} onEntryUpdated={onEntryUpdated} onEntryDeleted={onEntryDeleted} isArchived={isArchived} />
    }

    // ── Question Card ──
    if (entryType === 'question') {
        return <QuestionCard entry={entry} onEntryUpdated={onEntryUpdated} onEntryDeleted={onEntryDeleted} isArchived={isArchived} />
    }

    // ── Revealed Letter/Gift — show with special header ──
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
            {/* Special header for revealed cards */}
            {isSpecial && isRevealed && SPECIAL_HEADERS[entryType] && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    style={{
                        textAlign: 'center',
                        padding: '10px 0 14px',
                        marginBottom: 8,
                        borderBottom: `1px solid rgba(183,110,121,0.12)`,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Confetti for gift */}
                    {isGift && CONFETTI.map((emoji, i) => (
                        <motion.span
                            key={i}
                            initial={{ opacity: 1, y: 0, x: 0, scale: 0 }}
                            animate={{ opacity: 0, y: -60 - Math.random() * 40, x: (i % 2 === 0 ? 1 : -1) * (20 + i * 12), scale: 1, rotate: Math.random() * 360 }}
                            transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
                            style={{ position: 'absolute', top: '50%', left: '50%', fontSize: 14, pointerEvents: 'none', zIndex: 10 }}
                        >{emoji}</motion.span>
                    ))}
                    {/* Stars for appreciation */}
                    {isAppreciation && STARS.map((emoji, i) => (
                        <motion.span
                            key={i}
                            initial={{ opacity: 1, y: 0, x: 0, scale: 0 }}
                            animate={{ opacity: 0, y: -50 - i * 8, x: (i % 2 === 0 ? 1 : -1) * (15 + i * 10), scale: 1.2 }}
                            transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                            style={{ position: 'absolute', top: '50%', left: '50%', fontSize: 12, pointerEvents: 'none', zIndex: 10 }}
                        >{emoji}</motion.span>
                    ))}
                    {/* Party for celebration */}
                    {isCelebration && PARTY.map((emoji, i) => (
                        <motion.span
                            key={i}
                            initial={{ opacity: 1, y: 0, x: 0, scale: 0 }}
                            animate={{ opacity: 0, y: -55 - i * 7, x: (i % 2 === 0 ? 1 : -1) * (18 + i * 11), scale: 1, rotate: i * 36 }}
                            transition={{ duration: 0.75, delay: i * 0.055, ease: 'easeOut' }}
                            style={{ position: 'absolute', top: '50%', left: '50%', fontSize: 14, pointerEvents: 'none', zIndex: 10 }}
                        >{emoji}</motion.span>
                    ))}
                    <span style={{ fontSize: 22 }}>{SPECIAL_HEADERS[entryType].emoji}</span>
                    <p style={{
                        fontFamily: 'var(--font-script)',
                        fontSize: 16,
                        background: SPECIAL_HEADERS[entryType].color,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginTop: 4,
                    }}>
                        {SPECIAL_HEADERS[entryType].text}
                    </p>
                </motion.div>
            )}

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
