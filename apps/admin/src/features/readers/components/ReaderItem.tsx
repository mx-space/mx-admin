import { Crown, Mail } from 'lucide-react'
import type { ReaderWithKey } from '../types/readers'

import { useI18n } from '~/i18n'

import { ProviderIcon } from './ProviderIcon'

export function ReaderItem(props: { data: ReaderWithKey }) {
  const { t } = useI18n()
  const reader = props.data

  return (
    <article className="group flex items-center gap-4 border-b border-neutral-200 px-4 py-3 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50">
      <div className="relative shrink-0">
        <img
          alt=""
          className="size-10 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
          src={
            reader.image ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(reader.name)}&background=random`
          }
        />
        {reader.provider ? (
          <div className="shadow-xs absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-white ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
            <ProviderIcon provider={reader.provider} size={10} />
          </div>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {reader.name}
          </span>
          {reader.role === 'owner' ? (
            <span
              className="flex size-4 items-center justify-center rounded-full bg-amber-500/10 text-amber-500"
              title={t('readers.crown')}
            >
              <Crown aria-hidden="true" className="size-2.5" />
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-3">
          {reader.handle ? (
            <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="text-neutral-400">@</span>
              <span className="truncate">{reader.handle}</span>
            </span>
          ) : null}
          {reader.email ? (
            <span
              className="flex shrink-0 items-center gap-1 text-xs text-neutral-400 opacity-60 transition-opacity group-hover:opacity-100 dark:text-neutral-500"
              title={reader.email}
            >
              <Mail aria-hidden="true" className="size-3" />
              <span className="hidden sm:inline">{reader.email}</span>
            </span>
          ) : null}
        </div>
      </div>

      {reader.provider ? (
        <div className="hidden shrink-0 sm:block">
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {reader.provider}
          </span>
        </div>
      ) : null}
    </article>
  )
}
