import { useState } from 'react'
import { toast } from 'sonner'
import type { CreateOwnerData } from '~/api/system'
import type { FormEvent } from 'react'

import { createOwner } from '~/api/system'
import { TextInput } from '~/ui/text-field'

import { inputClassName, labelClassName } from '../constants'
import { getErrorMessage, removeEmptyStrings } from '../utils/setup'
import { StepActions, UrlInput } from './SetupPrimitives'

export function SetupOwnerStep(props: {
  onNext: () => void
  onPrev: () => void
}) {
  const [owner, setOwner] = useState<CreateOwnerData>({
    mail: '',
    password: '',
    username: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = Boolean(
    owner.username && owner.mail && owner.password && confirmPassword,
  )

  const updateOwner = (patch: Partial<CreateOwnerData>) => {
    setOwner((current) => ({ ...current, ...patch }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit || submitting) return

    if (confirmPassword !== owner.password) {
      toast.error('两次密码不一致')
      return
    }

    setSubmitting(true)

    try {
      await createOwner(removeEmptyStrings(owner))
      props.onNext()
    } catch (error) {
      toast.error(getErrorMessage(error, '创建管理员失败'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
      <form onSubmit={submit}>
        <div className="space-y-4">
          <TextInput
            autoComplete="username"
            controlClassName={inputClassName}
            label="用户名（登录凭证）"
            labelClassName={labelClassName}
            onChange={(value) => updateOwner({ username: value })}
            placeholder="输入用户名"
            required
            value={owner.username}
          />

          <TextInput
            autoComplete="name"
            controlClassName={inputClassName}
            label="昵称"
            labelClassName={labelClassName}
            onChange={(value) => updateOwner({ name: value })}
            placeholder="输入昵称"
            value={owner.name ?? ''}
          />

          <TextInput
            autoComplete="email"
            controlClassName={inputClassName}
            label="邮箱"
            labelClassName={labelClassName}
            onChange={(value) => updateOwner({ mail: value })}
            placeholder="输入邮箱"
            required
            type="email"
            value={owner.mail}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              autoComplete="new-password"
              controlClassName={inputClassName}
              label="密码"
              labelClassName={labelClassName}
              onChange={(value) => updateOwner({ password: value })}
              placeholder="输入密码"
              required
              type="password"
              value={owner.password}
            />

            <TextInput
              autoComplete="new-password"
              controlClassName={inputClassName}
              label="确认密码"
              labelClassName={labelClassName}
              onChange={setConfirmPassword}
              placeholder="再次输入密码"
              required
              type="password"
              value={confirmPassword}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <UrlInput
              label="个人首页"
              onChange={(value) => updateOwner({ url: value })}
              placeholder="https://"
              value={owner.url ?? ''}
            />
            <UrlInput
              label="头像 URL"
              onChange={(value) => updateOwner({ avatar: value })}
              placeholder="https://"
              value={owner.avatar ?? ''}
            />
          </div>

          <TextInput
            autoComplete="off"
            controlClassName={inputClassName}
            label="个人介绍"
            labelClassName={labelClassName}
            onChange={(value) => updateOwner({ introduce: value })}
            placeholder="一句话介绍自己"
            value={owner.introduce ?? ''}
          />
        </div>

        <StepActions
          canSubmit={canSubmit}
          onPrev={props.onPrev}
          submitting={submitting}
        />
      </form>
    </div>
  )
}
