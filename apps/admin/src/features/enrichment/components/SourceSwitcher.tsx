import type { EnrichmentProviderMeta } from '~/models/enrichment'
import type {
  CacheFilterMode,
  CaptureSortField,
  EnrichmentSource,
  SortOrder,
} from '../types/enrichment'

import { SelectField } from '~/ui/primitives/select'
import { cn } from '~/utils/cn'

import { SmallBadge } from './EnrichmentPrimitives'

export function SourceSwitcher(props: {
  onChange: (source: EnrichmentSource) => void
  value: EnrichmentSource
}) {
  const items: Array<{ label: string; value: EnrichmentSource }> = [
    { label: '缓存', value: 'cache' },
    { label: '截图', value: 'screenshots' },
    { label: '探针', value: 'probe' },
  ]

  return (
    <div className="inline-flex w-full items-center gap-1 rounded bg-neutral-100/80 p-1 dark:bg-neutral-800/60">
      {items.map((item) => (
        <button
          className={cn(
            'flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors',
            props.value === item.value
              ? 'shadow-xs bg-white text-neutral-950 ring-1 ring-black/[0.04] dark:bg-neutral-700 dark:text-neutral-50 dark:ring-white/10'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
          )}
          key={item.value}
          onClick={() => props.onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function FilterSegment(props: {
  onChange: (mode: CacheFilterMode) => void
  value: CacheFilterMode
}) {
  const items: Array<{ label: string; value: CacheFilterMode }> = [
    { label: '全部', value: 'all' },
    { label: '仅失败', value: 'failed' },
  ]

  return (
    <div className="inline-flex items-center gap-0.5 rounded border border-neutral-200 p-0.5 dark:border-neutral-800">
      {items.map((item) => (
        <button
          className={cn(
            'rounded px-2.5 py-1 text-xs transition-colors',
            props.value === item.value
              ? 'bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
          )}
          key={item.value}
          onClick={() => props.onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function CaptureControls(props: {
  onOrderChange: (order: SortOrder) => void
  onSortChange: (sort: CaptureSortField) => void
  order: SortOrder
  sort: CaptureSortField
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <SelectField
        aria-label="截图排序字段"
        onValueChange={props.onSortChange}
        options={[
          { label: '最近访问', value: 'last_accessed' },
          { label: '创建时间', value: 'created' },
          { label: '体积', value: 'bytes' },
        ]}
        value={props.sort}
      />
      <SelectField
        aria-label="截图排序方向"
        onValueChange={props.onOrderChange}
        options={[
          { label: '倒序', value: 'desc' },
          { label: '正序', value: 'asc' },
        ]}
        value={props.order}
      />
    </div>
  )
}

export function ProviderStatusBar(props: {
  providers: EnrichmentProviderMeta[]
}) {
  const ready = props.providers.filter((provider) => provider.ready).length

  return (
    <div className="flex flex-wrap gap-2">
      <SmallBadge
        tone={ready === props.providers.length ? 'success' : 'warning'}
      >
        {ready}/{props.providers.length} ready
      </SmallBadge>
      {props.providers.slice(0, 4).map((provider) => (
        <SmallBadge
          key={provider.name}
          tone={provider.ready ? 'success' : 'default'}
        >
          {provider.displayName}
        </SmallBadge>
      ))}
    </div>
  )
}
