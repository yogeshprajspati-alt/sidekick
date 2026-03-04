import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const AdminContext = createContext({})

export const useAdmin = () => useContext(AdminContext)

export const AdminProvider = ({ children }) => {
    const { user, isAdmin } = useAuth()
    const [allUsers, setAllUsers] = useState([])
    const [allEntries, setAllEntries] = useState([])
    const [adminLoading, setAdminLoading] = useState(false)
    const [stats, setStats] = useState({
        totalEntries: 0,
        totalUsers: 0,
        moods: {},
        categories: {}
    })

    useEffect(() => {
        if (!user || !isAdmin) return

        const fetchAdminData = async () => {
            setAdminLoading(true)
            try {
                // Since we don't have direct access to auth.users from client without RPC
                // we'll primarily aggregate data from entries
                
                const { data: entries, error } = await supabase
                    .from('entries')
                    .select('*')
                    .order('created_at', { ascending: false })
                
                if (error) throw error

                setAllEntries(entries || [])

                // Calculate Stats
                const userIds = new Set()
                const moodCounts = {}
                const categoryCounts = {}

                entries?.forEach(entry => {
                    userIds.add(entry.user_id)
                    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1
                    
                    const cat = entry.category || 'Personal'
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
                })

                setStats({
                    totalEntries: entries?.length || 0,
                    totalUsers: userIds.size,
                    moods: moodCounts,
                    categories: categoryCounts
                })

                setAllUsers(Array.from(userIds).map(id => ({ id })))

            } catch (error) {
                console.error('Error fetching admin data:', error)
            } finally {
                setAdminLoading(false)
            }
        }

        fetchAdminData()

        // Realtime subscription for admin
        const channel = supabase
            .channel('admin-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, () => {
                fetchAdminData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, isAdmin])

    const deleteEntry = async (entryId) => {
        try {
            const { error } = await supabase
                .from('entries')
                .delete()
                .eq('id', entryId)
            
            if (error) throw error
        } catch (error) {
            console.error('Admin delete failed:', error)
            throw error
        }
    }

    return (
        <AdminContext.Provider value={{ allUsers, allEntries, adminLoading, stats, deleteEntry }}>
            {children}
        </AdminContext.Provider>
    )
}
