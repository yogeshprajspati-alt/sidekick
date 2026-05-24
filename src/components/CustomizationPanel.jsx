import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const THEMES = [
    { id: 'midnight-rose', name: 'Midnight Rose 🌹', color: '#b76e79', preview: 'linear-gradient(135deg, #1a1618, #2a1f22)' },
    { id: 'vintage-parchment', name: 'Vintage Parchment 📜', color: '#8c7355', preview: 'linear-gradient(135deg, #f5ead6, #e6d5b8)' },
    { id: 'emerald-forest', name: 'Emerald Forest 🌲', color: '#2e4f32', preview: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' },
    { id: 'ocean-breeze', name: 'Ocean Breeze 🌊', color: '#0ea5e9', preview: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' },
    { id: 'sunset-glow', name: 'Sunset Glow 🌅', color: '#f97316', preview: 'linear-gradient(135deg, #fff7ed, #ffedd5)' },
    { id: 'lavender-dream', name: 'Lavender Dream 💜', color: '#a855f7', preview: 'linear-gradient(135deg, #faf5ff, #f3e8ff)' },
    { id: 'golden-hour', name: 'Golden Hour 🌟', color: '#eab308', preview: 'linear-gradient(135deg, #fefce8, #fef9c3)' },
    { id: 'cherry-blossom', name: 'Cherry Blossom 🌸', color: '#ec4899', preview: 'linear-gradient(135deg, #fdf2f8, #fce7f3)' },
    { id: 'arctic-frost', name: 'Arctic Frost ❄️', color: '#06b6d4', preview: 'linear-gradient(135deg, #ecfeff, #cffafe)' },
    { id: 'autumn-leaves', name: 'Autumn Leaves 🍂', color: '#b45309', preview: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
    { id: 'cosmic-purple', name: 'Cosmic Purple 🌌', color: '#6366f1', preview: 'linear-gradient(135deg, #1e1b4b, #312e81)' },
    { id: 'mint-fresh', name: 'Mint Fresh 🌿', color: '#10b981', preview: 'linear-gradient(135deg, #f0fdf4, #d1fae5)' }
]

const FONTS = [
    { id: 'font-caveat', name: 'Handwriting', family: '"Caveat", cursive' },
    { id: 'font-dancing', name: 'Elegant Script', family: '"Dancing Script", cursive' },
    { id: 'font-inter', name: 'Modern', family: '"Inter", sans-serif' },
    { id: 'font-nunito', name: 'Soft Rounded', family: '"Nunito", sans-serif' },
    { id: 'font-georgia', name: 'Classic Serif', family: 'Georgia, serif' },
    { id: 'font-playfair', name: 'Journal', family: '"Playfair Display", serif' },
    { id: 'font-courier', name: 'Typewriter', family: '"Courier New", monospace' },
    { id: 'font-system', name: 'System Default', family: 'system-ui, -apple-system, sans-serif' }
]

export default function CustomizationPanel({ isOpen, onClose }) {
    const { user } = useAuth()
    const [preferences, setPreferences] = useState(() => {
        // Load from localStorage instantly (before Supabase)
        try {
            const saved = localStorage.getItem('sidekick-diary-prefs')
            if (saved) {
                const parsed = JSON.parse(saved)
                return {
                    theme: parsed.theme || 'midnight-rose',
                    font: parsed.font || 'font-caveat',
                    fontSize: parsed.fontSize || 22,
                    layout: parsed.layout || 'card'
                }
            }
        } catch { /* ignore */ }
        return { theme: 'midnight-rose', font: 'font-caveat', fontSize: 22, layout: 'card' }
    })
    const [saving, setSaving] = useState(false)

    const applyPreferences = useCallback((theme, font, size, layout) => {
        document.documentElement.setAttribute('data-diary-theme', theme)
        document.documentElement.setAttribute('data-diary-font', font)
        document.documentElement.setAttribute('data-diary-layout', layout)
        document.documentElement.style.setProperty('--diary-font-size', `${size}px`)
    }, [])

    // Apply saved preferences IMMEDIATELY on mount (from localStorage)
    useEffect(() => {
        applyPreferences(preferences.theme, preferences.font, preferences.fontSize, preferences.layout)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch from Supabase on mount (and when user changes), update if different
    useEffect(() => {
        if (!user) return

        const fetchPrefs = async () => {
            try {
                const { data } = await supabase
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                if (data) {
                    const prefs = {
                        theme: data.theme || 'midnight-rose',
                        font: data.font_family || 'font-caveat',
                        fontSize: data.font_size || 22,
                        layout: data.layout || 'card'
                    }
                    setPreferences(prefs)
                    applyPreferences(prefs.theme, prefs.font, prefs.fontSize, prefs.layout)
                    // Sync to localStorage for next load
                    localStorage.setItem('sidekick-diary-prefs', JSON.stringify(prefs))
                }
            } catch (err) {
                console.warn('Could not fetch preferences:', err.message)
            }
        }
        fetchPrefs()
    }, [user, applyPreferences])

    // Re-apply when panel opens (in case Supabase data changed)
    useEffect(() => {
        if (!isOpen || !user) return

        const fetchPrefs = async () => {
            try {
                const { data } = await supabase
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                if (data) {
                    const prefs = {
                        theme: data.theme || 'midnight-rose',
                        font: data.font_family || 'font-caveat',
                        fontSize: data.font_size || 22,
                        layout: data.layout || 'card'
                    }
                    setPreferences(prefs)
                    applyPreferences(prefs.theme, prefs.font, prefs.fontSize, prefs.layout)
                }
            } catch { /* silently fail, we already have localStorage prefs */ }
        }
        fetchPrefs()
    }, [isOpen, user, applyPreferences])

    const handleChange = (key, value) => {
        const newPrefs = { ...preferences, [key]: value }
        setPreferences(newPrefs)
        applyPreferences(newPrefs.theme, newPrefs.font, newPrefs.fontSize, newPrefs.layout)
        // Save to localStorage instantly for fast reload
        localStorage.setItem('sidekick-diary-prefs', JSON.stringify(newPrefs))
    }

    const savePreferences = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    theme: preferences.theme,
                    font_family: preferences.font,
                    font_size: preferences.fontSize,
                    layout: preferences.layout,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' })

            if (error) throw error
            // Also sync localStorage
            localStorage.setItem('sidekick-diary-prefs', JSON.stringify(preferences))
            onClose()
        } catch (err) {
            console.error('Failed to save preferences', err)
        } finally {
            setSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-80 max-w-full z-50 p-6 flex flex-col"
                        style={{
                            background: 'linear-gradient(180deg, rgba(20,16,18,0.98), rgba(10,8,9,0.98))',
                            borderLeft: '1px solid rgba(183,110,121,0.2)'
                        }}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-script text-2xl text-rose-gold-light">Aesthetics</h2>
                            <button onClick={onClose} className="text-white/40 hover:text-white pb-3">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                            {/* Themes */}
                            <div>
                                <h3 className="text-[12px] uppercase tracking-wider text-white/50 mb-3">Theme</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {THEMES.map(theme => (
                                        <button
                                            key={theme.id}
                                            onClick={() => handleChange('theme', theme.id)}
                                            className="flex flex-col items-center gap-2"
                                        >
                                            <div
                                                className="w-full h-16 rounded-xl relative transition-transform"
                                                style={{
                                                    background: theme.preview,
                                                    border: preferences.theme === theme.id ? `2px solid ${theme.color}` : '2px solid transparent',
                                                    transform: preferences.theme === theme.id ? 'scale(1.05)' : 'scale(1)'
                                                }}
                                            >
                                                {preferences.theme === theme.id && (
                                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center bg-white shadow-sm">
                                                        <span className="text-[10px]" style={{ color: theme.color }}>✓</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-white/70 font-body">{theme.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Typography */}
                            <div>
                                <h3 className="text-[12px] uppercase tracking-wider text-white/50 mb-3">Typography</h3>
                                <div className="space-y-2">
                                    {FONTS.map(font => (
                                        <button
                                            key={font.id}
                                            onClick={() => handleChange('font', font.id)}
                                            className="w-full text-left px-4 py-3 rounded-xl transition-all flex justify-between items-center"
                                            style={{
                                                background: preferences.font === font.id ? 'rgba(183,110,121,0.15)' : 'rgba(255,255,255,0.03)',
                                                border: preferences.font === font.id ? '1px solid rgba(183,110,121,0.3)' : '1px solid transparent'
                                            }}
                                        >
                                            <span style={{ fontFamily: font.family, fontSize: '18px', color: preferences.font === font.id ? '#e6b8c0' : '#ddd' }}>
                                                {font.name}
                                            </span>
                                            {preferences.font === font.id && <span className="text-rose-gold">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Font Size */}
                            <div>
                                <div className="flex justify-between mb-3">
                                    <h3 className="text-[12px] uppercase tracking-wider text-white/50">Font Size</h3>
                                    <span className="text-[12px] text-rose-gold-light">{preferences.fontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="16"
                                    max="28"
                                    value={preferences.fontSize}
                                    onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                                    className="w-full accent-rose-gold h-1 rounded-full bg-white/10 appearance-none"
                                />
                                <div className="flex justify-between mt-2 text-[10px] text-white/30">
                                    <span>Aa</span>
                                    <span className="text-lg">Aa</span>
                                </div>
                            </div>

                            {/* Layout Selection */}
                            <div>
                                <h3 className="text-[12px] uppercase tracking-wider text-white/50 mb-3">Layout Style</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleChange('layout', 'card')}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div
                                            className="w-full h-16 rounded-xl relative flex items-center justify-center transition-all"
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                border: preferences.layout === 'card' ? '2px solid #b76e79' : '2px solid transparent',
                                            }}
                                        >
                                            <div className="w-12 h-10 bg-white/10 rounded border border-white/20 transform rotate-[-5deg]"></div>
                                            {preferences.layout === 'card' && (
                                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center bg-rose-gold shadow-sm">
                                                    <span className="text-[10px] text-white">✓</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-white/70 font-body">Classic Card</span>
                                    </button>
                                    <button
                                        onClick={() => handleChange('layout', 'list')}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div
                                            className="w-full h-16 rounded-xl relative flex flex-col items-center justify-center gap-1.5 transition-all"
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                border: preferences.layout === 'list' ? '2px solid #b76e79' : '2px solid transparent',
                                            }}
                                        >
                                            <div className="w-14 h-3 bg-white/20 rounded"></div>
                                            <div className="w-14 h-3 bg-white/20 rounded"></div>
                                            {preferences.layout === 'list' && (
                                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center bg-rose-gold shadow-sm">
                                                    <span className="text-[10px] text-white">✓</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-white/70 font-body">Minimal List</span>
                                    </button>
                                    <button
                                        onClick={() => handleChange('layout', 'grid')}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div
                                            className="w-full h-16 rounded-xl relative flex flex-wrap items-center justify-center gap-1.5 transition-all p-2"
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                border: preferences.layout === 'grid' ? '2px solid #b76e79' : '2px solid transparent',
                                            }}
                                        >
                                            <div className="w-5 h-4 bg-white/20 rounded-sm"></div>
                                            <div className="w-5 h-4 bg-white/20 rounded-sm"></div>
                                            <div className="w-5 h-4 bg-white/20 rounded-sm"></div>
                                            <div className="w-5 h-4 bg-white/20 rounded-sm"></div>
                                            {preferences.layout === 'grid' && (
                                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center bg-rose-gold shadow-sm">
                                                    <span className="text-[10px] text-white">✓</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-white/70 font-body">Masonry Grid</span>
                                    </button>
                                    <button
                                        onClick={() => handleChange('layout', 'sticky')}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div
                                            className="w-full h-16 rounded-xl relative flex items-center justify-center transition-all bg-white/5 p-2"
                                            style={{
                                                border: preferences.layout === 'sticky' ? '2px solid #b76e79' : '2px solid transparent',
                                            }}
                                        >
                                            <div className="w-8 h-8 bg-yellow-200 shadow-sm flex flex-col items-center p-1 transform rotate-3"></div>
                                            {preferences.layout === 'sticky' && (
                                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center bg-rose-gold shadow-sm">
                                                    <span className="text-[10px] text-white">✓</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-white/70 font-body">Sticky Note</span>
                                    </button>
                                    <button
                                        onClick={() => handleChange('layout', 'polaroid')}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div
                                            className="w-full h-16 rounded-xl relative flex items-center justify-center transition-all bg-white/5 p-2"
                                            style={{
                                                border: preferences.layout === 'polaroid' ? '2px solid #b76e79' : '2px solid transparent',
                                            }}
                                        >
                                            <div className="w-10 h-10 bg-white shadow-md flex flex-col p-1 transform -rotate-3">
                                                <div className="w-full h-6 bg-gray-200"></div>
                                            </div>
                                            {preferences.layout === 'polaroid' && (
                                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center bg-rose-gold shadow-sm">
                                                    <span className="text-[10px] text-white">✓</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-white/70 font-body">Polaroid</span>
                                    </button>
                                    <button
                                        onClick={() => handleChange('layout', 'chat')}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div
                                            className="w-full h-16 rounded-xl relative flex flex-col justify-center gap-1 transition-all bg-white/5 p-2"
                                            style={{
                                                border: preferences.layout === 'chat' ? '2px solid #b76e79' : '2px solid transparent',
                                            }}
                                        >
                                            <div className="w-10 h-3 bg-blue-500 rounded-full self-end"></div>
                                            <div className="w-10 h-3 bg-gray-400 rounded-full self-start"></div>
                                            {preferences.layout === 'chat' && (
                                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center bg-rose-gold shadow-sm">
                                                    <span className="text-[10px] text-white">✓</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-white/70 font-body">Chat Bubbles</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10">
                            <button
                                onClick={savePreferences}
                                disabled={saving}
                                className="w-full py-3 rounded-xl font-body text-[14px] font-medium text-white transition-opacity"
                                style={{ background: 'linear-gradient(135deg, #b76e79, #a05a65)', opacity: saving ? 0.5 : 1 }}
                            >
                                {saving ? 'Saving...' : 'Apply Changes'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
