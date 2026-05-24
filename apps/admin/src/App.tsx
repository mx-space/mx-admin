import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { HashRouter, Navigate, useLocation } from 'react-router'

import { checkLogged } from './app/api/auth'
import { useI18n } from './app/i18n'
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

  return <ProtectedAdminApp />
}

function ProtectedAdminApp() {
  const location = useLocation()
  const { t } = useI18n()
  const loggedQuery = useQuery({
    queryFn: checkLogged,
    queryKey: ['auth', 'check-logged'],
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
  const from = `${location.pathname}${location.search}`

  if (loggedQuery.isLoading) {
    return (
      <main className="flex h-screen items-center justify-center bg-white text-sm text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
        {t('app.loading.auth')}
      </main>
    )
  }

  if (!loggedQuery.data?.ok) {
    return (
      <Navigate
        replace
        to={`/login?from=${encodeURIComponent(from || '/dashboard')}`}
      />
    )
  }

  return (
    <AdminShell>
      <AppRoutes />
    </AdminShell>
  )
}

// eslint-disable-next-line import/no-default-export
export default App
