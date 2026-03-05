import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdmin } from '../context/AdminContext'
import DiaryCard from '../components/DiaryCard'

export default function AdminFeed() {
    const { allEntries, adminLoading, stats } = useAdmin()
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('feed') // 'feed' | 'stats'

    const [visibilityFilter, setVisibilityFilter] = useState('all') // 'all' | 'shared' | 'private'

    const filteredEntries = allEntries.filter(e => {
        const matchesSearch = e.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
            e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.author?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesVisibility =
            visibilityFilter === 'all' ? true :
                visibilityFilter === 'private' ? e.is_private === true :
                    e.is_private === false

        return matchesSearch && matchesVisibility
    })

    return (
        <div className="h-full flex flex-col bg-gray-900">
            {/* Header */}
            <header className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex justify-between items-center z-20">
                <div>
                    <h1 className="text-2xl font-bold text-red-400">Admin Override</h1>
                    <p className="text-xs text-gray-500 font-mono tracking-widest mt-1">STEALTH MODE ACTIVE</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === 'feed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-800 text-gray-400'}`}
                    >
                        FEED
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === 'stats' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-800 text-gray-400'}`}
                    >
                        STATS
                    </button>
                    <div className="w-px h-6 bg-gray-800 mx-2"></div>
                    <button
                        onClick={() => {
                            import('../lib/supabase').then(async ({ supabase }) => {
                                await supabase.auth.signOut();
                                window.location.reload();
                            })
                        }}
                        className="text-gray-500 hover:text-red-400 text-xl transition-colors ml-1"
                        title="Logout"
                    >
                        🚪
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto z-10 p-6">
                {adminLoading ? (
                    <div className="flex items-center justify-center p-20 text-red-500"><span className="animate-spin text-2xl">⏳</span></div>
                ) : activeTab === 'feed' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="mb-6 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                            <input
                                type="text"
                                placeholder="Search all entries by text, tags, or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-2 text-[11px] font-bold">
                                <button
                                    onClick={() => setVisibilityFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${visibilityFilter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    ALL
                                </button>
                                <button
                                    onClick={() => setVisibilityFilter('shared')}
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${visibilityFilter === 'shared' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    SHARED
                                </button>
                                <button
                                    onClick={() => setVisibilityFilter('private')}
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${visibilityFilter === 'private' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    PRIVATE
                                </button>
                            </div>
                            <div className="font-mono text-xs text-gray-500 tracking-wider">
                                {filteredEntries.length} ENTRIES
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredEntries.map((entry, i) => (
                                <DiaryCard key={entry.id} entry={entry} index={i} />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl">
                                <h3 className="text-gray-500 text-xs font-mono mb-2">TOTAL ENTRIES</h3>
                                <p className="text-4xl text-white">{stats.totalEntries}</p>
                            </div>
                            <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl">
                                <h3 className="text-gray-500 text-xs font-mono mb-2">TOTAL USERS</h3>
                                <p className="text-4xl text-white">{stats.totalUsers}</p>
                            </div>
                        </div>

                        <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl">
                            <h3 className="text-gray-500 text-xs font-mono mb-4 text-center">MOOD DISTRIBUTION</h3>
                            <div className="flex flex-wrap justify-center gap-4">
                                {Object.entries(stats.moods).map(([mood, count]) => (
                                    <div key={mood} className="flex flex-col items-center p-3 bg-gray-900 rounded-xl min-w-[60px]">
                                        <span className="text-2xl mb-1">{mood}</span>
                                        <span className="text-sm text-gray-400 font-mono">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl">
                            <h3 className="text-gray-500 text-xs font-mono mb-4 text-center">CATEGORY BREAKDOWN</h3>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {Object.entries(stats.categories).map(([cat, count]) => (
                                    <div key={cat} className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300">
                                        <span className="font-bold mr-2">{cat}</span>
                                        <span className="text-gray-500">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    )
}
