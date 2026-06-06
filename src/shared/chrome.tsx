import { createContext, useContext, useState, type ReactNode } from 'react'

/**
 * Whether the on-screen "chrome" (back button + control panel) is hidden.
 * Used so the user can hide all UI for a clean full-canvas screen recording,
 * then bring it back. Shared across every material.
 */
interface ChromeState {
  hidden: boolean
  toggle: () => void
}

const ChromeCtx = createContext<ChromeState>({ hidden: false, toggle: () => {} })

export function ChromeProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)
  return (
    <ChromeCtx.Provider value={{ hidden, toggle: () => setHidden((h) => !h) }}>
      {children}
    </ChromeCtx.Provider>
  )
}

export const useChrome = () => useContext(ChromeCtx)
