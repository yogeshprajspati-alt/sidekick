import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ADMIN_EMAIL } from '../lib/constants'

const AuthContext = createContext(null)

// Helper: wrap a promise with a timeout
function withTimeout(promise, ms = 15000) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out. Check your internet connection and try again.')), ms)
        ),
    ])
}

// Helper: retry a function up to N times with delay
async function withRetry(fn, retries = 2, delayMs = 1500) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn()
        } catch (err) {
            if (attempt === retries) throw err
            // Only retry on network-type errors
            const msg = (err.message || '').toLowerCase()
            const isNetworkError = msg.includes('fetch') || msg.includes('network') || msg.includes('timed out') || msg.includes('socket') || msg.includes('econnrefused')
            if (!isNetworkError) throw err // Don't retry auth errors like wrong password
            await new Promise(r => setTimeout(r, delayMs * (attempt + 1)))
        }
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const isAdmin = user?.email === ADMIN_EMAIL

    useEffect(() => {
        // Check current session with timeout so it doesn't block forever
        const initSession = async () => {
            try {
                const { data: { session } } = await withTimeout(
                    supabase.auth.getSession(),
                    10000 // 10s timeout for initial session check
                )
                setUser(session?.user ?? null)
            } catch (err) {
                console.warn('Session check failed (possibly offline):', err.message)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        initSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null)
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signUp = async (email, password, name) => {
        return withRetry(async () => {
            const { data, error } = await withTimeout(
                supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name
                        }
                    }
                }),
                20000 // 20s timeout for signup
            )
            if (error) throw error
            return data
        }, 2)
    }

    const signIn = async (email, password) => {
        return withRetry(async () => {
            const { data, error } = await withTimeout(
                supabase.auth.signInWithPassword({ email, password }),
                15000
            )
            if (error) throw error
            return data
        }, 2)
    }

    const signInWithMagicLink = async (email) => {
        return withRetry(async () => {
            const { data, error } = await withTimeout(
                supabase.auth.signInWithOtp({ email }),
                15000
            )
            if (error) throw error
            return data
        }, 1)
    }

    const signOut = async () => {
        try {
            const { error } = await withTimeout(supabase.auth.signOut(), 5000)
            if (error) throw error
        } catch {
            // Even if signOut fails (offline), clear local state
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, signUp, signIn, signInWithMagicLink, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
