import {
  Check,
  ChevronLeft,
  PartyPopper,
  Rocket,
  Settings,
  User,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { ComponentType, FormEvent } from 'react'
import type { CreateOwnerData, InitDefaultConfigs } from '../api/system'

import { bgUrl } from '~/constants/env'
import { showConfetti } from '~/utils/confetti'

import {
  checkInit,
  createOwner,
  getInitDefaultConfigs,
  patchInitConfig,
  restoreFromBackup,
} from '../api/system'
import { cn } from '../ui/cn'
import { TextInput } from '../ui/text-field'

const inputClassName =
  'h-[42px] w-full rounded-full border-0 bg-white/20 px-4 text-sm text-white backdrop-blur-md transition-all placeholder:text-white/60 focus-visible:bg-white/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'

const labelClassName = 'mb-2 block text-sm font-medium text-white/90'

const primaryButtonClassName =
  'inline-flex h-[42px] items-center justify-center rounded-full bg-white/90 px-6 text-sm font-medium text-neutral-900 transition-all hover:bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'

const secondaryButtonClassName =
  'inline-flex h-[42px] items-center justify-center rounded-full bg-white/15 px-6 text-sm text-white/90 backdrop-blur-sm transition-all hover:bg-white/25 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'

const steps: Array<{
  icon: ComponentType<{ className?: string }>
  title: string
}> = [
  { icon: Rocket, title: '开始' },
  { icon: Settings, title: '站点' },
  { icon: User, title: '账户' },
  { icon: PartyPopper, title: '完成' },
]

const stepDescriptions = [
  '欢迎进行初始化配置',
  '请配置站点基本信息',
  '请创建管理员账户',
  '初始化即将完成',
]

export function SetupPage() {
  const [step, setStep] = useState(0)
  const [defaultConfigs, setDefaultConfigs] = useState<InitDefaultConfigs>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const injected = window.injectData?.INIT
        if (typeof injected !== 'boolean') {
          await checkInit()
        }
        const configs = await getInitDefaultConfigs()
        if (!cancelled) setDefaultConfigs(configs)
      } catch (error) {
        toast.error(getErrorMessage(error, '初始化配置读取失败'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 p-4 text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(10,10,10,.42), rgba(10,10,10,.58)), url(${bgUrl})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="mb-8 flex items-center gap-3">
        {steps.map((item, index) => {
          const Icon = item.icon
          const isActive = step === index
          const isCompleted = step > index

          return (
            <button
              aria-current={isActive ? 'step' : undefined}
              aria-label={`${item.title}${isCompleted ? '（已完成）' : isActive ? '（当前）' : ''}`}
              className={cn(
                'flex size-10 items-center justify-center rounded-full transition-all',
                isActive
                  ? 'bg-white/90 text-neutral-900'
                  : isCompleted
                    ? 'cursor-pointer bg-white/40 text-white hover:bg-white/50'
                    : 'cursor-not-allowed bg-white/10 text-white/40',
              )}
              disabled={index > step}
              key={item.title}
              onClick={() => {
                if (index < step) setStep(index)
              }}
              type="button"
            >
              {isCompleted ? (
                <Check aria-hidden="true" className="size-5" />
              ) : (
                <Icon className="size-5" />
              )}
            </button>
          )
        })}
      </div>

      <h1 className="mb-2 text-xl font-medium tracking-wide drop-shadow-lg">
        {steps[step].title}
      </h1>
      <p className="mb-8 text-sm text-white/70">{stepDescriptions[step]}</p>

      <div className="w-full max-w-md">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
          </div>
        ) : step === 0 ? (
          <SetupStartStep onNext={() => setStep(1)} />
        ) : step === 1 ? (
          <SetupSiteStep
            defaultConfigs={defaultConfigs}
            onNext={() => setStep(2)}
            onPrev={() => setStep(0)}
          />
        ) : step === 2 ? (
          <SetupOwnerStep onNext={() => setStep(3)} onPrev={() => setStep(1)} />
        ) : (
          <SetupCompleteStep onPrev={() => setStep(2)} />
        )}
      </div>
    </main>
  )
}

function SetupStartStep(props: { onNext: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [restoring, setRestoring] = useState(false)

  const restore = async (file: File | undefined) => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    setRestoring(true)

    try {
      await restoreFromBackup(formData)
      toast.success('恢复成功，页面将会重载')
      setTimeout(() => {
        location.reload()
      }, 1000)
    } catch (error) {
      toast.error(getErrorMessage(error, '恢复失败'))
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="mb-4 flex size-24 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
        <Rocket aria-hidden="true" className="size-12" />
      </div>

      <p className="mb-4 text-center text-sm text-white/80">
        开始全新配置，或从备份文件恢复
      </p>

      <div className="flex w-full max-w-xs gap-3">
        <button
          className={`${secondaryButtonClassName} flex-1`}
          disabled={restoring}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          还原备份
        </button>
        <button
          className={`${primaryButtonClassName} flex-1`}
          onClick={props.onNext}
          type="button"
        >
          开始配置
        </button>
        <input
          accept=".zip"
          className="hidden"
          onChange={(event) => {
            void restore(event.target.files?.[0])
          }}
          ref={fileInputRef}
          type="file"
        />
      </div>
    </div>
  )
}

function SetupSiteStep(props: {
  defaultConfigs: InitDefaultConfigs
  onNext: () => void
  onPrev: () => void
}) {
  const [title, setTitle] = useState(props.defaultConfigs.seo?.title ?? '')
  const [description, setDescription] = useState(
    props.defaultConfigs.seo?.description ?? '',
  )
  const [keywords, setKeywords] = useState<string[]>(
    props.defaultConfigs.seo?.keywords ?? [],
  )
  const [keywordInput, setKeywordInput] = useState('')
  const [urls, setUrls] = useState({
    adminUrl: `${location.origin}/qaqdmin`,
    serverUrl: `${location.origin}/api/v2`,
    webUrl: location.origin,
    wsUrl: location.origin,
  })
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = Boolean(title && description)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit || submitting) return

    setSubmitting(true)

    try {
      await Promise.all([
        patchInitConfig('seo', {
          description,
          keywords,
          title,
        }),
        patchInitConfig('url', urls),
      ])
      props.onNext()
    } catch (error) {
      toast.error(getErrorMessage(error, '保存站点配置失败'))
    } finally {
      setSubmitting(false)
    }
  }

  const addKeyword = () => {
    const value = keywordInput.trim()
    if (!value || keywords.includes(value)) return
    setKeywords((current) => [...current, value])
    setKeywordInput('')
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
      <form onSubmit={submit}>
        <div className="space-y-4">
          <TextInput
            autoComplete="organization"
            controlClassName={inputClassName}
            label="站点标题"
            labelClassName={labelClassName}
            onChange={setTitle}
            placeholder="输入站点标题"
            required
            value={title}
          />

          <TextInput
            autoComplete="off"
            controlClassName={inputClassName}
            label="站点描述"
            labelClassName={labelClassName}
            onChange={setDescription}
            placeholder="输入站点描述"
            required
            value={description}
          />

          <div>
            <label className={labelClassName}>关键字</label>
            <div className="rounded-2xl bg-white/10 p-2">
              <div className="mb-2 flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs text-white"
                    key={keyword}
                  >
                    {keyword}
                    <button
                      aria-label={`移除 ${keyword}`}
                      onClick={() =>
                        setKeywords((current) =>
                          current.filter((item) => item !== keyword),
                        )
                      }
                      type="button"
                    >
                      <X aria-hidden="true" className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <TextInput
                controlClassName="h-9 rounded-full border-0 bg-white/10 px-3 text-sm text-white placeholder:text-white/50 focus:bg-white/20 dark:border-0 dark:bg-white/10 dark:text-white"
                onChange={setKeywordInput}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addKeyword()
                  }
                }}
                placeholder="输入关键字后按 Enter"
                value={keywordInput}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <UrlInput
              label="前端地址"
              onChange={(value) =>
                setUrls((current) => ({ ...current, webUrl: value }))
              }
              value={urls.webUrl}
            />
            <UrlInput
              label="API 地址"
              onChange={(value) =>
                setUrls((current) => ({ ...current, serverUrl: value }))
              }
              value={urls.serverUrl}
            />
            <UrlInput
              label="后台地址"
              onChange={(value) =>
                setUrls((current) => ({ ...current, adminUrl: value }))
              }
              value={urls.adminUrl}
            />
            <UrlInput
              label="Gateway 地址"
              onChange={(value) =>
                setUrls((current) => ({ ...current, wsUrl: value }))
              }
              value={urls.wsUrl}
            />
          </div>
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

function SetupOwnerStep(props: { onNext: () => void; onPrev: () => void }) {
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

function SetupCompleteStep(props: { onPrev: () => void }) {
  const complete = () => {
    localStorage.setItem('to-setting', 'true')
    showConfetti()
    setTimeout(() => {
      location.reload()
    }, 200)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="mb-4 flex size-24 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
        <PartyPopper aria-hidden="true" className="size-12" />
      </div>

      <p className="mb-4 text-center text-sm text-white/80">
        所有配置已完成，点击下方按钮开始使用
      </p>

      <div className="flex gap-3">
        <button
          className={secondaryButtonClassName}
          onClick={props.onPrev}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="mr-1 size-4" />
          返回
        </button>
        <button
          className={primaryButtonClassName}
          onClick={complete}
          type="button"
        >
          LINK START
        </button>
      </div>
    </div>
  )
}

function UrlInput(props: {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}) {
  return (
    <TextInput
      autoComplete="url"
      controlClassName={inputClassName}
      label={props.label}
      labelClassName={labelClassName}
      onChange={props.onChange}
      placeholder={props.placeholder}
      type="url"
      value={props.value}
    />
  )
}

function StepActions(props: {
  canSubmit: boolean
  onPrev: () => void
  submitting: boolean
}) {
  return (
    <div className="mt-6 flex justify-between">
      <button
        className={secondaryButtonClassName}
        onClick={props.onPrev}
        type="button"
      >
        <ChevronLeft aria-hidden="true" className="mr-1 size-4" />
        返回
      </button>
      <button
        className={primaryButtonClassName}
        disabled={!props.canSubmit || props.submitting}
        type="submit"
      >
        下一步
      </button>
    </div>
  )
}

function removeEmptyStrings(data: CreateOwnerData) {
  const next: CreateOwnerData = {
    mail: data.mail,
    password: data.password,
    username: data.username,
  }

  for (const key of ['avatar', 'introduce', 'name', 'url'] as const) {
    if (data[key]) next[key] = data[key]
  }

  return next
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}
