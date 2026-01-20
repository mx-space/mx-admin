import { inject, provide } from 'vue'
import type { Ref } from 'vue'

export interface OauthData {
  providers: ProvidersItem[]
  public: {
    github: Github
  }
}
interface ProvidersItem {
  type: 'github'
  enabled: boolean
}
interface Github {
  clientId: string
}

export interface FlatOauthData {
  github: Github & { enabled: boolean; type: 'github' }
}

export function flattenOauthData(data: OauthData): FlatOauthData {
  const flatData: FlatOauthData = {} as any

  for (const provider of data.providers) {
    const providerType = provider.type
    if (providerType in data.public) {
      flatData[providerType] = {
        ...data.public[providerType],
        enabled: provider.enabled,
        type: providerType,
      }
    } else {
      console.warn(
        `Provider type ${providerType} found in providers but not in public data.`,
      )
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
