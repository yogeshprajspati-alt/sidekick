import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import DiaryCard from '../components/DiaryCard'
import EntryComposer from '../components/EntryComposer'
import HeartBurst from '../components/HeartBurst'
import FloatingPetals from '../components/FloatingPetals'
import { useNotifications } from '../hooks/useNotifications'
import GreetingBanner from '../components/GreetingBanner'
import { useTheme } from '../context/ThemeContext'
import ScreenshotToast from '../components/ScreenshotToast'
import { useScreenshotAlert } from '../hooks/useScreenshotAlert'
import TruthDareComposer from '../components/TruthDareComposer'
import TruthDareRequestCard from '../components/TruthDareRequestCard'
import CustomizationPanel from '../components/CustomizationPanel'
import ExportPanel from '../components/ExportPanel'
import SearchPanel from '../components/SearchPanel'

// Auto-archive shared entries older than 30 days
const ARCHIVE_DAYS = 30

export default function DiaryFeed() {
    const { user, isAdmin, signOut } = useAuth()
    const [entries, setEntries] = useState([])
    const [archivedEntries, setArchivedEntries] = useState([])
    const [tdRequests, setTdRequests] = useState([])
    const [tdPlayAgain, setTdPlayAgain] = useState(null) // { type, intensity }
    const [loading, setLoading] = useState(true)
    const [heartTrigger, setHeartTrigger] = useState(0)
    const [activeTab, setActiveTab] = useState('shared')
    const feedRef = useRef(null)
    const { notify } = useNotifications()
    const { theme, toggleTheme } = useTheme()
    const { alertVisible, dismiss } = useScreenshotAlert()

    // New state for menus/panels
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [showCustomization, setShowCustomization] = useState(false)
    const [showExport, setShowExport] = useState(false)
    const [showSearch, setShowSearch] = useState(false)

    // Search filters state
    const [searchFilters, setSearchFilters] = useState(null)

    // ── Auto-archive sweep ─────────────────────────────────────────────────
    const runAutoArchive = useCallback(async () => {
        const cutoff = new Date(Date.now() - ARCHIVE_DAYS * 24 * 60 * 60 * 1000).toISOString()
        const { error } = await supabase
            .from('entries')
            .update({ is_archived: true, archived_at: new Date().toISOString() })
            .eq('is_private', false)
            .eq('is_archived', false)
            .lt('created_at', cutoff)
        if (error) console.error('Auto-archive failed:', error)
    }, [])

    useEffect(() => {
        runAutoArchive()
    }, [runAutoArchive])

    // ── Fetch entries ──────────────────────────────────────────────────────
    const fetchEntries = useCallback(async () => {
        setLoading(true)
        try {
            if (activeTab === 'archive') {
                // Fetch archived entries (admin sees all, users see own)
                let query = supabase
                    .from('entries')
                    .select('*')
                    .eq('is_archived', true)
                    .order('archived_at', { ascending: false })
                if (!isAdmin) query = query.eq('user_id', user.id)
                const { data, error } = await query
                if (error) throw error
                setArchivedEntries(data || [])
                setEntries([])
            } else if (activeTab === 'mood') {
                // Fetch all personal entries for mood timeline
                let query = supabase
                    .from('entries')
                    .select('*')
                    .eq('is_archived', false)
                    .order('created_at', { ascending: false })
                if (!isAdmin) query = query.eq('user_id', user.id)
                const { data, error } = await query
                if (error) throw error
                setEntries(data || [])
            } else {
                let query = supabase
                    .from('entries')
                    .select('*')
                    .eq('is_archived', false)
                    .order('created_at', { ascending: false })

                if (activeTab === 'shared') {
                    query = query.eq('is_private', false)
                } else {
                    query = query.eq('is_private', true)
                    if (!isAdmin) query = query.eq('user_id', user.id)
                }

                // Actually fetch entries and then join profiles
                const { data: entriesData, error: entriesError } = await query
                if (entriesError) throw entriesError

                // Fetch profiles for the authors
                const authorIds = [...new Set(entriesData.map(e => e.user_id))]
                if (authorIds.length > 0) {
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('id, full_name, email')
                        .in('id', authorIds)

                    const profileMap = {}
                    profilesData?.forEach(p => profileMap[p.id] = p)

                    const entriesWithNames = entriesData.map(e => ({
                        ...e,
                        author_name: profileMap[e.user_id]?.full_name || profileMap[e.user_id]?.email || 'Pending Sync'
                    }))
                    setEntries(entriesWithNames)
                } else {
                    setEntries(entriesData || [])
                }
            }
        } catch (err) {
            console.error('Failed to fetch entries:', err)
        } finally {
            setLoading(false)
        }
    }, [activeTab, isAdmin, user?.id])

    useEffect(() => {
        fetchEntries()
    }, [fetchEntries])
    // ── Fetch Truth/Dare requests ──────────────────────────────────────────
    const fetchTdRequests = useCallback(async () => {
        const { data } = await supabase
            .from('truth_dare_requests')
            .select('*')
            .order('created_at', { ascending: false })
        setTdRequests(data || [])
    }, [])

    useEffect(() => {
        if (activeTab === 'requests' || activeTab === 'play') fetchTdRequests()
    }, [activeTab, fetchTdRequests])

    // Fetch on mount to get badge count
    useEffect(() => { fetchTdRequests() }, [fetchTdRequests])


    useEffect(() => {
        const channel = supabase
            .channel('diary-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'entries' }, (payload) => {
                const newEntry = payload.new
                if (activeTab === 'shared' && !newEntry.is_private && !newEntry.is_archived) {
                    setEntries((prev) => [newEntry, ...prev])
                    if (newEntry.user_id !== user?.id) {
                        setHeartTrigger((t) => t + 1)
                        const preview = newEntry.text.length > 60 ? newEntry.text.substring(0, 60) + '...' : newEntry.text
                        notify(`${newEntry.mood} Let's read 💕`, preview, newEntry.mood)
                    }
                } else if (activeTab === 'personal' && newEntry.is_private) {
                    if (isAdmin || newEntry.user_id === user?.id) {
                        setEntries((prev) => [newEntry, ...prev])
                    }
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'entries' }, (payload) => {
                setEntries((prev) => prev.filter((e) => e.id !== payload.old.id))
                setArchivedEntries((prev) => prev.filter((e) => e.id !== payload.old.id))
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'entries' }, (payload) => {
                const updated = payload.new
                if (updated.is_archived) {
                    setEntries((prev) => prev.filter((e) => e.id !== updated.id))
                } else {
                    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
                    setArchivedEntries((prev) => prev.filter((e) => e.id !== updated.id))
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'truth_dare_requests' }, (payload) => {
                setTdRequests((prev) => [payload.new, ...prev])
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'truth_dare_requests' }, (payload) => {
                setTdRequests((prev) => prev.map((r) => r.id === payload.new.id ? payload.new : r))
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'truth_dare_requests' }, (payload) => {
                setTdRequests((prev) => prev.filter((r) => r.id !== payload.old.id))
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [user?.id, isAdmin, activeTab, notify, fetchTdRequests])

    const handleLogout = async () => {
        try { await signOut() } catch (err) { console.error('Logout failed:', err) }
    }

    const handleEntryUpdated = (updatedEntry) => {
        setEntries((prev) => prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)))
    }

    const handleEntryDeleted = (deletedId) => {
        setEntries((prev) => prev.filter((e) => e.id !== deletedId))
        setArchivedEntries((prev) => prev.filter((e) => e.id !== deletedId))
    }

    const handleRestore = async (entryId) => {
        const { error } = await supabase
            .from('entries')
            .update({ is_archived: false, archived_at: null })
            .eq('id', entryId)
        if (!error) {
            setArchivedEntries((prev) => prev.filter((e) => e.id !== entryId))
        }
    }

    // Apply client-side search filtering
    const displayEntries = useMemo(() => {
        if (!searchFilters) return entries

        return entries.filter(entry => {
            // Text query
            if (searchFilters.query) {
                const query = searchFilters.query.toLowerCase()
                const matchesText = entry.text.toLowerCase().includes(query)
                const matchesTags = entry.tags?.some(tag => tag.toLowerCase().includes(query))
                if (!matchesText && !matchesTags) return false
            }

            // Category
            if (searchFilters.category && searchFilters.category !== 'all') {
                if (entry.category !== searchFilters.category) return false
            }

            // Mood
            if (searchFilters.mood && searchFilters.mood !== 'all') {
                if (entry.mood !== searchFilters.mood) return false
            }

            // Date Range
            if (searchFilters.dateRange && searchFilters.dateRange !== 'all') {
                const entryDate = new Date(entry.created_at)
                const now = new Date()
                if (searchFilters.dateRange === 'week') {
                    const cutoff = new Date(now.setDate(now.getDate() - 7))
                    if (entryDate < cutoff) return false
                } else if (searchFilters.dateRange === 'month') {
                    const cutoff = new Date(now.setMonth(now.getMonth() - 1))
                    if (entryDate < cutoff) return false
                } else if (searchFilters.dateRange === 'year') {
                    const cutoff = new Date(now.setFullYear(now.getFullYear() - 1))
                    if (entryDate < cutoff) return false
                }
            }
            return true
        })
    }, [entries, searchFilters])

    // Group entries by date (for shared/personal feed)
    const groupedEntries = displayEntries.reduce((groups, entry) => {
        const date = new Date(entry.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        })
        if (!groups[date]) groups[date] = []
        groups[date].push(entry)
        return groups
    }, {})

    // Tab config — 5 tabs
    const pendingCount = tdRequests.filter((r) => r.status === 'pending' && r.sender_id !== user?.id).length

    const TABS = [
        { id: 'shared', label: '🌍 Shared' },
        { id: 'personal', label: '🔒 Private' },
        { id: 'play', label: '🎲' },
        { id: 'requests', label: pendingCount > 0 ? `💬${pendingCount}` : '💬' },
        { id: 'mood', label: '📊' },
        { id: 'archive', label: '📦' },
    ]
    const tabIndex = TABS.findIndex((t) => t.id === activeTab)

    return (
        <div className="relative h-full flex flex-col overflow-hidden">
            <FloatingPetals />
            <HeartBurst trigger={heartTrigger} />

            {/* Screenshot alert toast */}
            <ScreenshotToast visible={alertVisible} onDismiss={dismiss} />

            {/* Header */}
            <header className="relative z-20 flex-shrink-0">
                <div
                    className="px-5 sm:px-6 pt-4 pb-2 flex items-center justify-between"
                    style={{
                        background: 'linear-gradient(180deg, rgba(10,10,15,0.98) 0%, rgba(10,10,15,0.9) 60%, rgba(10,10,15,0.7) 100%)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <div>
                            <motion.h1
                                className="font-script text-3xl sm:text-4xl bg-clip-text text-transparent leading-tight"
                                style={{ backgroundImage: 'linear-gradient(135deg, #e6b8c0 0%, #d4af37 45%, #e6b8c0 100%)' }}
                            >
                                Sidekick
                            </motion.h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                {isAdmin && (
                                    <span className="text-[9px] bg-rose-gold/10 text-rose-gold-light px-1.5 py-0.5 rounded-full border border-rose-gold/15">
                                        👑 Admin
                                    </span>
                                )}
                                <p className="text-[9px] text-white/15 tracking-[2px] uppercase font-body">
                                    Just Us
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <motion.button
                            onClick={toggleTheme}
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.9 }}
                            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
                        >
                            <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} className="text-[14px]">
                                {theme === 'dark' ? '☀️' : '🌙'}
                            </motion.span>
                        </motion.button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsMenuOpen(false)}
                            />
                            <motion.div
                                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed top-0 left-0 bottom-0 w-64 max-w-[80vw] z-50 p-6 flex flex-col"
                                style={{
                                    background: 'linear-gradient(180deg, rgba(20,16,18,0.98), rgba(10,8,9,0.98))',
                                    borderRight: '1px solid rgba(183,110,121,0.2)'
                                }}
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="font-script text-3xl text-rose-gold-light">Menu</h2>
                                    <button onClick={() => setIsMenuOpen(false)} className="text-white/50 text-xl font-bold p-2">✕</button>
                                </div>

                                <div className="space-y-2 flex-col flex flex-1">
                                    <button
                                        onClick={() => { setIsMenuOpen(false); setShowCustomization(true) }}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left text-sm text-white/80 transition-colors"
                                    >
                                        <span className="text-lg">🎨</span> Aesthetics
                                    </button>
                                    <button
                                        onClick={() => { setIsMenuOpen(false); setShowExport(true) }}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left text-sm text-white/80 transition-colors"
                                    >
                                        <span className="text-lg">📤</span> Export Diary
                                    </button>
                                    <button
                                        onClick={() => { setIsMenuOpen(false); setShowSearch(true) }}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left text-sm text-white/80 transition-colors"
                                    >
                                        <span className="text-lg">🔍</span> Advanced Search
                                    </button>
                                    <button
                                        onClick={() => { setIsMenuOpen(false); toggleTheme() }}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left text-sm text-white/80 transition-colors sm:hidden"
                                    >
                                        <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
                                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                    </button>

                                    <div className="mt-auto"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-left text-sm text-red-400 transition-colors"
                                    >
                                        <span className="text-lg">🚪</span> Logout
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Tab bar — scrollable on mobile */}
                <div
                    className="px-3 sm:px-6 pb-3 pt-1"
                    style={{ background: 'linear-gradient(180deg, rgba(10,10,15,0.7) 0%, transparent 100%)' }}
                >
                    <div
                        className="relative flex gap-0.5 sm:gap-1 p-1 rounded-2xl overflow-x-auto scrollbar-hide"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                        {/* Animated pill */}
                        <motion.div
                            className="absolute top-1 bottom-1 rounded-xl hidden sm:block"
                            style={{
                                background: 'linear-gradient(135deg, rgba(183,110,121,0.15), rgba(212,175,55,0.08))',
                                border: '1px solid rgba(183,110,121,0.15)',
                                boxShadow: '0 2px 8px rgba(183,110,121,0.1)',
                            }}
                            animate={{
                                left: `calc(${tabIndex} * (100% / 6) + 4px)`,
                                width: `calc(100% / 6 - 8px)`,
                            }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        />
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative z-10 flex-shrink-0 flex-1 min-w-[48px] py-2.5 rounded-xl text-[11px] sm:text-[11px] font-body font-medium transition-colors duration-300
                                    ${activeTab === tab.id ? 'text-rose-gold-light bg-rose-gold/10 sm:bg-transparent' : 'text-white/25 hover:text-white/40'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Active Search Banner */}
                <AnimatePresence>
                    {searchFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-5 sm:px-6 z-10 relative overflow-hidden bg-rose-gold/10"
                            style={{ borderBottom: '1px solid rgba(183,110,121,0.2)' }}
                        >
                            <div className="py-2.5 flex justify-between items-center text-xs font-body">
                                <div>
                                    <span className="text-rose-gold-light opacity-80 mr-2">🔍 Search Results</span>
                                    <span className="text-white/60">Found {displayEntries.length} entries</span>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowSearch(true)} className="text-white/60 hover:text-white transition-colors">Edit</button>
                                    <button onClick={() => setSearchFilters(null)} className="text-rose-gold hover:text-rose-gold-light transition-colors font-medium">Clear</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div
                    className="h-[1px]"
                    style={{ background: 'linear-gradient(to right, transparent 5%, rgba(183,110,121,0.1) 30%, rgba(212,175,55,0.08) 70%, transparent 95%)' }}
                />
            </header>

            {/* Feed */}
            <main
                ref={feedRef}
                className="relative z-10 flex-1 overflow-y-auto pb-24"
                style={{
                    maskImage: 'linear-gradient(180deg, transparent 0%, black 1.5%, black 96%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 1.5%, black 96%, transparent 100%)',
                }}
            >
                {/* Greeting for Prachi */}
                {!isAdmin && activeTab !== 'archive' && activeTab !== 'play' && activeTab !== 'requests' && <GreetingBanner />}

                {/* 🎲 PLAY TAB */}
                {activeTab === 'play' && (
                    <TruthDareComposer
                        key={tdPlayAgain ? `${tdPlayAgain.type}-${tdPlayAgain.intensity}` : 'default'}
                        initialType={tdPlayAgain?.type}
                        initialIntensity={tdPlayAgain?.intensity}
                        onSent={() => { setTdPlayAgain(null); fetchTdRequests(); setActiveTab('requests') }}
                    />
                )}

                {/* 💬 REQUESTS TAB */}
                {activeTab === 'requests' && (
                    <div className="px-4 sm:px-6 pt-4">
                        {loading ? <LoadingState /> : tdRequests.length === 0 ? (
                            <EmptyState icon="💬" title="No requests yet" subtitle="Truth ya Dare bhejo — 🎲 tab se" />
                        ) : (
                            <div>
                                <p className="font-body text-[11px] mb-4 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                    {pendingCount > 0 ? `${pendingCount} pending request${pendingCount !== 1 ? 's' : ''}` : 'All caught up ✓'}
                                </p>
                                {tdRequests.map((req, i) => (
                                    <TruthDareRequestCard
                                        key={req.id}
                                        request={req}
                                        index={i}
                                        onUpdated={fetchTdRequests}
                                        onPlayAgain={({ type, intensity }) => {
                                            setTdPlayAgain({ type, intensity })
                                            setActiveTab('play')
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 📦 ARCHIVE TAB */}
                {activeTab === 'archive' && (
                    <div className="px-4 sm:px-6 pt-4">
                        {loading ? (
                            <LoadingState />
                        ) : archivedEntries.length === 0 ? (
                            <EmptyState icon="📦" title="Archive is empty" subtitle={`Shared notes older than ${ARCHIVE_DAYS} days will appear here`} />
                        ) : (
                            <div>
                                <p className="font-body text-[11px] mb-4 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                    {archivedEntries.length} archived note{archivedEntries.length !== 1 ? 's' : ''} · auto-archived after {ARCHIVE_DAYS} days
                                </p>
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {archivedEntries.map((entry, i) => (
                                            <motion.div
                                                key={entry.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <DiaryCard
                                                    entry={entry}
                                                    index={i}
                                                    onEntryUpdated={handleEntryUpdated}
                                                    onEntryDeleted={handleEntryDeleted}
                                                    isArchived
                                                    onRestore={() => handleRestore(entry.id)}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 🌍 SHARED & 🔒 PERSONAL TABS */}
                {(activeTab === 'shared' || activeTab === 'personal') && (
                    <div className="px-4 sm:px-6">
                        {loading ? (
                            <LoadingState />
                        ) : displayEntries.length === 0 ? (
                            <EmptyState
                                icon={searchFilters ? '🔍' : (activeTab === 'shared' ? '📓' : '🔐')}
                                title={searchFilters ? 'No matches found' : (activeTab === 'shared' ? 'Empty Pages' : 'Your Secret Pages')}
                                subtitle={searchFilters ? 'Try adjusting your search filters.' : (activeTab === 'shared'
                                    ? 'Your shared diary awaits its first words. Tap ✍️ to write your story together.'
                                    : 'A place for your private thoughts. Tap ✍️ to start writing. 🔒')}
                            />
                        ) : (
                            <div className="pt-3 relative">
                                <AnimatePresence mode="popLayout">
                                    {Object.entries(groupedEntries).map(([date, dateEntries]) => (
                                        <div key={date}>
                                            <div className="flex items-center gap-3 my-4">
                                                <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(183,110,121,0.12))' }} />
                                                <span
                                                    className="font-handwriting text-[14px] px-3 py-1 rounded-full"
                                                    style={{ color: 'rgba(183,110,121,0.5)', background: 'rgba(183,110,121,0.04)', border: '1px solid rgba(183,110,121,0.08)' }}
                                                >
                                                    {date}
                                                </span>
                                                <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, rgba(183,110,121,0.12))' }} />
                                            </div>
                                            {dateEntries.map((entry, i) => (
                                                <DiaryCard key={entry.id} entry={entry} index={i} onEntryUpdated={handleEntryUpdated} onEntryDeleted={handleEntryDeleted} />
                                            ))}
                                        </div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Float Composer Button & Panel */}
            {activeTab !== 'archive' && activeTab !== 'mood' && (
                <EntryComposer
                    activeTab={activeTab}
                    onEntryAdded={() => {
                        fetchEntries()
                        if (feedRef.current) feedRef.current.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                />
            )}

            {/* Panels */}
            <CustomizationPanel isOpen={showCustomization} onClose={() => setShowCustomization(false)} />
            <ExportPanel isOpen={showExport} onClose={() => setShowExport(false)} />
            <SearchPanel
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
                onApplySearch={setSearchFilters}
            />
        </div>
    )
}

// ── Shared sub-components ──────────────────────────────────────────────────
function LoadingState() {
    return (
        <div className="flex items-center justify-center h-48">
            <div className="text-center">
                <motion.div
                    className="text-4xl mb-4"
                    animate={{ rotateY: [0, 180, 360], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ perspective: '200px' }}
                >📖</motion.div>
                <p className="text-[12px] text-white/20 font-body">Opening diary...</p>
            </div>
        </div>
    )
}

function EmptyState({ icon, title, subtitle }) {
    return (
        <div className="flex items-center justify-center h-64">
            <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-center"
            >
                <motion.div
                    className="text-6xl mb-5"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >{icon}</motion.div>
                <h2 className="font-script text-3xl text-rose-gold/50 mb-3">{title}</h2>
                <p className="text-[13px] text-white/20 font-body max-w-[260px] mx-auto leading-relaxed">{subtitle}</p>
            </motion.div>
        </div>
    )
}
