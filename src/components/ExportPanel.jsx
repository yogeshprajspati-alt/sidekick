import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ExportPanel({ isOpen, onClose }) {
    const { user } = useAuth()
    const [exportFormat, setExportFormat] = useState('json')
    const [dateRange, setDateRange] = useState('all')
    const [exporting, setExporting] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')

    const handleExport = async () => {
        setExporting(true)
        setSuccessMsg('')
        try {
            let query = supabase.from('entries').select('*').eq('user_id', user.id)

            // Apply date filters
            const now = new Date()
            if (dateRange === 'month') {
                const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString()
                query = query.gte('created_at', monthAgo)
            } else if (dateRange === 'year') {
                const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString()
                query = query.gte('created_at', yearAgo)
            }

            const { data, error } = await query
            if (error) throw error

            let fileContent = ''
            let mimeType = ''
            const filename = `diary-export-${new Date().toISOString().split('T')[0]}`

            if (exportFormat === 'json') {
                fileContent = JSON.stringify(data, null, 2)
                mimeType = 'application/json'
            } else if (exportFormat === 'markdown') {
                fileContent = data.map(entry => {
                    const date = new Date(entry.created_at).toLocaleString()
                    const tags = entry.tags?.length ? `\n**Tags:** ${entry.tags.join(', ')}` : ''
                    const category = entry.category ? `\n**Category:** ${entry.category}` : ''
                    return `### ${date} ${entry.mood}\n${tags}${category}\n\n${entry.text}\n\n---\n`
                }).join('\n')
                mimeType = 'text/markdown'
            } else {
                fileContent = data.map(entry => {
                    return `Date: ${new Date(entry.created_at).toLocaleString()} | Mood: ${entry.mood}\n${entry.text}\n\n=================================\n`
                }).join('\n')
                mimeType = 'text/plain'
            }

            const blob = new Blob([fileContent], { type: mimeType })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${filename}.${exportFormat === 'markdown' ? 'md' : exportFormat === 'json' ? 'json' : 'txt'}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            setSuccessMsg(`Successfully exported ${data.length} entries.`)
            setTimeout(() => { if (isOpen) onClose() }, 2000)

        } catch (err) {
            console.error('Export failed', err)
            alert('Export failed. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                        className="relative w-[90%] max-w-sm z-50 p-6 rounded-2xl"
                        style={{
                            background: 'linear-gradient(145deg, rgba(20, 16, 18, 0.98) 0%, rgba(14, 11, 13, 0.99) 100%)',
                            border: '1px solid rgba(183, 110, 121, 0.2)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <h2 className="font-script text-2xl text-rose-gold-light mb-1">Export Diary</h2>
                        <p className="text-[12px] font-body text-white/40 mb-5">Download your memories safely.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] uppercase tracking-wider text-white/50 block mb-2">Format</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    {['json', 'markdown', 'txt'].map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => setExportFormat(fmt)}
                                            className="flex-1 py-2 text-[12px] font-body rounded-lg capitalize transition-colors"
                                            style={{
                                                background: exportFormat === fmt ? 'rgba(183,110,121,0.2)' : 'rgba(255,255,255,0.03)',
                                                color: exportFormat === fmt ? '#e6b8c0' : 'rgba(255,255,255,0.5)',
                                                border: exportFormat === fmt ? '1px solid rgba(183,110,121,0.4)' : '1px solid transparent'
                                            }}
                                        >
                                            {fmt === 'txt' ? 'Text' : fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] uppercase tracking-wider text-white/50 block mb-2">Time Range</label>
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-[13px] text-white/80 outline-none focus:border-rose-gold/50"
                                >
                                    <option value="all" className="bg-gray-900">All Entries</option>
                                    <option value="month" className="bg-gray-900">Last 30 Days</option>
                                    <option value="year" className="bg-gray-900">Last Year</option>
                                </select>
                            </div>
                        </div>

                        {successMsg && (
                            <p className="text-green-400 text-[11px] mt-4 text-center">{successMsg}</p>
                        )}

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl font-body text-[13px] text-white/40 hover:text-white/60 bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="flex-1 py-2.5 rounded-xl font-body text-[13px] text-white font-medium shadow-lg hover:shadow-rose-gold/20"
                                style={{ background: 'linear-gradient(135deg, #b76e79, #a05a65)', opacity: exporting ? 0.6 : 1 }}
                            >
                                {exporting ? 'Exporting...' : 'Download'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
