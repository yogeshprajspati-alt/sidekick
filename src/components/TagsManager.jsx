import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES = ['Personal', 'Work', 'Travel', 'Health', 'Creative', 'Spiritual']
const COMMON_TAGS = [
    'Work', 'Personal', 'Travel', 'Family', 'Friends', 'Health',
    'Goals', 'Ideas', 'Gratitude', 'Reflection', 'Dreams', 'Memories',
    'Learning', 'Achievements', 'Challenges', 'Celebration'
]

export default function TagsManager({ selectedCategory, setSelectedCategory, selectedTags, setSelectedTags }) {
    const [tagInput, setTagInput] = useState('')
    const [isExpanded, setIsExpanded] = useState(false)

    const handleAddTag = (tag) => {
        const t = tag.trim().toLowerCase()
        if (t && !selectedTags.some(existing => existing.toLowerCase() === t) && selectedTags.length < 5) {
            setSelectedTags([...selectedTags, tag.trim()])
        }
        setTagInput('')
    }

    const removeTag = (tagToRemove) => {
        setSelectedTags(selectedTags.filter(t => t !== tagToRemove))
    }

    return (
        <div className="mb-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-[12px] font-body text-white/40 hover:text-white/70 transition-colors"
                type="button"
            >
                <span>🏷️ Tags & Category {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
                <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3"
                    >
                        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {/* Category Selection */}
                            <div className="mb-4">
                                <label className="text-[10px] uppercase tracking-wider text-white/30 block mb-2">Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className="px-3 py-1 text-[11px] rounded-full transition-all"
                                            style={{
                                                background: selectedCategory === cat ? 'rgba(183,110,121,0.2)' : 'rgba(255,255,255,0.05)',
                                                color: selectedCategory === cat ? '#e6b8c0' : 'rgba(255,255,255,0.5)',
                                                border: `1px solid ${selectedCategory === cat ? 'rgba(183,110,121,0.5)' : 'transparent'}`
                                            }}
                                            type="button"
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags Input */}
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-white/30 block mb-2">Tags (Max 5)</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedTags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-2 py-1 text-[10px] rounded-md flex items-center gap-1"
                                            style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}
                                        >
                                            #{tag}
                                            <button onClick={() => removeTag(tag)} className="hover:text-white" type="button">×</button>
                                        </span>
                                    ))}
                                </div>
                                {selectedTags.length < 5 && (
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ',') {
                                                e.preventDefault()
                                                handleAddTag(tagInput)
                                            }
                                        }}
                                        placeholder="Add a tag..."
                                        className="w-full bg-transparent text-[12px] text-white/80 placeholder-white/20 outline-none pb-1"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                )}

                                <div className="mt-3">
                                    <p className="text-[9px] text-white/20 mb-2">Suggestions:</p>
                                    <div className="flex flex-wrap gap-1.5 h-16 overflow-y-auto scrollbar-hide">
                                        {COMMON_TAGS.filter(t => !selectedTags.includes(t)).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => handleAddTag(t)}
                                                className="text-[10px] px-2 py-0.5 rounded text-white/30 hover:text-white/60 bg-white/5 hover:bg-white/10 transition-colors"
                                                type="button"
                                            >
                                                +{t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
