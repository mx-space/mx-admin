import type { SnippetGroup } from '~/api/snippets'

import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'

export function GroupFilter(props: {
  groups: SnippetGroup[]
  loading: boolean
  onSelect: (reference: string) => void
  selectedReference: string
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        className={cn(
          'rounded px-2 py-1 text-xs transition-colors',
          props.selectedReference
            ? 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900'
            : 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-950',
        )}
        onClick={() => props.onSelect('')}
        type="button"
      >
        {t('snippets.filter.allGroups')}
      </button>
      {props.loading ? (
        <span className="px-2 py-1 text-xs text-neutral-400">
          {t('snippets.filter.loading')}
        </span>
      ) : (
        props.groups.map((group) => (
          <button
            className={cn(
              'rounded px-2 py-1 text-xs transition-colors',
              props.selectedReference === group.reference
                ? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-950'
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900',
            )}
            key={group.reference}
            onClick={() => props.onSelect(group.reference)}
            type="button"
          >
            {group.reference || 'root'}
            <span className="ml-1 opacity-70">{group.count}</span>
          </button>
        ))
      )}
    </div>
  )
}
