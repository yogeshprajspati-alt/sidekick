import { motion } from 'framer-motion'
import { useState } from 'react'

const TEMPLATES = [
    {
        id: 'daily',
        title: 'Daily Reflection',
        category: 'Personal',
        tags: ['Reflection', 'Daily'],
        mood: '😊',
        content: "Today I achieved:\n\nI felt challenged by:\n\nOne thing I'm grateful for today:\n"
    },
    {
        id: 'gratitude',
        title: 'Gratitude Journal',
        category: 'Spiritual',
        tags: ['Gratitude', 'Positivity'],
        mood: '✨',
        content: "Three things that made me smile today:\n1.\n2.\n3.\n\nA person I appreciate right now:\n"
    },
    {
        id: 'work',
        title: 'Work Day Review',
        category: 'Work',
        tags: ['Work', 'Productivity'],
        mood: '☕',
        content: "Top priorities completed:\n\nBlockers or issues:\n\nPlan for tomorrow:\n"
    },
    {
        id: 'mood',
        title: 'Mood Check-in',
        category: 'Health',
        tags: ['Health', 'Mental'],
        mood: '🦋',
        content: "Right now my energy level is:\n\nI'm feeling this way because:\n\nWhat I need right now is:\n"
    },
    {
        id: 'goal',
        title: 'Goal Setting',
        category: 'Personal',
        tags: ['Goals', 'Future'],
        mood: '🚀',
        content: "My main goal for this week/month:\n\nSteps to achieve it:\n- \n- \n\nPotential obstacles:\n"
    },
    {
        id: 'travel',
        title: 'Travel Memory',
        category: 'Travel',
        tags: ['Travel', 'Memories'],
        mood: '🌍',
        content: "Location:\n\nBest moment of the day:\n\nFood I tried:\n\nFunny/Random incident:\n"
    },
    {
        id: 'creative',
        title: 'Creative Idea',
        category: 'Creative',
        tags: ['Ideas', 'Creative'],
        mood: '💡',
        content: "The concept:\n\nWhy it excites me:\n\nFirst step to start:\n"
    },
    {
        id: 'problem',
        title: 'Problem Solving',
        category: 'Work',
        tags: ['Challenges', 'Ideas'],
        mood: '🤔',
        content: "The problem I'm facing:\n\nPossible solutions:\n1.\n2.\n\nThe approach I'll try first:\n"
    },
    {
        id: 'relationship',
        title: 'Relationship Reflection',
        category: 'Personal',
        tags: ['Relationships', 'Family', 'Friends'],
        mood: '🫂',
        content: "Interaction highlight:\n\nWhat I learned about them/us:\n\nHow I can be a better friend/partner tomorrow:\n"
    },
    {
        id: 'health',
        title: 'Health & Wellness',
        category: 'Health',
        tags: ['Health', 'Fitness'],
        mood: '🏃‍♀️',
        content: "Workout/Activity today:\n\nMeals & Hydration:\n\nHow my body feels:\n"
    }
]

export default function EntryTemplates({ onSelectTemplate }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-[12px] font-body text-white/40 hover:text-white/70 transition-colors"
                type="button"
            >
                <span>📋 Templates</span>
                <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 grid grid-cols-2 gap-2 h-48 overflow-y-auto scrollbar-hide pr-1"
                >
                    {TEMPLATES.map(template => (
                        <button
                            key={template.id}
                            onClick={() => {
                                onSelectTemplate(template)
                                setIsOpen(false)
                            }}
                            className="text-left p-3 rounded-xl transition-colors group"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                            type="button"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span>{template.mood}</span>
                                <span className="text-[12px] font-medium text-white/70 group-hover:text-rose-gold-light truncate">
                                    {template.title}
                                </span>
                            </div>
                            <span className="text-[9px] text-white/30 uppercase tracking-wider">{template.category}</span>
                        </button>
                    ))}
                </motion.div>
            )}
        </div>
    )
}
