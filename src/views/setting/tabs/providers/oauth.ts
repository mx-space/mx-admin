import { inject, provide } from 'vue'
import type { Ref } from 'vue'

export type OauthProviderType = 'github' | 'google'

export interface OauthData {
  providers: ProvidersItem[]
  public: Partial<Record<OauthProviderType, ProviderPublicConfig>>
}

interface ProvidersItem {
  type: OauthProviderType
  enabled: boolean
}

interface ProviderPublicConfig {
  clientId: string
}

export type FlatOauthData = Partial<
  Record<
    OauthProviderType,
    ProviderPublicConfig & { enabled: boolean; type: OauthProviderType }
  >
>

const ALL_OAUTH_PROVIDERS: OauthProviderType[] = ['github', 'google']

export function flattenOauthData(data: OauthData): FlatOauthData {
  const flatData: FlatOauthData = {}

  const providerMap = new Map(data.providers.map((p) => [p.type, p]))

  for (const providerType of ALL_OAUTH_PROVIDERS) {
    const provider = providerMap.get(providerType)
    const publicConfig = data.public[providerType]

    flatData[providerType] = {
      clientId: publicConfig?.clientId ?? '',
      enabled: provider?.enabled ?? false,
      type: providerType,
    }
  }

  return flatData
}

export const OauthDataInjectKey = Symbol.for('OauthDataInjectKey')

export const useProvideOauthData = () => (data: Ref<FlatOauthData>) => {
  return provide(OauthDataInjectKey, data)
}

export const useInjectOauthData = () =>
  inject(OauthDataInjectKey) as Ref<FlatOauthData>
