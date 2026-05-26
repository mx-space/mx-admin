import { Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { FlatOauthProvider, OauthProviderType } from '../../types/settings'

import { API_URL } from '~/constants/env'
import { Button } from '~/ui/primitives/button'
import { Switch } from '~/ui/primitives/switch'
import { TextInput } from '~/ui/primitives/text-field'
import { authClient } from '~/utils/authjs/auth'

import { GitHubIcon, GoogleIcon } from './OauthIcons'

export function OauthProviderSection(props: {
  data: FlatOauthProvider
  label: string
  onSave: (payload: {
    clientId: string
    clientSecret: string
    enabled: boolean
    type: OauthProviderType
  }) => void
  saving: boolean
  type: OauthProviderType
}) {
  const [enabled, setEnabled] = useState(props.data.enabled)
  const [clientId, setClientId] = useState(props.data.clientId)
  const [clientSecret, setClientSecret] = useState('')
  const callbackUrl = `${API_URL}/auth/callback/${props.type}`

  useEffect(() => {
    setEnabled(props.data.enabled)
    setClientId(props.data.clientId)
    setClientSecret('')
  }, [props.data])

  const validate = () => {
    const callback = new URL(location.href)
    callback.searchParams.set('validate', props.type)
    void authClient.signIn.social({
      callbackURL: callback.toString(),
      provider: props.type,
    })
  }

  const Icon = props.type === 'github' ? GitHubIcon : GoogleIcon

  return (
    <section className="px-4 py-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {props.label}
          </h3>
        </div>
        <Switch checked={enabled} label="启用" onCheckedChange={setEnabled} />
      </div>

      <div className="grid gap-3">
        <TextInput
          label="Client ID"
          onChange={setClientId}
          placeholder="输入 Client ID"
          value={clientId}
        />
        <TextInput
          label="Client Secret"
          onChange={setClientSecret}
          placeholder="输入 Client Secret"
          type="password"
          value={clientSecret}
        />
        <div className="grid gap-1.5 text-sm">
          <span className="text-neutral-600 dark:text-neutral-300">
            Callback URL
          </span>
          <div className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
            <code className="min-w-0 flex-1 truncate text-xs text-neutral-600 dark:text-neutral-300">
              {callbackUrl}
            </code>
            <Button
              aria-label="复制 Callback URL"
              className="h-7 px-2"
              onClick={() => {
                void navigator.clipboard.writeText(callbackUrl)
                toast.success('已复制到剪贴板')
              }}
              type="button"
              variant="subtle"
            >
              <Copy aria-hidden="true" className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={validate} type="button" variant="subtle">
            验证连接
          </Button>
          <Button
            disabled={props.saving || !clientId.trim() || !clientSecret.trim()}
            onClick={() =>
              props.onSave({
                clientId: clientId.trim(),
                clientSecret: clientSecret.trim(),
                enabled,
                type: props.type,
              })
            }
            type="button"
          >
            保存配置
          </Button>
        </div>
      </div>
    </section>
  )
}
