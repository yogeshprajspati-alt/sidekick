import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SafeWordBanner from './SafeWordBanner'

const PASS_KEY = 'td_passes_used'
const DRAFT_KEY = 'td_draft'
const ENABLED_KEY = 'td_enabled'
const INTENSITY_KEY = 'td_intensity'
const SAFEWORD_KEY = 'td_safeword_until'
const CATEGORY_KEY = 'td_category'
const MAX_PASSES = 3
const ANSWER_TIME_LIMIT = 120 // seconds

// ── Categories ──────────────────────────────────────────
const CATEGORIES = [
    { id: 'romantic', label: '💕 Romantic', color: 'rgba(244,114,182,0.8)' },
    { id: 'embarrassing', label: '🙈 Embarrassing', color: 'rgba(251,191,36,0.8)' },
    { id: 'deep', label: '🌊 Deep', color: 'rgba(96,165,250,0.8)' },
    { id: 'spicy', label: '🌶️ Spicy', color: 'rgba(239,68,68,0.8)' },
    { id: 'fun', label: '🎉 Fun', color: 'rgba(74,222,128,0.8)' },
]

// ── Prompts by [type][category][intensity] ──────────────
const PROMPTS = {
    truth: {
        romantic: {
            soft: [
                'Pehli baar mujhe dekh kar kya socha tha? ✨',
                'Meri sabse favourite memory tumhare saath? 🌸',
                'Kaunsi ek aadat hai meri jo tumhe cute lagti hai? 🙈',
            ],
            medium: [
                'Kaise pata chala ki I mean something to you? 🦋',
                'Woh moment jab tumne mujhe sabse zyada miss kiya...',
                'Agar main ek mind reader hoti, toh kya sochte hue pakadti? 👀',
            ],
            deep: [
                'Agar main ek din nahi hota/hoti, toh kya karte? 🥺',
                'Kya kabhi aisa laga ki humari story yahi khatam ho jayegi? 💔',
                'Mujhse pyaar kab se hai? Bilkul sach batao... 🤫',
            ],
        },
        embarrassing: {
            soft: [
                'Sabse awkward public moment kya tha? 😂',
                'Koi aisi cheez jo galti se keh di thi? 🤭',
                'Bachpan ki sabse embarrassing photo kaisi hai? 📸',
            ],
            medium: [
                'Sabse bura excuse kya diya hai — aur pakde gaye? 😬',
                'Koi moment jab phone check hota toh game over tha? 📱',
                'Kisi ke saamne ajeeb awaaz nikal gayi — kab? 🫣',
            ],
            deep: [
                'Sabse badi lie kya boli hai jisme abhi tak phase ho? 🤥',
                'Koi aisa secret jo bahar aaye toh zameen khaa jaye? 😳',
                'Koi rejection story batao jo aaj tak dard deti hai... 💀',
            ],
        },
        deep: {
            soft: [
                'Aaj ka sabse pyaara moment kya tha? 🌸',
                'Abhi dil mein kya chal raha hai? 💭',
                'Ek yaad jo dil mein hamesha rehti hai...',
            ],
            medium: [
                'Koi baat jo tumne kabhi share nahi ki...',
                'Ek sapna jo raat ko aata hai 🌙',
                'Koi ek insecure feeling jo hide karti/karta hai?',
            ],
            deep: [
                'Ek cheez jo tumhe sabse zyada darr lagti hai kho dene se... 🔴',
                'Woh feeling jo words mein define nahi ho pati...',
                'Zindagi ka sabse difficult moment jaha akele mehsoos kiya? 🫂',
            ],
        },
        spicy: {
            soft: [
                'Mera kaunsa feature sabse pehle notice kiya tha? 😏',
                'Koi romantic sapna aaya hai mere baare mein? 👀',
                'Flirting style kya hai tumhari — bolo honestly? 💋',
            ],
            medium: [
                'Agar hum akele hote abhi toh kya karte? 🔥',
                'Sabse bold text kya bheja hai kisi ko? Show screenshot 📱',
                'Crush ke saamne kabhi kuch extra kiya hai impress karne ke liye? 😈',
            ],
            deep: [
                'Mujhse kya ek dark secret chhupa rakha hai? 🤫',
                'Agar koi limit nahi hoti toh kya bolte mujhe abhi? 🌶️',
                'Sabse wild fantasy kya hai — no filter? 🔥🔥',
            ],
        },
        fun: {
            soft: [
                'Agar superpower milti toh kya choose karte? ⚡',
                'Last Google search kya tha — honestly bolo? 🔍',
                'Celebrity crush kaun hai — no lying! 🌟',
            ],
            medium: [
                'Agar ek din ke liye invisible hote toh kya karte? 👻',
                'Phone mein sabse jyada kaun sa app use karte ho — sach? 📊',
                'Kya kabhi sapne mein koi ajeeb jagah gaye ho? 🌈',
            ],
            deep: [
                'Agar time travel kar sake toh kaunsa moment change karte? ⏳',
                'Zindagi ka sab kuch chhodna pade — 1 cheez rakhoge — kya? 🎒',
                'Kya kabhi deja vu feel hua hai? Kab? 🫠',
            ],
        },
    },
    dare: {
        romantic: {
            soft: [
                'Koi ek sweet note likho aur screenshot bhejo 💌',
                'Bina hasse mere 5 continuously tareef karo 🙈',
                'Apna favourite love song ka ek line gao 🎵',
            ],
            medium: [
                'Voice note bhejo — 30 sec non-stop mere baare mein bolo 🎙️',
                'Ek din ke liye mera diya hua nickname use karo 🎯',
                'Mujhe ek poem likho — right now, 2 min mein 📝',
            ],
            deep: [
                'Mujhe ek proper handwritten letter likho aur photo bhejo 📝',
                'Phone lock screen pe meri photo lagao 24 hrs ke liye! 📱',
                'Ek dare jo next time milne pe sach mein karna hoga... promise karo 🔥',
            ],
        },
        embarrassing: {
            soft: [
                'Apna sabse ajeeb selfie abhi banao aur bhejo 🤳',
                'Ek funny face banao aur photo bhejo — no filter! 🤡',
                'Apna aaj ka mood ek drawing mein batao — hand drawn only 🎨',
            ],
            medium: [
                'Screen time ka screenshot bhejo, no cheating! 📱',
                'Search history ka top result screenshot bhejo 👀',
                'Apni sabse old photo gallery se ek random photo bhejo 📸',
            ],
            deep: [
                'Camera on karo aur 1 min ke liye dance move dikhao 💃',
                'Koi aisi past story sunao jisme bohot embarass hue the 😳',
                'Apne best friend ko abhi ek weird msg bhejo — screenshot dikhao 🤪',
            ],
        },
        deep: {
            soft: [
                'Apna favourite song gao — sirf ek line! 🎵',
                'Mera ek funny sketch banake photo bhejo 🎨',
                'Apna aaj ka routine 3 emojis mein batao 📋',
            ],
            medium: [
                'Apni ek guilty pleasure batao honestly...',
                'Koi ek cheez dare karo jo kabhi nahi kiya 🎯',
                'Ek voice note bhejo sirf "I miss you" bolo 🎙️',
            ],
            deep: [
                'Apna dil kholo — koi bhi limitation nahi 💔',
                'Ek secret likho jo raat ko neend nahi aane deta...',
                'Woh dare jo tumhe darr lagta hai karne mein 🔥',
            ],
        },
        spicy: {
            soft: [
                'Apna crush confession — 3 words mein 💘',
                'Koi flirty compliment do — right now 😏',
                'Meri sabse attractive quality batao — ek hi 🔥',
            ],
            medium: [
                'Ek bold pickup line likho jo tumne kabhi try ki 💋',
                'Apna most used emoji batao — aur kyun? 🤔',
                'Ek secret quality batao jo partner mein dhundte ho 👀',
            ],
            deep: [
                'Apna most daring text kisi ko bheja — screenshot ya recreate 🌶️',
                'Ek aisi cheez karo jo tum normally kabhi nahi karte — abhi 🔥',
                'Boldest compliment do jo tumne kabhi kisi ko di — recreate 💀',
            ],
        },
        fun: {
            soft: [
                'Ek random TikTok dance karo aur video bhejo 💃',
                'Apna favourite dialogue kisi movie ka bolo — acting ke saath! 🎬',
                'Ek funny meme banao aur bhejo — 5 min mein 😂',
            ],
            medium: [
                'Ek rap likho — topic: tumhara aaj ka din — 30 sec mein 🎤',
                'Apne contact list mein sabse weird naam ka screenshot bhejo 📱',
                'Ek magic trick try karo aur video bhejo 🪄',
            ],
            deep: [
                'Ek prank call karo kisi ko — 1 min — aur recording bhejo 📞',
                'Ek stand-up joke sunao — improvise — no prep 🎤',
                'Koi ek cheez karo jo tumhe kabhi karne mein darr laga — aaj 🦁',
            ],
        },
    },
}

const INTENSITIES = [
    { id: 'soft', label: '🟢 Soft', color: 'rgba(74,222,128,0.7)' },
    { id: 'medium', label: '🟡 Medium', color: 'rgba(250,204,21,0.7)' },
    { id: 'deep', label: '🔴 Deep', color: 'rgba(248,113,113,0.7)' },
]

const CARD_FRAMES = ['🃏', '🎴', '🌸', '✨', '🎯', '🎭']

export default function TruthDareComposer({ onSent, initialType, initialIntensity }) {
    const { user } = useAuth()

    // Persistent state
    const [enabled, setEnabled] = useState(() => localStorage.getItem(ENABLED_KEY) === 'true')
    const [intensity, setIntensity] = useState(() => initialIntensity || localStorage.getItem(INTENSITY_KEY) || 'soft')
    const [category, setCategory] = useState(() => localStorage.getItem(CATEGORY_KEY) || 'romantic')
    const [safeWordUntil, setSafeWordUntil] = useState(() => {
        const v = localStorage.getItem(SAFEWORD_KEY)
        return v ? parseInt(v, 10) : null
    })

    // Session state
    const [passesUsed, setPassesUsed] = useState(() => parseInt(sessionStorage.getItem(PASS_KEY) || '0', 10))

    // Compose state
    const [type, setType] = useState(initialType || 'truth')
    const [text, setText] = useState(() => localStorage.getItem(DRAFT_KEY) || '')
    const [sending, setSending] = useState(false)
    const [justSent, setJustSent] = useState(false)
    const [passMessage, setPassMessage] = useState(null)
    const [showSafeWordConfirm, setShowSafeWordConfirm] = useState(false)

    // Card shuffle animation
    const [cardFrame, setCardFrame] = useState('🃏')
    const [isDrawing, setIsDrawing] = useState(false)

    // Spin the Bottle state
    const [isSpinning, setIsSpinning] = useState(false)
    const [spinAngle, setSpinAngle] = useState(0)
    const [spinResult, setSpinResult] = useState(null)

    const textRef = useRef(null)
    const draftTimer = useRef(null)

    // Auto-save draft with 1s debounce on text change
    useEffect(() => {
        clearTimeout(draftTimer.current)
        draftTimer.current = setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, text)
        }, 1000)
        return () => clearTimeout(draftTimer.current)
    }, [text])

    // Persist settings
    useEffect(() => { localStorage.setItem(ENABLED_KEY, enabled) }, [enabled])
    useEffect(() => { localStorage.setItem(INTENSITY_KEY, intensity) }, [intensity])
    useEffect(() => { localStorage.setItem(CATEGORY_KEY, category) }, [category])

    const isSafeWordActive = safeWordUntil && Date.now() < safeWordUntil
    const passesLeft = MAX_PASSES - passesUsed

    const handlePass = () => {
        if (passesLeft <= 0) return
        const next = passesUsed + 1
        setPassesUsed(next)
        sessionStorage.setItem(PASS_KEY, next.toString())
        setText('')
        localStorage.removeItem(DRAFT_KEY)
        if (next >= MAX_PASSES) {
            setPassMessage('Passes done! Ab answer do 😊')
        } else if (next === MAX_PASSES - 1) {
            setPassMessage('⚠️ Aakhri pass bacha hai')
        } else {
            setPassMessage('No worries 💙 Next round...')
        }
        setTimeout(() => setPassMessage(null), 3000)
    }

    const drawCard = () => {
        if (isDrawing) return
        setIsDrawing(true)
        setText('Shuffling deck...')
        let count = 0
        const pool = PROMPTS[type]?.[category]?.[intensity] || PROMPTS[type]?.romantic?.soft || []

        const interval = setInterval(() => {
            setCardFrame(CARD_FRAMES[count % CARD_FRAMES.length])
            count++
            if (count >= 12) {
                clearInterval(interval)
                const pick = pool[Math.floor(Math.random() * pool.length)]
                setText(pick || 'Apna khud likho! ✍️')
                setCardFrame('🃏')
                setIsDrawing(false)
                setTimeout(() => textRef.current?.focus(), 100)
            }
        }, 60)
    }

    // ── Spin the Bottle ──
    const spinBottle = () => {
        if (isSpinning) return
        setIsSpinning(true)
        setSpinResult(null)

        // Random spins between 1440-2880 degrees (4-8 full rotations)
        const totalSpin = 1440 + Math.random() * 1440
        const finalAngle = spinAngle + totalSpin
        setSpinAngle(finalAngle)

        // Determine result after spin completes
        setTimeout(() => {
            const resultAngle = finalAngle % 360
            const pickedType = resultAngle < 180 ? 'truth' : 'dare'
            setType(pickedType)
            setSpinResult(pickedType)
            setIsSpinning(false)

            // Auto-draw a card after spin lands
            setTimeout(() => {
                setSpinResult(null)
                drawCard()
            }, 1200)
        }, 2500)
    }

    const handleSafeWord = () => {
        const until = Date.now() + 60 * 60 * 1000
        setSafeWordUntil(until)
        localStorage.setItem(SAFEWORD_KEY, until.toString())
        setShowSafeWordConfirm(false)
    }

    const handleResume = () => {
        setSafeWordUntil(null)
        localStorage.removeItem(SAFEWORD_KEY)
    }

    const handleSend = async () => {
        if (!text.trim() || sending) return
        setSending(true)
        try {
            const { error } = await supabase
                .from('truth_dare_requests')
                .insert({
                    sender_id: user.id,
                    type,
                    intensity,
                    text: text.trim(),
                    status: 'pending',
                })
            if (error) throw error
            setText('')
            localStorage.removeItem(DRAFT_KEY)
            setJustSent(true)
            setTimeout(() => setJustSent(false), 3000)
            onSent?.()
        } catch (err) {
            console.error('Failed to send:', err)
        } finally {
            setSending(false)
        }
    }

    const intensityObj = INTENSITIES.find(i => i.id === intensity) || INTENSITIES[0]
    const categoryObj = CATEGORIES.find(c => c.id === category) || CATEGORIES[0]

    // ── Render ──

    return (
        <div className="px-3 sm:px-6 pt-4 pb-24">
            {/* Enable / Disable Toggle */}
            <motion.div
                className="rounded-2xl p-4 mb-4 flex items-center justify-between"
                style={{
                    background: enabled
                        ? 'linear-gradient(135deg, rgba(183,110,121,0.1), rgba(212,175,55,0.06))'
                        : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${enabled ? 'rgba(183,110,121,0.2)' : 'rgba(255,255,255,0.05)'}`,
                }}
                layout
            >
                <div>
                    <p className="font-handwriting text-[22px]" style={{ color: enabled ? 'rgba(230,184,192,0.9)' : 'rgba(255,255,255,0.25)' }}>
                        🎲 Truth or Dare
                    </p>
                    <p className="font-body text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        {enabled ? 'Mode ON — tumhare haath mein hai' : 'Mode OFF — opt-in karo jab chahiye'}
                    </p>
                </div>
                {/* Toggle pill */}
                <motion.button
                    onClick={() => setEnabled(v => !v)}
                    className="relative w-12 h-6 rounded-full flex-shrink-0 transition-colors duration-300"
                    style={{ background: enabled ? 'rgba(183,110,121,0.6)' : 'rgba(255,255,255,0.08)' }}
                    whileTap={{ scale: 0.92 }}
                >
                    <motion.div
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                        animate={{ left: enabled ? 28 : 4 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                    />
                </motion.button>
            </motion.div>

            <AnimatePresence>
                {enabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Safe Word Banner */}
                        {isSafeWordActive && (
                            <SafeWordBanner until={safeWordUntil} onResume={handleResume} />
                        )}

                        {!isSafeWordActive && (
                            <>
                                {/* ── SPIN THE BOTTLE ── */}
                                <motion.div
                                    className="rounded-2xl p-5 mb-4 flex flex-col items-center"
                                    style={{
                                        background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(14,11,13,0.6))',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <p className="font-body text-[10px] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                        Spin the Bottle
                                    </p>

                                    {/* Bottle */}
                                    <motion.div
                                        className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center cursor-pointer select-none"
                                        onClick={spinBottle}
                                        animate={{ rotate: spinAngle }}
                                        transition={isSpinning ? { duration: 2.5, ease: [0.12, 0, 0.39, 0] } : { duration: 0 }}
                                        whileHover={!isSpinning ? { scale: 1.1 } : {}}
                                        whileTap={!isSpinning ? { scale: 0.95 } : {}}
                                    >
                                        <div className="text-[40px] sm:text-[48px] drop-shadow-lg" style={{ filter: isSpinning ? 'drop-shadow(0 0 12px rgba(183,110,121,0.5))' : 'none' }}>
                                            🍾
                                        </div>
                                    </motion.div>

                                    <p className="font-body text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                        {isSpinning ? '✨ Spinning...' : spinResult ? `It landed on ${spinResult.toUpperCase()}!` : 'Tap to spin!'}
                                    </p>

                                    {/* Result flash */}
                                    <AnimatePresence>
                                        {spinResult && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="mt-2 px-4 py-1.5 rounded-full font-body text-[13px] font-bold"
                                                style={{
                                                    background: spinResult === 'truth'
                                                        ? 'linear-gradient(135deg, rgba(129,140,248,0.3), rgba(99,102,241,0.2))'
                                                        : 'linear-gradient(135deg, rgba(251,146,60,0.3), rgba(239,68,68,0.2))',
                                                    color: spinResult === 'truth' ? 'rgba(199,210,254,0.9)' : 'rgba(253,186,116,0.9)',
                                                    border: spinResult === 'truth' ? '1px solid rgba(129,140,248,0.4)' : '1px solid rgba(251,146,60,0.4)',
                                                }}
                                            >
                                                {spinResult === 'truth' ? '🎭 TRUTH!' : '🎯 DARE!'}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* ── CATEGORIES ── */}
                                <div className="mb-4">
                                    <p className="font-body text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                        Category
                                    </p>
                                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                                        {CATEGORIES.map((c) => (
                                            <motion.button
                                                key={c.id}
                                                onClick={() => setCategory(c.id)}
                                                className="flex-shrink-0 px-3 py-1.5 rounded-full font-body text-[11px] transition-all whitespace-nowrap"
                                                style={{
                                                    background: category === c.id ? c.color.replace('0.8', '0.15') : 'rgba(255,255,255,0.02)',
                                                    border: `1px solid ${category === c.id ? c.color.replace('0.8', '0.35') : 'rgba(255,255,255,0.04)'}`,
                                                    color: category === c.id ? c.color : 'rgba(255,255,255,0.25)',
                                                }}
                                                whileTap={{ scale: 0.93 }}
                                            >
                                                {c.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Intensity */}
                                <div className="flex gap-2 mb-4">
                                    {INTENSITIES.map((i) => (
                                        <motion.button
                                            key={i.id}
                                            onClick={() => setIntensity(i.id)}
                                            className="flex-1 py-2 rounded-xl font-body text-[11px] transition-all"
                                            style={{
                                                background: intensity === i.id
                                                    ? 'rgba(183,110,121,0.12)'
                                                    : 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${intensity === i.id ? 'rgba(183,110,121,0.25)' : 'rgba(255,255,255,0.04)'}`,
                                                color: intensity === i.id ? i.color : 'rgba(255,255,255,0.25)',
                                                boxShadow: intensity === i.id ? `0 0 12px ${i.color.replace('0.7', '0.15')}` : 'none',
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {i.label}
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Type Toggle: Truth / Dare */}
                                <div
                                    className="relative flex rounded-2xl p-1 mb-4"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                                >
                                    {/* Sliding pill */}
                                    <motion.div
                                        className="absolute top-1 bottom-1 rounded-xl"
                                        style={{
                                            background: type === 'truth'
                                                ? 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(99,102,241,0.08))'
                                                : 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(239,68,68,0.08))',
                                            border: type === 'truth' ? '1px solid rgba(129,140,248,0.25)' : '1px solid rgba(251,146,60,0.25)',
                                        }}
                                        animate={{
                                            left: type === 'truth' ? 4 : 'calc(50% + 2px)',
                                            width: 'calc(50% - 6px)',
                                        }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    />
                                    {[
                                        { id: 'truth', icon: '🎭', label: 'Truth', color: 'rgba(129,140,248,0.9)' },
                                        { id: 'dare', icon: '🎯', label: 'Dare', color: 'rgba(251,146,60,0.9)' },
                                    ].map((t) => (
                                        <motion.button
                                            key={t.id}
                                            onClick={() => setType(t.id)}
                                            className="relative z-10 flex-1 py-3 rounded-xl font-body text-[13px] font-medium flex items-center justify-center gap-2"
                                            style={{ color: type === t.id ? t.color : 'rgba(255,255,255,0.25)' }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <span className="text-[16px]">{t.icon}</span>
                                            {t.label}
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Textarea with draw card button */}
                                <div
                                    className="relative rounded-2xl overflow-hidden mb-3"
                                    style={{
                                        background: 'rgba(255,255,255,0.025)',
                                        border: `1px solid ${type === 'truth' ? 'rgba(129,140,248,0.15)' : 'rgba(251,146,60,0.15)'}`,
                                        boxShadow: `0 0 20px ${type === 'truth' ? 'rgba(129,140,248,0.04)' : 'rgba(251,146,60,0.04)'}`,
                                    }}
                                >
                                    <textarea
                                        ref={textRef}
                                        value={text}
                                        onChange={(e) => setText(e.target.value.slice(0, 500))}
                                        placeholder={`✍️ Likho apna ${type === 'truth' ? 'sawaal ya sach' : 'dare'}...`}
                                        rows={5}
                                        className="w-full resize-none px-4 pt-4 pb-2 font-handwriting text-[20px] bg-transparent outline-none"
                                        style={{
                                            color: 'rgba(232,224,226,0.8)',
                                            lineHeight: '28px',
                                            caretColor: type === 'truth' ? 'rgba(129,140,248,0.8)' : 'rgba(251,146,60,0.8)',
                                        }}
                                    />
                                    <div className="flex items-center justify-between px-4 pb-3">
                                        {/* Draw Card button */}
                                        <motion.button
                                            onClick={drawCard}
                                            disabled={isDrawing}
                                            className="font-body tracking-wide text-[12px] flex items-center gap-2 px-3 py-1.5 rounded-full"
                                            style={{
                                                background: isDrawing ? intensityObj.color.replace('0.7', '0.15') : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${isDrawing ? intensityObj.color.replace('0.7', '0.4') : 'rgba(255,255,255,0.08)'}`,
                                                color: isDrawing ? intensityObj.color : 'rgba(255,255,255,0.5)'
                                            }}
                                            whileTap={{ scale: 0.9 }}
                                            animate={isDrawing ? { scale: [1, 1.05, 1], boxShadow: `0 0 15px ${intensityObj.color.replace('0.7', '0.2')}` } : {}}
                                            transition={{ repeat: isDrawing ? Infinity : 0, duration: 0.4 }}
                                        >
                                            <motion.span
                                                className="text-[18px]"
                                                animate={isDrawing ? { rotateY: [0, 180, 360], scale: [1, 1.2, 1] } : {}}
                                                transition={{ repeat: isDrawing ? Infinity : 0, duration: 0.3 }}
                                            >
                                                {cardFrame}
                                            </motion.span>
                                            <span className="font-semibold">{isDrawing ? 'Drawing...' : 'Draw a Card'}</span>
                                        </motion.button>
                                        <span className="font-body text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
                                            {text.length}/500
                                        </span>
                                    </div>
                                </div>

                                {/* Timer info */}
                                <p className="font-body text-[10px] text-center mb-3" style={{ color: 'rgba(255,255,255,0.15)' }}>
                                    ⏱️ Partner gets {ANSWER_TIME_LIMIT}s to answer once they open
                                </p>

                                {/* Pass message toast */}
                                <AnimatePresence>
                                    {passMessage && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="font-body text-[12px] text-center mb-2"
                                            style={{ color: 'rgba(147,197,253,0.6)' }}
                                        >
                                            {passMessage}
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                {/* Action buttons — 2 cols */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {/* Pass */}
                                    <motion.button
                                        onClick={handlePass}
                                        disabled={passesLeft <= 0}
                                        className="py-2.5 rounded-xl font-body text-[11px] transition-all"
                                        style={{
                                            background: passesLeft > 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            color: passesLeft > 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                                        }}
                                        whileTap={passesLeft > 0 ? { scale: 0.97 } : {}}
                                    >
                                        🎫 Pass ({passesLeft}/{MAX_PASSES})
                                    </motion.button>

                                    {/* Send */}
                                    <motion.button
                                        onClick={handleSend}
                                        disabled={!text.trim() || sending}
                                        className="py-2.5 rounded-xl font-body text-[12px] font-medium transition-all relative overflow-hidden"
                                        style={{
                                            background: text.trim() && !sending
                                                ? type === 'truth'
                                                    ? 'linear-gradient(135deg, rgba(129,140,248,0.35), rgba(99,102,241,0.25))'
                                                    : 'linear-gradient(135deg, rgba(251,146,60,0.35), rgba(239,68,68,0.25))'
                                                : 'rgba(255,255,255,0.03)',
                                            border: text.trim()
                                                ? type === 'truth' ? '1px solid rgba(129,140,248,0.3)' : '1px solid rgba(251,146,60,0.3)'
                                                : '1px solid rgba(255,255,255,0.04)',
                                            color: text.trim() && !sending
                                                ? type === 'truth' ? 'rgba(199,210,254,0.9)' : 'rgba(253,186,116,0.9)'
                                                : 'rgba(255,255,255,0.2)',
                                            boxShadow: text.trim() && !sending
                                                ? type === 'truth' ? '0 4px 16px rgba(129,140,248,0.15)' : '0 4px 16px rgba(251,146,60,0.15)'
                                                : 'none',
                                        }}
                                        whileTap={text.trim() ? { scale: 0.97 } : {}}
                                    >
                                        {sending ? (
                                            <motion.span
                                                animate={{ opacity: [1, 0.4, 1] }}
                                                transition={{ duration: 0.8, repeat: Infinity }}
                                            >⏳ Sending...</motion.span>
                                        ) : justSent ? (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >✨ Sent!</motion.span>
                                        ) : '📤 Send'}
                                    </motion.button>
                                </div>

                                {/* Safe Word — always visible */}
                                <motion.button
                                    onClick={() => setShowSafeWordConfirm(true)}
                                    className="w-full py-2.5 rounded-xl font-body text-[12px] flex items-center justify-center gap-2 transition-all"
                                    style={{
                                        background: 'rgba(239,68,68,0.04)',
                                        border: '1px solid rgba(239,68,68,0.12)',
                                        color: 'rgba(239,68,68,0.45)',
                                    }}
                                    whileHover={{ backgroundColor: 'rgba(239,68,68,0.08)' }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span>🆘</span> Safe Word
                                </motion.button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Safe Word Confirm Modal */}
            <AnimatePresence>
                {showSafeWordConfirm && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40"
                            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSafeWordConfirm(false)}
                        />
                        <motion.div
                            className="fixed inset-x-4 bottom-8 z-50 rounded-3xl p-6 text-center"
                            style={{
                                background: 'linear-gradient(135deg, rgba(15,20,40,0.99), rgba(10,15,30,0.99))',
                                border: '1px solid rgba(96,165,250,0.2)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                            }}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        >
                            <p className="text-4xl mb-3">💙</p>
                            <h3 className="font-handwriting text-[24px] mb-2" style={{ color: 'rgba(147,197,253,0.9)' }}>
                                Sab theek hai
                            </h3>
                            <p className="font-body text-[13px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                Mode 1 ghante ke liye pause ho jayega.
                                <br />Koi log nahi, koi trace nahi.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSafeWordConfirm(false)}
                                    className="flex-1 py-3 rounded-2xl font-body text-[13px]"
                                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSafeWord}
                                    className="flex-1 py-3 rounded-2xl font-body text-[13px] font-medium"
                                    style={{ background: 'rgba(96,165,250,0.15)', color: 'rgba(147,197,253,0.9)', border: '1px solid rgba(96,165,250,0.2)' }}
                                >
                                    Pause 1hr
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
