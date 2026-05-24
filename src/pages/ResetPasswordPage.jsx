import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage({ onDone }) {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [status, setStatus] = useState('idle') // idle | loading | success | error | unauthorized
    const [errorMsg, setErrorMsg] = useState('')

    // Supabase puts the session in the URL hash after clicking the reset link.
    // We detect it here — if no valid token, show unauthorized.
    useEffect(() => {
        const hash = window.location.hash
        const hasToken = hash.includes('access_token') && hash.includes('type=recovery')
        if (!hasToken) {
            setStatus('unauthorized')
        }
    }, [])

    const handleSubmit = async () => {
        if (!password || password.length < 6) {
            setErrorMsg('Password must be at least 6 characters')
            return
        }
        if (password !== confirm) {
            setErrorMsg('Passwords do not match')
            return
        }

        setStatus('loading')
        setErrorMsg('')

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setErrorMsg(error.message)
            setStatus('idle')
        } else {
            setStatus('success')
            // Clear hash from URL
            window.history.replaceState(null, '', window.location.pathname)
            setTimeout(() => onDone?.(), 2200)
        }
    }

    // ── Unauthorized — no valid token ──
    if (status === 'unauthorized') {
        return (
            <div className="h-screen flex items-center justify-center bg-deep-dark px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-xs"
                >
                    <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
                    <h2 style={{
                        fontFamily: 'var(--font-script)',
                        fontSize: 26,
                        background: 'linear-gradient(135deg, #e6b8c0, #d4af37)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 10,
                    }}>Unauthorized</h2>
                    <p style={{ fontSize: 13, color: 'rgba(232,224,226,0.45)', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                        Password reset links are sent by the admin only.
                        Contact Deepu to request a reset.
                    </p>
                </motion.div>
            </div>
        )
    }

    // ── Success ──
    if (status === 'success') {
        return (
            <div className="h-screen flex items-center justify-center bg-deep-dark px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center max-w-xs"
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6 }}
                        style={{ fontSize: 44, marginBottom: 16 }}
                    >✨</motion.div>
                    <h2 style={{
                        fontFamily: 'var(--font-script)',
                        fontSize: 26,
                        background: 'linear-gradient(135deg, #e6b8c0, #d4af37)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 10,
                    }}>Password Updated!</h2>
                    <p style={{ fontSize: 13, color: 'rgba(232,224,226,0.45)', fontFamily: 'var(--font-body)' }}>
                        Logging you in...
                    </p>
                </motion.div>
            </div>
        )
    }

    // ── Reset form ──
    return (
        <div className="h-screen flex items-center justify-center bg-deep-dark px-6">
            {/* Ambient glow */}
            <div style={{
                position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)',
                width: 380, height: 380, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(183,110,121,0.07) 0%, transparent 70%)',
                filter: 'blur(40px)', pointerEvents: 'none',
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    width: '100%', maxWidth: 340,
                    background: 'linear-gradient(145deg, rgba(26,20,22,0.97), rgba(16,12,14,0.98))',
                    border: '1px solid rgba(183,110,121,0.18)',
                    borderRadius: 20,
                    padding: '32px 28px',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
                    position: 'relative', zIndex: 1,
                }}
            >
                {/* Icon */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 36 }}>🔑</span>
                    <h2 style={{
                        fontFamily: 'var(--font-script)',
                        fontSize: 26,
                        background: 'linear-gradient(135deg, #e6b8c0, #d4af37)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginTop: 8,
                    }}>New Password</h2>
                    <p style={{ fontSize: 11, color: 'rgba(232,224,226,0.35)', fontFamily: 'var(--font-body)', marginTop: 4 }}>
                        Choose something only you'd remember
                    </p>
                </div>

                {/* Password input */}
                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'rgba(183,110,121,0.7)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>
                        New Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="glass-input w-full"
                        style={{
                            padding: '11px 14px', borderRadius: 11, fontSize: 13,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(183,110,121,0.18)',
                            color: '#e8e0e2', fontFamily: 'var(--font-body)', width: '100%',
                            outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(183,110,121,0.45)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(183,110,121,0.18)'}
                    />
                </div>

                {/* Confirm input */}
                <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 11, color: 'rgba(183,110,121,0.7)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="Same as above"
                        className="glass-input w-full"
                        style={{
                            padding: '11px 14px', borderRadius: 11, fontSize: 13,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(183,110,121,0.18)',
                            color: '#e8e0e2', fontFamily: 'var(--font-body)', width: '100%',
                            outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(183,110,121,0.45)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(183,110,121,0.18)'}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                </div>

                {/* Error */}
                {errorMsg && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: 11, color: 'rgba(220,80,80,0.85)', fontFamily: 'var(--font-body)', marginBottom: 12, textAlign: 'center' }}
                    >
                        {errorMsg}
                    </motion.p>
                )}

                {/* Submit */}
                <motion.button
                    onClick={handleSubmit}
                    disabled={status === 'loading'}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        width: '100%', padding: '12px',
                        borderRadius: 12, fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600,
                        background: 'linear-gradient(135deg, rgba(183,110,121,0.85), rgba(212,175,55,0.70))',
                        border: '1px solid rgba(183,110,121,0.3)',
                        color: 'rgba(255,248,240,0.95)',
                        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                        opacity: status === 'loading' ? 0.7 : 1,
                        boxShadow: '0 4px 16px rgba(183,110,121,0.25)',
                    }}
                >
                    {status === 'loading' ? 'Updating...' : 'Update Password'}
                </motion.button>
            </motion.div>
        </div>
    )
}
