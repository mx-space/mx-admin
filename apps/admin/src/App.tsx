import { useEffect } from 'react'
import { HashRouter, useLocation } from 'react-router'

import { AppProviders } from './app/providers'
import { AppRoutes } from './app/routes'
import { AdminShell } from './app/shell'
import { installThemeTokens } from './app/theme'

function App() {
  useEffect(() => {
    document.title = 'Mx Space Admin'
    installThemeTokens()
  }, [])

  return (
    <AppProviders>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProviders>
  )
}

function AppContent() {
  const location = useLocation()

  if (
    location.pathname === '/setup-api' ||
    location.pathname === '/setup' ||
    location.pathname === '/login'
  ) {
    return <AppRoutes />
  }

  return (
    <AdminShell>
      <AppRoutes />
    </AdminShell>
  )
}

// eslint-disable-next-line import/no-default-export
export default App
