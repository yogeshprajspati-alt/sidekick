import { useEffect, useRef, useCallback } from 'react'

// Request notification permission on first call
async function requestPermission() {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false

    const result = await Notification.requestPermission()
    return result === 'granted'
}

export function useNotifications() {
    const permissionRef = useRef(false)

    useEffect(() => {
        requestPermission().then((granted) => {
            permissionRef.current = granted
        })
    }, [])

    const notify = useCallback((title, body, icon = '💕') => {
        if (!permissionRef.current) return

        // Don't notify if tab is focused
        if (document.visibilityState === 'visible') return

        try {
            const notification = new Notification(title, {
                body,
                icon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${icon}</text></svg>`,
                badge: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📖</text></svg>`,
                tag: 'sidekick-diary',
                renotify: true,
                silent: false,
            })

            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000)

            // Focus window on click
            notification.onclick = () => {
                window.focus()
                notification.close()
            }
        } catch (err) {
            console.warn('Notification failed:', err)
        }
    }, [])

    return { notify }
}
