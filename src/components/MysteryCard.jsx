import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function MysteryCard({ entry, onEntryUpdated, onEntryDeleted, isArchived = false }) {
    const { user } = useAuth()
    const isOwn = entry.user_id === user?.id

    // Scratch state
    const [revealed, setRevealed] = useState(false)
    const [scratchProgress, setScratchProgress] = useState(0)
    const [hasStartedScratch, setHasStartedScratch] = useState(false)
    const canvasRef = useRef(null)
    const isDrawing = useRef(false)
    const lastPos = useRef(null)
    const animFrame = useRef(null)

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
            console.error('Failed to update mystery entry:', err)
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
        if (error) console.error('Failed to delete mystery entry:', error)
        setShowDeleteConfirm(false)
        setShowMenu(false)
        if (!error) onEntryDeleted?.(entry.id)
    }

    // ── Scratch card logic ──
    useEffect(() => {
        if (revealed) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')

        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        grad.addColorStop(0,   '#2a1a2e')
        grad.addColorStop(0.3, '#3d1f3a')
        grad.addColorStop(0.6, '#2a1a2e')
        grad.addColorStop(1,   '#1a0f1e')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Holographic shimmer stripes
        for (let i = 0; i < 8; i++) {
            const sg = ctx.createLinearGradient(i * 40, 0, i * 40 + 30, canvas.height)
            sg.addColorStop(0, 'rgba(200,158,255,0.0)')
            sg.addColorStop(0.5, 'rgba(200,158,255,0.07)')
            sg.addColorStop(1, 'rgba(200,158,255,0.0)')
            ctx.fillStyle = sg
            ctx.fillRect(i * 40, 0, 30, canvas.height)
        }

        // Checkerboard texture
        ctx.fillStyle = 'rgba(183,110,121,0.06)'
        for (let x = 0; x < canvas.width; x += 12) {
            for (let y = 0; y < canvas.height; y += 12) {
                if ((Math.floor(x / 12) + Math.floor(y / 12)) % 2 === 0) {
                    ctx.fillRect(x, y, 12, 12)
                }
            }
        }

        ctx.fillStyle = 'rgba(200,158,255,0.55)'
        ctx.font = 'bold 13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('🔮  Scratch to reveal ✨', canvas.width / 2, canvas.height / 2 - 10)
        ctx.fillStyle = 'rgba(183,110,121,0.38)'
        ctx.font = '10px sans-serif'
        ctx.fillText('Use your finger or mouse', canvas.width / 2, canvas.height / 2 + 10)
    }, [revealed])

    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        if (e.touches) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            }
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        }
    }

    const checkProgress = (canvas) => {
        const ctx = canvas.getContext('2d')
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let transparent = 0
        for (let i = 3; i < imgData.data.length; i += 4) {
            if (imgData.data[i] < 20) transparent++
        }
        const progress = transparent / (canvas.width * canvas.height)
        setScratchProgress(progress)
        if (progress > 0.55) setRevealed(true)
    }

    const scratch = (e) => {
        if (!isDrawing.current) return
        e.preventDefault()
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const pos = getPos(e, canvas)
        ctx.globalCompositeOperation = 'destination-out'
        ctx.beginPath()
        if (lastPos.current) {
            ctx.moveTo(lastPos.current.x, lastPos.current.y)
            ctx.lineTo(pos.x, pos.y)
            ctx.lineWidth = 44
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.stroke()
        }
        ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2)
        ctx.fill()
        lastPos.current = pos
        cancelAnimationFrame(animFrame.current)
        animFrame.current = requestAnimationFrame(() => checkProgress(canvas))
    }

    const startScratch = (e) => {
        isDrawing.current = true
        lastPos.current = null
        setHasStartedScratch(true)
        scratch(e)
    }

    const stopScratch = () => {
        isDrawing.current = false
        lastPos.current = null
    }

    const pct = Math.min(scratchProgress / 0.55 * 100, 100)

    return (
        <>
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
                            <h3 className="font-handwriting text-[22px] mb-1" style={{ color: 'rgba(248,113,113,0.85)' }}>Delete this mystery?</h3>
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
            {showMenu && (
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            )}

            <motion.div
                layout
                style={{
                    borderRadius: 18,
                    background: 'linear-gradient(145deg, rgba(18,12,22,0.98), rgba(12,8,16,0.99))',
                    border: '1px solid rgba(183,110,121,0.18)',
                    boxShadow: '0 8px 32px rgba(100,60,150,0.14)',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* Header */}
                <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(183,110,121,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <motion.span
                        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{ fontSize: 18 }}
                    >🔮</motion.span>
                    <span style={{
                        fontFamily: 'var(--font-script)',
                        fontSize: 17,
                        background: 'linear-gradient(135deg, #c89eff, #b76e79)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>Mystery Message</span>

                    {/* Progress / revealed chip */}
                    {hasStartedScratch && !revealed && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                fontSize: 9, color: 'rgba(200,158,255,0.6)', fontFamily: 'var(--font-body)',
                                background: 'rgba(200,158,255,0.08)', border: '1px solid rgba(200,158,255,0.15)',
                                borderRadius: 20, padding: '2px 8px',
                            }}
                        >{Math.round(pct)}% scratched</motion.span>
                    )}
                    {revealed && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                fontSize: 9, color: 'rgba(100,220,120,0.7)', fontFamily: 'var(--font-body)',
                                background: 'rgba(100,220,120,0.08)', border: '1px solid rgba(100,220,120,0.18)',
                                borderRadius: 20, padding: '2px 8px',
                            }}
                        >✨ Revealed</motion.span>
                    )}

                    {/* 3-dot menu */}
                    {isOwn && !isEditing && !isArchived && (
                        <div style={{ marginLeft: 'auto', position: 'relative', zIndex: 20 }}>
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
                                            minWidth: 120, zIndex: 30,
                                            backdropFilter: 'blur(20px)',
                                        }}
                                    >
                                        <button
                                            onClick={() => { setIsEditing(true); setShowMenu(false) }}
                                            className="w-full px-3 py-2.5 text-left text-[12px] font-body flex items-center gap-2 transition-colors"
                                            style={{ color: '#e6b8c0', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(183,110,121,0.1)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >✏️ Edit</button>
                                        <button
                                            onClick={() => { setShowDeleteConfirm(true); setShowMenu(false) }}
                                            className="w-full px-3 py-2.5 text-left text-[12px] font-body flex items-center gap-2 transition-colors"
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

                {/* Content */}
                <div style={{ position: 'relative', padding: '14px 18px 18px' }}>

                    {/* ── Edit mode ── */}
                    {isEditing ? (
                        <div>
                            <textarea
                                ref={textRef}
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                rows={4}
                                maxLength={2000}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    border: '1px solid rgba(200,158,255,0.25)',
                                    background: 'rgba(200,158,255,0.05)',
                                    color: 'rgba(232,224,226,0.9)',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                    resize: 'none',
                                    outline: 'none',
                                }}
                            />
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button
                                    onClick={() => { setEditText(entry.text); setIsEditing(false) }}
                                    style={{
                                        padding: '7px 14px', borderRadius: 10, fontSize: 12,
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
                                        fontFamily: 'var(--font-body)',
                                    }}
                                >Cancel</button>
                                <button
                                    onClick={handleSave}
                                    disabled={!editText.trim() || saving}
                                    style={{
                                        padding: '7px 14px', borderRadius: 10, fontSize: 12,
                                        background: 'linear-gradient(135deg, #b76e79, #c89eff)',
                                        border: 'none',
                                        color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                                        opacity: saving ? 0.6 : 1,
                                        fontFamily: 'var(--font-body)', fontWeight: 500,
                                    }}
                                >{saving ? 'Saving…' : '✓ Save'}</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Blurred text underneath scratch */}
                            <p style={{
                                fontSize: 15,
                                color: 'rgba(232,224,226,0.88)',
                                fontFamily: 'var(--font-body)',
                                lineHeight: 1.65,
                                filter: revealed ? 'none' : 'blur(9px)',
                                userSelect: revealed ? 'auto' : 'none',
                                transition: 'filter 0.5s ease',
                                minHeight: 64,
                                whiteSpace: 'pre-wrap',
                            }}>
                                {entry.text}
                            </p>

                            {/* Coin bounce hint */}
                            <AnimatePresence>
                                {!hasStartedScratch && !revealed && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                        style={{
                                            position: 'absolute', bottom: 22, right: 22,
                                            pointerEvents: 'none', zIndex: 20,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                        }}
                                    >
                                        <motion.span
                                            animate={{ y: [0, -6, 0], rotate: [0, -15, 0] }}
                                            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                                            style={{ fontSize: 22 }}
                                        >🪙</motion.span>
                                        <span style={{ fontSize: 8, color: 'rgba(200,158,255,0.5)', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>scratch</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Scratch canvas */}
                            <AnimatePresence>
                                {!revealed && (
                                    <motion.canvas
                                        ref={canvasRef}
                                        width={360}
                                        height={110}
                                        exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
                                        onMouseDown={startScratch}
                                        onMouseMove={scratch}
                                        onMouseUp={stopScratch}
                                        onMouseLeave={stopScratch}
                                        onTouchStart={startScratch}
                                        onTouchMove={scratch}
                                        onTouchEnd={stopScratch}
                                        style={{
                                            position: 'absolute',
                                            top: 14, left: 18,
                                            width: 'calc(100% - 36px)',
                                            height: 'calc(100% - 32px)',
                                            borderRadius: 10,
                                            cursor: 'crosshair',
                                            touchAction: 'none',
                                            boxShadow: '0 0 0 1px rgba(200,158,255,0.12)',
                                        }}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Progress bar */}
                            {hasStartedScratch && !revealed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ marginTop: 10, height: 3, borderRadius: 99, background: 'rgba(200,158,255,0.10)', overflow: 'hidden' }}
                                >
                                    <motion.div
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.1 }}
                                        style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #b76e79, #c89eff)' }}
                                    />
                                </motion.div>
                            )}

                            {/* Confetti burst on reveal */}
                            <AnimatePresence>
                                {revealed && (
                                    <motion.div
                                        initial={{ opacity: 1 }}
                                        animate={{ opacity: 0 }}
                                        transition={{ duration: 1.2, delay: 0.6 }}
                                        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 10 }}
                                    >
                                        {['✨','🌟','💜','🔮','✨','💫','🌟','💜'].map((emoji, i) => (
                                            <motion.span
                                                key={i}
                                                initial={{ opacity: 1, y: '60%', x: `${10 + i * 12}%`, scale: 0 }}
                                                animate={{ opacity: 0, y: '-20%', scale: 1.2, rotate: i * 45 }}
                                                transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeOut' }}
                                                style={{ position: 'absolute', fontSize: 16 }}
                                            >{emoji}</motion.span>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Revealed footer */}
                            {revealed && (
                                <motion.p
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{ fontSize: 10, color: 'rgba(200,158,255,0.45)', fontFamily: 'var(--font-body)', marginTop: 10, textAlign: 'center' }}
                                >
                                    🔮 Mystery revealed · {entry.mood}
                                </motion.p>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </>
    )
}
