import { useState, useEffect, useRef } from 'react'

/**
 * Best-effort screenshot detection via tab blur / visibility change.
 * Web browsers cannot reliably detect OS-level screenshots,
 * but focus loss sometimes coincides with screenshot gestures on Android.
 */
export function useScreenshotAlert() {
    const [alertVisible, setAlertVisible] = useState(false)
    const timerRef = useRef(null)
    const lastFiredRef = useRef(0)
    const isFirstLoad = useRef(true)

    const fire = () => {
        const now = Date.now()
        // Debounce: don't fire more than once every 8 seconds
        if (now - lastFiredRef.current < 8000) return
        // Don't fire on first page load
        if (isFirstLoad.current) return

        lastFiredRef.current = now
        setAlertVisible(true)

        // Auto-dismiss after 4 seconds
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setAlertVisible(false), 4000)
    }

    useEffect(() => {
        // Mark first load complete after a short delay
        const initTimer = setTimeout(() => {
            isFirstLoad.current = false
        }, 2000)

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') fire()
        }

        const handleBlur = () => fire()

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('blur', handleBlur)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('blur', handleBlur)
            clearTimeout(timerRef.current)
            clearTimeout(initTimer)
        }
    }, [])

    const dismiss = () => {
        clearTimeout(timerRef.current)
        setAlertVisible(false)
    }

    return { alertVisible, dismiss }
}
