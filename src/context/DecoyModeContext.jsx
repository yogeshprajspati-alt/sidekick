import { createContext, useContext, useState } from 'react'

// The secret decoy password — entering this on login shows the fake diary
export const DECOY_PASSWORD = 'prachi121@'

const DecoyModeContext = createContext(null)

export function DecoyModeProvider({ children }) {
    const [isDecoyMode, setIsDecoyMode] = useState(
        () => sessionStorage.getItem('decoy_mode') === 'true'
    )

    const enterDecoyMode = () => {
        sessionStorage.setItem('decoy_mode', 'true')
        setIsDecoyMode(true)
    }

    const exitDecoyMode = () => {
        sessionStorage.removeItem('decoy_mode')
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
