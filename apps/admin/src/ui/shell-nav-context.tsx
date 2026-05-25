import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'

interface ShellNavValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const ShellNavContext = createContext<ShellNavValue | null>(null)

export function ShellNavProvider(props: {
  children: ReactNode
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const value = useMemo<ShellNavValue>(
    () => ({
      open: props.open,
      setOpen: props.setOpen,
      toggle: () => props.setOpen(!props.open),
    }),
    [props.open, props.setOpen],
  )

  return (
    <ShellNavContext.Provider value={value}>
      {props.children}
    </ShellNavContext.Provider>
  )
}

export function useShellNav(): ShellNavValue | null {
  return useContext(ShellNavContext)
}
