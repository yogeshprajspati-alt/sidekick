import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SearchPanel({ isOpen, onClose, onApplySearch }) {
    const [filters, setFilters] = useState({
        query: '',
        dateRange: 'all',
        category: 'all',
        mood: 'all'
    })

    const CATEGORIES = ['all', 'Personal', 'Work', 'Travel', 'Health', 'Creative', 'Spiritual']
    const MOODS = ['all', '❤️', '😊', '😢', '🥰', '✨', '😡', '🌙', '🦋', '🫂', '☕']

    const handleApply = () => {
        onApplySearch(filters)
        onClose()
    }

    const clearFilters = () => {
        setFilters({
            query: '',
            dateRange: 'all',
            category: 'all',
            mood: 'all'
        })
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
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-50 p-6 rounded-2xl flex flex-col max-h-[90vh]"
                        style={{
                            background: 'linear-gradient(145deg, rgba(20, 16, 18, 0.98) 0%, rgba(14, 11, 13, 0.99) 100%)',
                            border: '1px solid rgba(183, 110, 121, 0.2)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="font-script text-2xl text-rose-gold-light">Search Diary</h2>
                                <p className="text-[11px] font-body text-white/40 mt-1">Find your memories</p>
                            </div>
                            <button onClick={onClose} className="text-white/40 hover:text-white p-2">✕</button>
                        </div>

                        <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {/* Text query */}
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-2 px-1">Keywords</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search words or tags..."
                                        value={filters.query}
                                        onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-[13px] text-white outline-none focus:border-rose-gold/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date Range */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-2 px-1">Time</label>
                                    <select
                                        value={filters.dateRange}
                                        onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[12px] text-white/80 outline-none focus:border-rose-gold/50"
                                    >
                                        <option value="all" className="bg-gray-900">All Time</option>
                                        <option value="week" className="bg-gray-900">Past Week</option>
                                        <option value="month" className="bg-gray-900">Past Month</option>
                                        <option value="year" className="bg-gray-900">Past Year</option>
                                    </select>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-2 px-1">Category</label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[12px] text-white/80 outline-none focus:border-rose-gold/50"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat} className="bg-gray-900">{cat === 'all' ? 'All Categories' : cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Mood */}
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-2 px-1">Feeling</label>
                                <div className="flex flex-wrap gap-2">
                                    {MOODS.map(mood => (
                                        <button
                                            key={mood}
                                            onClick={() => setFilters({ ...filters, mood })}
                                            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                                            style={{
                                                background: filters.mood === mood ? 'rgba(183,110,121,0.2)' : 'rgba(255,255,255,0.03)',
                                                border: filters.mood === mood ? '1px solid rgba(183,110,121,0.4)' : '1px solid transparent',
                                                color: filters.mood === mood ? '#fff' : 'rgba(255,255,255,0.6)'
                                            }}
                                        >
                                            {mood === 'all' ? 'Any' : mood}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={clearFilters}
                                className="flex-[0.5] py-2.5 rounded-xl font-body text-[12px] text-white/40 hover:text-white/80 bg-white/5 transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleApply}
                                className="flex-1 py-2.5 rounded-xl font-body text-[13px] text-white font-medium shadow-lg hover:shadow-rose-gold/20 transition-all flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #b76e79, #a05a65)' }}
                            >
                                <span>🔍</span> View Results
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
