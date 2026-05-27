import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Eye, EyeOff, Key, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { TokenModel } from '~/models/token'

import { createToken, deleteToken, getToken, getTokens } from '~/api/auth'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { DateTimePicker } from '~/ui/primitives/datetime-picker'
import { Scroll } from '~/ui/primitives/scroll'
import { Switch } from '~/ui/primitives/switch'
import { TextInput } from '~/ui/primitives/text-field'

import { accountQueryKey } from '../../constants'
import {
  formatDateTime,
  formatDateTimeInputValue,
  getErrorMessage,
} from '../../utils/settings'
import { EmptyState, Modal, PanelHeader } from '../SettingsPrimitives'

export function TokenPanel(props: { onBack: () => void }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [visibleTokens, setVisibleTokens] = useState<Record<string, string>>({})
  const [createOpen, setCreateOpen] = useState(false)
  const [createdToken, setCreatedToken] = useState<TokenModel | null>(null)
  const [name, setName] = useState('')
  const [expires, setExpires] = useState(formatDateTimeInputValue(new Date()))
  const [expiresEnabled, setExpiresEnabled] = useState(false)

  const tokensQuery = useQuery({
    queryFn: getTokens,
    queryKey: [...accountQueryKey, 'tokens'],
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createToken({
        expired: expiresEnabled ? new Date(expires).toISOString() : undefined,
        name,
      }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.token.error.create'))),
    onSuccess: async (token) => {
      try {
        await navigator.clipboard.writeText(token.token)
        toast.success(t('settings.token.success.create'))
      } catch {
        toast.success(t('settings.token.success.createNoCopy'))
      }
      setCreatedToken(token)
      setCreateOpen(false)
      setName('')
      setExpires(formatDateTimeInputValue(new Date()))
      setExpiresEnabled(false)
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteToken,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.token.error.delete'))),
    onSuccess: async () => {
      toast.success(t('settings.token.success.delete'))
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const revealToken = async (token: TokenModel) => {
    if (visibleTokens[token.id]) {
      setVisibleTokens((current) => {
        const next = { ...current }
        delete next[token.id]
        return next
      })
      return
    }

    try {
      const detail = await getToken(token.id)
      setVisibleTokens((current) => ({ ...current, [token.id]: detail.token }))
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.token.error.detail')))
    }
  }

  return (
    <div className="flex h-full min-h-72 flex-col">
      <PanelHeader
        onBack={props.onBack}
        title={t('settings.account.entry.tokenTitle')}
      >
        <Button onClick={() => setCreateOpen(true)} type="button">
          <Plus aria-hidden="true" className="size-4" />
          {t('settings.token.action.new')}
        </Button>
      </PanelHeader>
      <Scroll className="flex-1">
        {tokensQuery.isLoading ? (
          <div className="p-4 text-sm text-neutral-500">
            {t('settings.common.loading')}
          </div>
        ) : (tokensQuery.data ?? []).length === 0 ? (
          <EmptyState
            icon={<Key className="size-7" />}
            label={t('settings.token.empty')}
          />
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {tokensQuery.data?.map((token) => {
              const visible = visibleTokens[token.id]
              return (
                <div className="p-4" key={token.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium">
                        {token.name}
                      </h3>
                      <button
                        className="mt-2 max-w-full truncate font-mono text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                        onClick={() => {
                          if (visible)
                            void navigator.clipboard.writeText(visible)
                        }}
                        type="button"
                      >
                        {visible || '••••••••••••••••••••••••'}
                      </button>
                      <p className="mt-2 text-xs text-neutral-500">
                        {t('settings.token.createdAt', {
                          time: formatDateTime(token.createdAt),
                        })}
                        {token.expired
                          ? t('settings.token.createdExpireAt', {
                              time: formatDateTime(String(token.expired)),
                            })
                          : t('settings.token.createdNeverExpire')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => void revealToken(token)}
                        type="button"
                        variant="subtle"
                      >
                        {visible ? (
                          <EyeOff aria-hidden="true" className="size-4" />
                        ) : (
                          <Eye aria-hidden="true" className="size-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          if (
                            window.confirm(
                              t('settings.token.confirm.delete', {
                                name: token.name,
                              }),
                            )
                          ) {
                            deleteMutation.mutate(token.id)
                          }
                        }}
                        type="button"
                        variant="subtle"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Scroll>

      <Modal
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        title={t('settings.token.modal.create')}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!name.trim()) {
              toast.warning(t('settings.token.validation.needName'))
              return
            }
            if (expiresEnabled && Number.isNaN(new Date(expires).getTime())) {
              toast.warning(t('settings.token.validation.invalidExpire'))
              return
            }
            createMutation.mutate()
          }}
        >
          <TextInput
            label={t('settings.token.field.name')}
            onChange={setName}
            placeholder={t('settings.token.createTokenInputPlaceholder')}
            required
            value={name}
          />
          <Switch
            checked={expiresEnabled}
            label={t('settings.token.field.expireSwitch')}
            onCheckedChange={setExpiresEnabled}
          />
          <DateTimePicker
            disabled={!expiresEnabled}
            label={t('settings.token.field.expire')}
            onChange={setExpires}
            placeholder={t('settings.token.expirePlaceholder')}
            value={expires}
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setCreateOpen(false)}
              type="button"
              variant="subtle"
            >
              {t('common.cancel')}
            </Button>
            <Button disabled={createMutation.isPending} type="submit">
              {t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        onClose={() => setCreatedToken(null)}
        open={Boolean(createdToken)}
        title={t('settings.token.modal.createdTitle')}
      >
        <div className="space-y-4">
          <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            {t('settings.token.created.success')}
          </div>
          <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-neutral-500">
              {t('settings.token.created.nameLabel')}
            </span>
            <span className="font-medium">{createdToken?.name}</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <code className="min-w-0 flex-1 break-all text-xs">
              {createdToken?.token}
            </code>
            <Button
              onClick={() => {
                if (createdToken?.token) {
                  void navigator.clipboard.writeText(createdToken.token)
                  toast.success(t('settings.token.created.copyConfirm'))
                }
              }}
              type="button"
              variant="subtle"
            >
              <Copy aria-hidden="true" className="size-4" />
            </Button>
          </div>
          {createdToken?.expired ? (
            <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">
              <span className="text-neutral-500">
                {t('settings.token.created.expireAt')}
              </span>
              <span className="font-medium">
                {formatDateTime(String(createdToken.expired))}
              </span>
            </div>
          ) : null}
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            {t('settings.token.created.hiddenWarning')}
          </p>
        </div>
      </Modal>
    </div>
  )
}
