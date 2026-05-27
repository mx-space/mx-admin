import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Fingerprint, Key, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { OauthProviderType } from '../../types/settings'

import { authAsOwner } from '~/api/auth'
import { useI18n } from '~/i18n'
import { authClient } from '~/utils/authjs/auth'

import { accountQueryKey } from '../../constants'
import { getErrorMessage } from '../../utils/settings'
import { AccountEntry } from './AccountEntry'
import { OauthSection } from './OauthSection'
import { PasskeyPanel } from './PasskeyPanel'
import { PasswordSection } from './PasswordSection'
import { SessionSection } from './SessionSection'
import { TokenPanel } from './TokenPanel'

export function AccountSettings() {
  const { t } = useI18n()
  const [activePanel, setActivePanel] = useState<'passkeys' | 'tokens' | null>(
    null,
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const validateProvider = searchParams.get(
    'validate',
  ) as OauthProviderType | null

  const authAsOwnerMutation = useMutation({
    mutationFn: authAsOwner,
    onError: (error: unknown) =>
      toast.error(
        getErrorMessage(error, t('settings.account.error.authAsOwnerFailed')),
      ),
    onSuccess: async () => {
      toast.success(t('settings.account.success.authAsOwner'))
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  useEffect(() => {
    if (!validateProvider) return

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('validate')
        return next
      },
      { replace: true },
    )

    void authClient.getSession().then((result) => {
      if (result.error || !result.data) {
        toast.error(t('settings.account.error.oauthValidateFailed'))
        return
      }

      toast.success(t('settings.account.success.oauthValidate'))
      if (window.confirm(t('settings.account.prompt.setAsOwner'))) {
        authAsOwnerMutation.mutate()
      }
    })
  }, [authAsOwnerMutation, setSearchParams, t, validateProvider])

  return (
    <div className="grid min-h-[34rem] grid-cols-1 overflow-hidden border border-neutral-200 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)] dark:border-neutral-800">
      <div className="min-w-0 border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
        <div className="space-y-4 p-4">
          <SessionSection />
          <PasswordSection />
          <AccountEntry
            active={activePanel === 'tokens'}
            description={t('settings.account.entry.tokenDescription')}
            icon={<Key aria-hidden="true" className="size-4" />}
            onClick={() =>
              setActivePanel((current) =>
                current === 'tokens' ? null : 'tokens',
              )
            }
            title={t('settings.account.entry.tokenTitle')}
          />
          <AccountEntry
            active={activePanel === 'passkeys'}
            description={t('settings.account.entry.passkeyDescription')}
            icon={<Fingerprint aria-hidden="true" className="size-4" />}
            onClick={() =>
              setActivePanel((current) =>
                current === 'passkeys' ? null : 'passkeys',
              )
            }
            title={t('settings.account.entry.passkeyTitle')}
          />
          <OauthSection />
        </div>
      </div>
      <div className="min-w-0 bg-neutral-50 dark:bg-neutral-950">
        {activePanel === 'tokens' ? (
          <TokenPanel onBack={() => setActivePanel(null)} />
        ) : activePanel === 'passkeys' ? (
          <PasskeyPanel onBack={() => setActivePanel(null)} />
        ) : (
          <div className="flex h-full min-h-72 flex-col items-center justify-center px-4 text-center">
            <Shield aria-hidden="true" className="size-8 text-neutral-300" />
            <p className="mt-3 text-sm text-neutral-500">
              {t('settings.account.placeholder.title')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
