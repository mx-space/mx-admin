import type { ArticleInfo } from '~/api/ai'
import type { TranslationKey, TranslationValues } from '~/i18n/types'

type Translator = (key: TranslationKey, values?: TranslationValues) => string

export type AiSurface =
  | 'entries'
  | 'insights'
  | 'slug'
  | 'summaries'
  | 'tasks'
  | 'translations'

export type GroupedResourceItem = {
  createdAt: string
  id: string
  lang: string
  refId: string
}

export type GroupedItemAction = {
  getSuccessMessage?: (result: unknown, t: Translator) => null | string
  label: string
  run: () => Promise<unknown>
}

export type GroupedResourceGroup<TItem extends GroupedResourceItem> = {
  article: ArticleInfo
  items: TItem[]
}
