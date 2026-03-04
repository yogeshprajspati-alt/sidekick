import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useDecoyMode, DECOY_PASSWORD } from '../context/DecoyModeContext'
import FloatingPetals from '../components/FloatingPetals'

export default function LoginPage() {
    const { signIn, signUp } = useAuth()
    const { enterDecoyMode } = useDecoyMode()
    const [isSignUp, setIsSignUp] = useState(false)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            // Decoy mode: intercept before any Supabase call
            if (!isSignUp && password === DECOY_PASSWORD) {
                enterDecoyMode()
                return
            }

            // Quick offline check
            if (!navigator.onLine) {
                setError('📡 Internet nahi chal raha! Wi-Fi ya mobile data check karo aur phir try karo.')
                setLoading(false)
                return
            }

            if (isSignUp) {
                if (!name.trim()) {
                    setError('Please enter your name')
                    setLoading(false)
                    return
                }
                if (password.length < 6) {
                    setError('Password kam se kam 6 characters ka hona chahiye 🔑')
                    setLoading(false)
                    return
                }
                await signUp(email, password, name.trim())
                setSuccess('Account ban gaya! Ab login kar sakte ho ✨')
            } else {
                await signIn(email, password)
            }
        } catch (err) {
            console.error('Auth error:', err)
            const msg = (err.message || '').toLowerCase()

            // Categorize error for user-friendly messages
            if (msg.includes('timed out')) {
                setError('⏳ Request bohot slow hai! Internet speed check karo. Wi-Fi aur mobile data switch karke try karo.')
            } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('socket') || msg.includes('econnrefused')) {
                setError('📡 Network error! Ye try karo:\n• Wi-Fi off karke mobile data use karo (ya ulta)\n• Phone ki Date & Time check karo\n• App band karke dobara kholo')
            } else if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
                setError('❌ Email ya password galat hai. Dhyan se check karo!')
            } else if (msg.includes('email not confirmed')) {
                setError('📧 Email verify nahi hua. Inbox check karo (spam folder bhi dekho).')
            } else if (msg.includes('already registered') || msg.includes('already been registered')) {
                setError('⚠️ Ye email pehle se registered hai! Login karo instead.')
            } else if (msg.includes('rate limit') || msg.includes('too many')) {
                setError('⏰ Bohot zyada attempts! 1-2 minute ruko aur phir try karo.')
            } else if (msg.includes('password') && msg.includes('least')) {
                setError('🔑 Password kam se kam 6 characters ka hona chahiye.')
            } else {
                setError(`❌ ${err.message || 'Kuch gadbad ho gayi. Dobara try karo!'}`)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
            <FloatingPetals />

            {/* Animated ambient orbs */}
            <motion.div
                className="absolute pointer-events-none"
                style={{
                    width: 400, height: 400,
                    background: 'radial-gradient(circle, rgba(183,110,121,0.15) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    top: '-10%', left: '-15%',
                }}
                animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute pointer-events-none"
                style={{
                    width: 500, height: 500,
                    background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
                    filter: 'blur(70px)',
                    bottom: '-15%', right: '-20%',
                }}
                animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-sm"
            >
                {/* Outer glow ring */}
                <div
                    className="absolute inset-0 rounded-[20px]"
                    style={{
                        background: 'linear-gradient(135deg, rgba(183,110,121,0.15), rgba(212,175,55,0.08), rgba(183,110,121,0.1))',
                        padding: '1px',
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'xor',
                        WebkitMaskComposite: 'xor',
                    }}
                />

                <div
                    className="relative p-7 sm:p-9 rounded-[20px]"
                    style={{
                        background: 'linear-gradient(145deg, rgba(18, 14, 16, 0.92) 0%, rgba(12, 10, 12, 0.96) 100%)',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                        border: '1px solid rgba(183, 110, 121, 0.08)',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(183,110,121,0.05), inset 0 1px 0 rgba(255,255,255,0.03)',
                    }}
                >
                    {/* Brand */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                            className="relative inline-block"
                        >
                            {/* Animated glow behind emoji */}
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: 'radial-gradient(circle, rgba(183,110,121,0.3) 0%, transparent 70%)',
                                    filter: 'blur(15px)',
                                    transform: 'scale(2.5)',
                                }}
                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <span className="relative text-5xl block">💝</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="font-script text-5xl sm:text-6xl mt-4 bg-clip-text text-transparent"
                            style={{
                                backgroundImage: 'linear-gradient(135deg, #e6b8c0 0%, #d4af37 40%, #e6b8c0 80%, #d4af37 100%)',
                                backgroundSize: '200% auto',
                            }}
                        >
                            Sidekick
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-[11px] text-white/20 mt-3 tracking-[4px] uppercase font-body"
                        >
                            Just Us
                        </motion.p>

                        {/* Decorative line */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.9, duration: 0.8 }}
                            className="mx-auto mt-4 h-[1px] w-24"
                            style={{
                                background: 'linear-gradient(to right, transparent, rgba(183,110,121,0.3), rgba(212,175,55,0.2), transparent)',
                            }}
                        />
                    </div>

                    {/* Form */}
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        <AnimatePresence>
                            {isSignUp && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="relative group mb-4"
                                >
                                    <div className="absolute -inset-[1px] rounded-[13px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(183,110,121,0.3), rgba(212,175,55,0.2))',
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                        required={isSignUp}
                                        className="relative w-full px-4 py-3.5 text-[14px] rounded-xl font-body"
                                        style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            color: '#e8e0e2',
                                            outline: 'none',
                                            transition: 'all 0.3s ease',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.background = 'rgba(255,255,255,0.06)'
                                            e.target.style.borderColor = 'rgba(183,110,121,0.3)'
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.background = 'rgba(255,255,255,0.04)'
                                            e.target.style.borderColor = 'rgba(255,255,255,0.06)'
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative group">
                            <div className="absolute -inset-[1px] rounded-[13px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(183,110,121,0.3), rgba(212,175,55,0.2))',
                                }}
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                required
                                className="relative w-full px-4 py-3.5 text-[14px] rounded-xl font-body"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    color: '#e8e0e2',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                }}
                                onFocus={(e) => {
                                    e.target.style.background = 'rgba(255,255,255,0.06)'
                                    e.target.style.borderColor = 'rgba(183,110,121,0.3)'
                                }}
                                onBlur={(e) => {
                                    e.target.style.background = 'rgba(255,255,255,0.04)'
                                    e.target.style.borderColor = 'rgba(255,255,255,0.06)'
                                }}
                            />
                        </div>

                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-[1px] rounded-[13px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(183,110,121,0.3), rgba(212,175,55,0.2))',
                                }}
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                                minLength={6}
                                className="relative w-full px-4 py-3.5 text-[14px] rounded-xl font-body"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    color: '#e8e0e2',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                }}
                                onFocus={(e) => {
                                    e.target.style.background = 'rgba(255,255,255,0.06)'
                                    e.target.style.borderColor = 'rgba(183,110,121,0.3)'
                                }}
                                onBlur={(e) => {
                                    e.target.style.background = 'rgba(255,255,255,0.04)'
                                    e.target.style.borderColor = 'rgba(255,255,255,0.06)'
                                }}
                            />
                        </motion.div>

                        {/* Error / Success */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -8, height: 0 }}
                                    className="rounded-xl px-4 py-3"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                                >
                                    <p className="text-[12px] text-red-400/90 leading-relaxed whitespace-pre-line">{error}</p>
                                    {(error.includes('Network') || error.includes('network') || error.includes('Internet') || error.includes('timed out')) && (
                                        <motion.button
                                            onClick={handleSubmit}
                                            className="mt-2 px-4 py-1.5 rounded-lg text-[11px] font-body font-medium"
                                            style={{ background: 'rgba(239,68,68,0.15)', color: 'rgba(248,113,113,0.9)', border: '1px solid rgba(239,68,68,0.25)' }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            🔄 Retry karo
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -8, height: 0 }}
                                    className="rounded-xl px-4 py-3"
                                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}
                                >
                                    <p className="text-[12px] text-emerald-400/90">{success}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit button with animated gradient border */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="relative w-full py-3.5 text-[14px] font-medium rounded-xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #b76e79 0%, #a05a65 40%, #b76e79 80%, #c48a93 100%)',
                                backgroundSize: '200% auto',
                                color: '#fff',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                boxShadow: '0 8px 30px rgba(183,110,121,0.25), 0 0 0 1px rgba(183,110,121,0.1) inset',
                            }}
                            whileHover={!loading ? { scale: 1.01, backgroundPosition: '100% center' } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                        >
                            {/* Shimmer effect */}
                            <motion.div
                                className="absolute inset-0"
                                style={{
                                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                                }}
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
                            />
                            <span className="relative z-10">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Please wait...
                                    </span>
                                ) : isSignUp ? (
                                    'Create Account 🐻❄️'
                                ) : (
                                    'Enter Diary 🦶'
                                )}
                            </span>
                        </motion.button>
                    </motion.form>

                    {/* Toggle Links */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-6 text-center space-y-3"
                    >
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp)
                                setError('')
                                setSuccess('')
                            }}
                            className="block w-full text-[12px] text-rose-gold/50 hover:text-rose-gold transition-colors font-body py-1"
                        >
                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                    </motion.div>
                </div>

                {/* Card reflection/glow below */}
                <div
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-12 rounded-full"
                    style={{
                        background: 'radial-gradient(ellipse, rgba(183,110,121,0.12) 0%, transparent 70%)',
                        filter: 'blur(15px)',
                    }}
                />
            </motion.div>
        </div>
    )
}
