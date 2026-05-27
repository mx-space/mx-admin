import { Code2 } from 'lucide-react'
import { useMemo } from 'react'
import type { SnippetModel } from '~/models/snippet'
import type { SelectedSnippetId } from '../types/snippets'

import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'
import { relativeTimeFromNow } from '~/utils/time'

import { groupSnippetList } from '../utils/snippets'

export function SnippetList(props: {
  onSelect: (snippet: SnippetModel) => void
  selectedId: SelectedSnippetId
  snippets: SnippetModel[]
}) {
  const groupedSnippets = useMemo(
    () => groupSnippetList(props.snippets),
    [props.snippets],
  )

  return (
    <div>
      {groupedSnippets.map((group) => (
        <div key={group.reference}>
          <div className="sticky top-0 z-10 border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            {group.reference || 'root'} · {group.snippets.length}
          </div>
          {group.snippets.map((snippet) => (
            <SnippetRow
              key={snippet.id}
              onSelect={() => props.onSelect(snippet)}
              selected={props.selectedId === snippet.id}
              snippet={snippet}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function SnippetRow(props: {
  onSelect: () => void
  selected: boolean
  snippet: SnippetModel
}) {
  const { t } = useI18n()
  return (
    <button
      className={cn(
        'flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/50',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <Code2 aria-hidden="true" className="mt-0.5 size-4 text-neutral-400" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {props.snippet.name || t('snippets.list.unnamed')}
          </h3>
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            {props.snippet.type}
          </span>
          {props.snippet.builtIn ? (
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              built-in
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span>{props.snippet.reference || 'root'}</span>
          <span>{props.snippet.private ? 'private' : 'public'}</span>
          {props.snippet.updatedAt ? (
            <time>{relativeTimeFromNow(props.snippet.updatedAt)}</time>
          ) : null}
        </div>
      </div>
    </button>
  )
}
