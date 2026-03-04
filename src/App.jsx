import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { DecoyModeProvider, useDecoyMode } from './context/DecoyModeContext'
import LoginPage from './pages/LoginPage'
import DiaryFeed from './pages/DiaryFeed'
import DecoyDiary from './pages/DecoyDiary'
import { AdminProvider } from './context/AdminContext'
import AdminFeed from './pages/AdminFeed'

function AppContent() {
    const { user, loading, isAdmin } = useAuth()
    const { isDecoyMode } = useDecoyMode()

    // Decoy mode takes priority — show fake diary regardless of auth state
    if (isDecoyMode) {
        return (
            <motion.div
                key="decoy"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="h-screen"
            >
                <DecoyDiary />
            </motion.div>
        )
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-deep-dark overflow-hidden">
                {/* Animated ambient background */}
                <div className="absolute inset-0">
                    <motion.div
                        className="absolute w-[500px] h-[500px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(183,110,121,0.08) 0%, transparent 70%)',
                            top: '20%', left: '10%',
                            filter: 'blur(60px)',
                        }}
                        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute w-[400px] h-[400px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
                            bottom: '15%', right: '5%',
                            filter: 'blur(50px)',
                        }}
                        animate={{ x: [0, -25, 0], y: [0, 15, 0], scale: [1, 1.15, 1] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center relative z-10"
                >
                    {/* Animated book icon */}
                    <motion.div
                        className="relative mx-auto mb-6"
                        style={{ width: 80, height: 80 }}
                    >
                        {/* Glowing ring */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: 'conic-gradient(from 0deg, rgba(183,110,121,0.4), rgba(212,175,55,0.3), rgba(183,110,121,0.1), rgba(212,175,55,0.4), rgba(183,110,121,0.4))',
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="absolute inset-[3px] rounded-full bg-deep-dark flex items-center justify-center">
                            <motion.span
                                className="text-4xl"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 5, -5, 0],
                                }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                📖
                            </motion.span>
                        </div>
                    </motion.div>

                    <motion.h1
                        className="font-script text-4xl bg-clip-text text-transparent"
                        style={{
                            backgroundImage: 'linear-gradient(135deg, #e6b8c0 0%, #d4af37 50%, #e6b8c0 100%)',
                            backgroundSize: '200% auto',
                        }}
                        animate={{ backgroundPosition: ['0% center', '200% center'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                        Sidekick
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ delay: 0.5 }}
                        className="text-[10px] text-white/30 tracking-[4px] uppercase font-body mt-2"
                    >
                        Loading your stories...
                    </motion.p>
                </motion.div>
            </div>
        )
    }

    return (
        <AnimatePresence mode="wait">
            {user ? (
                <motion.div
                    key="diary"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="h-screen"
                >
                    {isAdmin ? <AdminFeed /> : <DiaryFeed />}
                </motion.div>
            ) : (
                <motion.div
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="h-screen"
                >
                    <LoginPage />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default function App() {
    return (
        <ThemeProvider>
            <DecoyModeProvider>
                <AuthProvider>
                    <AdminProvider>
                        <AppContent />
                    </AdminProvider>
                </AuthProvider>
            </DecoyModeProvider>
        </ThemeProvider>
    )
}

