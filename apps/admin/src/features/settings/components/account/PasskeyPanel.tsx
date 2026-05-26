import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Fingerprint, Plus, Shield, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { deletePasskey, listPasskeys } from '~/api/auth'
import { getOption, patchOption } from '~/api/options'
import { Button } from '~/ui/button'
import { Scroll } from '~/ui/scroll'
import { Switch } from '~/ui/switch'
import { TextInput } from '~/ui/text-field'
import { authClient } from '~/utils/authjs/auth'

import { accountQueryKey } from '../../constants'
import { formatDateTime, getErrorMessage } from '../../utils/settings'
import { EmptyState, PanelHeader } from '../SettingsPrimitives'

export function PasskeyPanel(props: { onBack: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  const authSecurityQuery = useQuery({
    queryFn: () =>
      getOption<{ disablePasswordLogin?: boolean }>('authSecurity'),
    queryKey: [...accountQueryKey, 'auth-security'],
  })

  const passkeysQuery = useQuery({
    queryFn: listPasskeys,
    queryKey: [...accountQueryKey, 'passkeys'],
  })

  const updateAuthSecurityMutation = useMutation({
    mutationFn: (disablePasswordLogin: boolean) =>
      patchOption('authSecurity', { disablePasswordLogin }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '更新登录安全设置失败')),
    onSuccess: async () => {
      toast.success('登录安全设置已更新')
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.passkey.addPasskey({
        name: name.trim() || `Passkey ${new Date().toLocaleDateString()}`,
      })
      if (result.error) throw new Error(result.error.message || '添加失败')
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '添加 Passkey 失败')),
    onSuccess: async () => {
      toast.success('Passkey 已添加')
      setName('')
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePasskey,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除 Passkey 失败')),
    onSuccess: async () => {
      toast.success('删除成功')
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const validateMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.signIn.passkey()
      if (result.error) {
        throw new Error(result.error.message || 'Passkey 验证失败')
      }
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, 'Passkey 验证失败')),
    onSuccess: () => {
      toast.success('Passkey 验证成功')
    },
  })

  return (
    <div className="flex h-full min-h-72 flex-col">
      <PanelHeader onBack={props.onBack} title="Passkey">
        <Button
          disabled={validateMutation.isPending}
          onClick={() => validateMutation.mutate()}
          type="button"
          variant="subtle"
        >
          <Shield aria-hidden="true" className="size-4" />
          验证
        </Button>
      </PanelHeader>
      <div className="border-b border-neutral-100 p-4 dark:border-neutral-900">
        <Switch
          checked={Boolean(authSecurityQuery.data?.disablePasswordLogin)}
          description="开启后只能通过 Passkey 或 OAuth 登录。至少添加一个 Passkey 后才能启用。"
          disabled={
            authSecurityQuery.isLoading || updateAuthSecurityMutation.isPending
          }
          label="禁止密码登录"
          onCheckedChange={(checked) => {
            if (checked && (passkeysQuery.data ?? []).length === 0) {
              toast.error('至少需要一个 Passkey 才能开启这个功能')
              return
            }
            updateAuthSecurityMutation.mutate(checked)
          }}
        />
      </div>
      <div className="border-b border-neutral-100 p-4 dark:border-neutral-900">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            addMutation.mutate()
          }}
        >
          <TextInput
            className="min-w-48 flex-1"
            onChange={setName}
            placeholder="Passkey 名称"
            value={name}
          />
          <Button disabled={addMutation.isPending} type="submit">
            <Plus aria-hidden="true" className="size-4" />
            添加
          </Button>
        </form>
      </div>
      <Scroll className="flex-1">
        {passkeysQuery.isLoading ? (
          <div className="p-4 text-sm text-neutral-500">加载中...</div>
        ) : (passkeysQuery.data ?? []).length === 0 ? (
          <EmptyState
            icon={<Fingerprint className="size-7" />}
            label="暂无 Passkey"
          />
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {passkeysQuery.data?.map((passkey) => (
              <div
                className="flex items-center justify-between gap-3 p-4"
                key={passkey.id}
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium">
                    {passkey.name || passkey.id}
                  </h3>
                  <p className="mt-1 truncate font-mono text-xs text-neutral-500">
                    {passkey.credentialID}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    创建于 {formatDateTime(passkey.createdAt)}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (window.confirm('确认删除该 Passkey？')) {
                      deleteMutation.mutate(passkey.id)
                    }
                  }}
                  type="button"
                  variant="subtle"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Scroll>
    </div>
  )
}
