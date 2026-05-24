import { useQuery } from '@tanstack/react-query'
import { KeyRound, Loader2 } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { UserModel } from '~/app/models/user'
import type { ReactNode } from 'react'

import { API_URL, bgUrl } from '~/app/constants/env'
import { SESSION_WITH_LOGIN } from '~/app/constants/keys'
import { authClient } from '~/app/utils/authjs/auth'

import { getJson } from '../api/http'
import { Button } from '../ui/button'
import { TextInput } from '../ui/text-field'

interface AllowLoginResponse {
  github?: boolean
  google?: boolean
  passkey: boolean
  password: boolean
}

interface InitResponse {
  isInit: boolean
}

const ownerQueryKey = ['login', 'owner'] as const
const allowLoginQueryKey = ['login', 'allow-login'] as const
const initQueryKey = ['login', 'init'] as const

export function LoginPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [passkeyAttempted, setPasskeyAttempted] = useState(false)

  const initQuery = useQuery({
    queryFn: checkIsInit,
    queryKey: initQueryKey,
    retry: false,
  })
  const ownerQuery = useQuery({
    enabled: initQuery.data !== false,
    queryFn: () => getJson<UserModel>('/owner'),
    queryKey: ownerQueryKey,
    retry: false,
  })
  const allowLoginQuery = useQuery({
    enabled: initQuery.data !== false,
    queryFn: () => getJson<AllowLoginResponse>('/owner/allow-login'),
    queryKey: allowLoginQueryKey,
    retry: false,
  })

  const owner = ownerQuery.data
  const settings = allowLoginQuery.data
  const fromPath = searchParams.get('from') || '/dashboard'
  const showPasswordInput = settings?.password !== false
  const hasAlternativeAuth =
    Boolean(settings?.passkey) ||
    Boolean(settings?.github) ||
    Boolean(settings?.google)

  const callbackURL = useMemo(() => {
    const callbackPath = searchParams.get('to') || fromPath
    return `${window.location.origin}${window.location.pathname}#${callbackPath}`
  }, [fromPath, searchParams])

  useEffect(() => {
    if (initQuery.data === false) {
      navigate('/setup-api', { replace: true })
    }
  }, [initQuery.data, navigate])

  useEffect(() => {
    const focusInput = () => inputRef.current?.focus()

    focusInput()
    document.addEventListener('keydown', focusInput)

    return () => document.removeEventListener('keydown', focusInput)
  }, [])

  useEffect(() => {
    if (passkeyAttempted || settings?.password !== false) return

    setPasskeyAttempted(true)
    void handlePasskeyLogin()
  }, [passkeyAttempted, settings?.password])

  const postSuccessfulLogin = () => {
    sessionStorage.setItem(SESSION_WITH_LOGIN, '1')
    toast.success('欢迎回来')
    navigate(fromPath, { replace: true })
  }

  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoggingIn) return

    const username = owner?.username || owner?.handle
    if (!username) {
      toast.error('主人用户名无法获取')
      return
    }

    setIsLoggingIn(true)

    try {
      const result = await authClient.signIn.username({
        password,
        username,
      })

      if (result.error) {
        toast.error(result.error.message || '登录失败')
        return
      }

      postSuccessfulLogin()
    } catch (error) {
      toast.error(readErrorMessage(error, '登录失败'))
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handlePasskeyLogin = async () => {
    try {
      const result = await authClient.signIn.passkey()

      if (result.error) {
        toast.error(result.error.message || 'Passkey 验证失败')
        return
      }

      toast.success('Passkey 验证成功')
      postSuccessfulLogin()
    } catch (error) {
      toast.error(readErrorMessage(error, 'Passkey 验证失败'))
    }
  }

  const handleSocialLogin = (provider: 'github' | 'google') => {
    void authClient.signIn.social({
      callbackURL,
      provider,
    })
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 p-4 text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(10,10,10,.42), rgba(10,10,10,.58)), url(${bgUrl})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <section className="flex w-full max-w-sm flex-col items-center">
        <div className="mb-4 size-[120px] overflow-hidden rounded-full bg-white/15 shadow-2xl ring-4 ring-white/30">
          {owner?.avatar ? (
            <img
              alt=""
              className="size-full object-cover"
              decoding="async"
              src={owner.avatar}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-3xl font-medium">
              {readInitial(owner)}
            </div>
          )}
        </div>

        <h1 className="mb-6 text-xl font-medium tracking-wide drop-shadow-lg">
          {owner?.name || owner?.username || 'Admin'}
        </h1>

        {showPasswordInput ? (
          <form className="w-full max-w-[280px]" onSubmit={handlePasswordLogin}>
            <label className="sr-only" htmlFor="password-input">
              密码
            </label>
            <div className="relative">
              <TextInput
                autoComplete="current-password"
                controlClassName="h-[38px] rounded-full border-0 bg-white/20 px-4 text-center text-sm text-white backdrop-blur-md placeholder:text-white/60 focus:bg-white/25 focus:ring-2 focus:ring-white/50 dark:border-0 dark:bg-white/20 dark:text-white"
                disabled={isLoggingIn}
                id="password-input"
                onChange={setPassword}
                placeholder="输入密码"
                ref={inputRef}
                type="password"
                value={password}
              />
              <button className="sr-only" type="submit">
                登录
              </button>
            </div>
          </form>
        ) : null}

        {hasAlternativeAuth ? (
          <div className="mt-6 flex justify-center gap-4">
            {settings?.passkey ? (
              <LoginIconButton
                label="使用 Passkey 登录"
                onClick={handlePasskeyLogin}
              >
                <KeyRound aria-hidden="true" className="size-4" />
              </LoginIconButton>
            ) : null}

            {settings?.github ? (
              <LoginIconButton
                label="使用 GitHub 登录"
                onClick={() => handleSocialLogin('github')}
              >
                <GithubIcon />
              </LoginIconButton>
            ) : null}

            {settings?.google ? (
              <LoginIconButton
                label="使用 Google 登录"
                onClick={() => handleSocialLogin('google')}
              >
                <GoogleIcon />
              </LoginIconButton>
            ) : null}
          </div>
        ) : null}

        {ownerQuery.isLoading || allowLoginQuery.isLoading ? (
          <div className="mt-6 flex items-center gap-2 text-xs text-white/70">
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            Loading authentication profile
          </div>
        ) : null}
      </section>
    </main>
  )
}

function LoginIconButton(props: {
  children: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      aria-label={props.label}
      className="size-9 rounded-full border-white/10 bg-white/15 p-0 text-white/80 backdrop-blur-sm hover:bg-white/25 hover:text-white focus-visible:ring-white/50 dark:border-white/10 dark:bg-white/15 dark:text-white/80 dark:hover:bg-white/25"
      onClick={props.onClick}
      type="button"
      variant="subtle"
    >
      {props.children}
    </Button>
  )
}

const GithubIcon = () => (
  <svg
    aria-hidden="true"
    className="size-4"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
  </svg>
)

const GoogleIcon = () => (
  <svg
    aria-hidden="true"
    className="size-4"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

async function checkIsInit() {
  const injectInit = window.injectData?.INIT
  if (typeof injectInit === 'boolean') return injectInit

  const response = await fetch(`${API_URL}/init`, {
    credentials: 'include',
    headers: {
      'x-skip-translation': '1',
    },
  })

  if (response.status === 403 || response.status === 404) return true
  if (!response.ok) return false

  try {
    const data = (await response.json()) as
      | InitResponse
      | { data?: InitResponse }
    if (isInitEnvelope(data)) return data.data?.isInit === true

    return data.isInit === true
  } catch {
    return false
  }
}

function isInitEnvelope(
  value: InitResponse | { data?: InitResponse },
): value is { data?: InitResponse } {
  return 'data' in value
}

function readInitial(owner?: UserModel) {
  return (owner?.name || owner?.username || 'A').slice(0, 1).toUpperCase()
}

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message || fallback : fallback
}
