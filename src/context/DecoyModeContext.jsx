import { createContext, useContext, useState } from 'react'

// The secret decoy password — entering this on login shows the fake diary
export const DECOY_PASSWORD = 'prachi121@'

const DecoyModeContext = createContext(null)

const DECOY_STORAGE_KEY = 'sb_session_active'
const DECOY_STORAGE_VAL = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'

export function DecoyModeProvider({ children }) {
    const [isDecoyMode, setIsDecoyMode] = useState(
        () => sessionStorage.getItem(DECOY_STORAGE_KEY) === DECOY_STORAGE_VAL
    )

    const enterDecoyMode = () => {
        sessionStorage.setItem(DECOY_STORAGE_KEY, DECOY_STORAGE_VAL)
        setIsDecoyMode(true)
    }

    const exitDecoyMode = () => {
        sessionStorage.removeItem(DECOY_STORAGE_KEY)
        setIsDecoyMode(false)
    }

    return (
        <DecoyModeContext.Provider value={{ isDecoyMode, enterDecoyMode, exitDecoyMode }}>
            {children}
        </DecoyModeContext.Provider>
    )
}

export function useDecoyMode() {
    const context = useContext(DecoyModeContext)
    if (!context) throw new Error('useDecoyMode must be used within DecoyModeProvider')
    return context
}
