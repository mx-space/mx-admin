import type {
  BuiltInProviderType,
  RedirectableProviderType,
} from '@auth/core/providers'
import type {
  AuthClientConfig,
  ClientSafeProvider,
  LiteralUnion,
  SignInAuthorizationParams,
  SignInOptions,
  SignInResponse,
  SignOutParams,
  SignOutResponse,
} from './client'

import { fetchData, parseUrl } from './client'

class AuthConfigManager {
  private static instance: AuthConfigManager | null = null
  _config: AuthClientConfig = {
    baseUrl:
      typeof window !== 'undefined'
        ? parseUrl(window.location.origin).origin
        : '',
    basePath:
      typeof window !== 'undefined'
        ? parseUrl(window.location.origin).path
        : '/api/auth',
    credentials: 'same-origin',
    _lastSync: 0,
    _session: undefined,
    _getSession: () => {},
  }

  static getInstance(): AuthConfigManager {
    if (!AuthConfigManager.instance) {
      AuthConfigManager.instance = new AuthConfigManager()
    }
    return AuthConfigManager.instance
  }

  setConfig(userConfig: Partial<AuthClientConfig>): void {
    this._config = { ...this._config, ...userConfig }
  }

  getConfig(): AuthClientConfig {
    return this._config
  }
}

export const authConfigManager = AuthConfigManager.getInstance()
type ProvidersType = Record<
  LiteralUnion<BuiltInProviderType>,
  ClientSafeProvider
>

export async function getProviders() {
  return fetchData<ProvidersType>('providers', authConfigManager.getConfig())
}

export async function getCsrfToken() {
  const response = await fetchData<{ csrfToken: string }>(
    'csrf',
    authConfigManager.getConfig(),
  )
  return response?.csrfToken ?? ''
}

export async function signIn<
  P extends RedirectableProviderType | undefined = undefined,
>(
  provider?: LiteralUnion<
    P extends RedirectableProviderType
      ? P | BuiltInProviderType
      : BuiltInProviderType
  >,
  options?: SignInOptions,
  authorizationParams?: SignInAuthorizationParams,
): Promise<
  P extends RedirectableProviderType ? SignInResponse | undefined : undefined
> {
  const { callbackUrl = window.location.href, redirect = true } = options ?? {}

  const __AUTHJS: AuthClientConfig = authConfigManager.getConfig()

  const href = `${__AUTHJS.baseUrl}${__AUTHJS.basePath}`

  const providers = await getProviders()

  if (!providers) {
    window.location.href = `${href}/error`
    return
  }

  if (!provider || !(provider in providers)) {
    window.location.href = `${href}/signin?${new URLSearchParams({
      callbackUrl,
    })}`
    return
  }

  const isCredentials = providers[provider].type === 'credentials'
  const isEmail = providers[provider].type === 'email'
  const isSupportingReturn = isCredentials || isEmail

  const signInUrl = `${href}/${
    isCredentials ? 'callback' : 'signin'
  }/${provider}`

  const csrfToken = await getCsrfToken()
  const res = await fetch(
    `${signInUrl}?${new URLSearchParams(authorizationParams)}`,
    {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Auth-Return-Redirect': '1',
      },
      // @ts-expect-error TODO: Fix this
      body: new URLSearchParams({ ...options, csrfToken, callbackUrl }),
      credentials: __AUTHJS.credentials,
    },
  )

  const data = await res.json()

  // TODO: Do not redirect for Credentials and Email providers by default in next major
  if (redirect || !isSupportingReturn) {
    const url = (data as any).url ?? callbackUrl
    window.location.href = url
    // If url contains a hash, the browser does not reload the page. We reload manually
    if (url.includes('#')) {
      window.location.reload()
    }
    return
  }

  const error = new URL((data as any).url).searchParams.get('error')

  if (res.ok) {
    await __AUTHJS._getSession({ event: 'storage' })
  }

  return {
    error,
    status: res.status,
    ok: res.ok,
    url: error ? null : (data as any).url,
  } as any
}

/**
 * Initiate a signout, by destroying the current session.
 * Handles CSRF protection.
 */
export async function signOut<R extends boolean = true>(
  options?: SignOutParams<R>,
): Promise<R extends true ? undefined : SignOutResponse> {
  const { callbackUrl = window.location.href } = options ?? {}
  const __AUTHJS: AuthClientConfig = authConfigManager.getConfig()
  const href = `${__AUTHJS.baseUrl}${__AUTHJS.basePath}`
  const csrfToken = await getCsrfToken()
  const res = await fetch(`${href}/signout`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Auth-Return-Redirect': '1',
    },
    body: new URLSearchParams({ csrfToken, callbackUrl }),
    credentials: __AUTHJS.credentials,
  })
  const data = await res.json()

  if (options?.redirect ?? true) {
    const url = (data as any).url ?? callbackUrl
    window.location.href = url
    // If url contains a hash, the browser does not reload the page. We reload manually
    if (url.includes('#')) {
      window.location.reload()
    }
    // @ts-expect-error TODO: Fix this
    return
  }

  await __AUTHJS._getSession({ event: 'storage' })

  return data as any
}
