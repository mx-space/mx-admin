import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import type { PropsWithChildren } from 'react'

import { I18nProvider } from './i18n'
import { queryClient } from './query-client'
import { useThemeMode } from './theme'
import { ModalRoot } from './ui/modal-imperative'

export function AppProviders(props: PropsWithChildren) {
  const { isDark } = useThemeMode()

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>{props.children}</I18nProvider>
      <ModalRoot />
      <Toaster
        closeButton
        gap={12}
        position="bottom-right"
        theme={isDark ? 'dark' : 'light'}
        toastOptions={{
          classNames: {
            actionButton: 'sonner-action-button',
            cancelButton: 'sonner-cancel-button',
            closeButton: 'sonner-close-button',
            description: 'sonner-description',
            title: 'sonner-title',
            toast: 'sonner-toast',
          },
        }}
      />
    </QueryClientProvider>
  )
}
