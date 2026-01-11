import { createAuthClient } from 'better-auth/client'

import { API_URL } from '~/constants/env'

export const authClient = createAuthClient({
  baseURL: `${API_URL}/auth`,
  fetchOptions: {
    credentials: 'include',
  },
})

export type AuthSocialProviders =
  | 'apple'
  | 'discord'
  | 'facebook'
  | 'github'
  | 'google'
  | 'microsoft'
  | 'spotify'
  | 'twitch'
  | 'twitter'
  | 'dropbox'
  | 'linkedin'
  | 'gitlab'
