import { ArrowLeft, ExternalLink, Loader2, RotateCcw } from 'lucide-react'
import { Link } from 'react-router'
import type { SearchDocumentAdminRow } from '~/api/search-index'

import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import {
  buildEditUrl,
  formatDateTime,
  formatRelativeDate,
} from '../utils/format'
import { Code } from './Code'
import { Field } from './Field'
import { RefTypeBadge } from './RefTypeBadge'
import { SmallBadge } from './SmallBadge'

export function SearchIndexDetail(props: {
  onBack: () => void
  onRebuild: () => void
  rebuilding: boolean
  row: SearchDocumentAdminRow
}) {
  const row = props.row
  const editUrl = buildEditUrl(row.refType, row.refId)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <button
          className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 lg:hidden dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
          onClick={props.onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
        </button>
        <RefTypeBadge refType={row.refType} />
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
          {row.title || <span className="text-neutral-400">(无标题)</span>}
        </h2>
      </div>

      <Scroll className="flex-1" innerClassName="px-5 py-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Field label="refId">
            <Code>{row.refId}</Code>
          </Field>
          <Field label="主语言">
            {row.lang ? <SmallBadge>{row.lang}</SmallBadge> : '默认'}
          </Field>
          <Field label="sourceHash">
            <Code title={row.sourceHash}>{row.sourceHash || '-'}</Code>
          </Field>
          <Field label="发布状态">
            <div className="flex flex-wrap items-center gap-1.5">
              {row.isPublished ? (
                <SmallBadge tone="success">已发布</SmallBadge>
              ) : (
                <SmallBadge tone="warning">未发布</SmallBadge>
              )}
              {row.hasPassword ? <SmallBadge>密码保护</SmallBadge> : null}
            </div>
          </Field>
          <Field label="标题长度">
            <span className="tabular-nums">{row.titleLength}</span>
          </Field>
          <Field label="正文长度">
            <span className="tabular-nums">{row.bodyLength}</span>
          </Field>
          <Field label="最后修改">{formatRelativeDate(row.modifiedAt)}</Field>
          <Field label="创建">{formatRelativeDate(row.createdAt)}</Field>
          {row.publicAt ? (
            <Field label="公开时间">{formatDateTime(row.publicAt)}</Field>
          ) : null}
        </div>
      </Scroll>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
        {editUrl ? (
          <Link
            className="outline-hidden inline-flex h-9 items-center justify-center gap-2 rounded border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-shallow)] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
            to={editUrl}
          >
            <ExternalLink aria-hidden="true" className="size-4" />
            查看原文
          </Link>
        ) : null}
        <Button
          disabled={props.rebuilding}
          onClick={props.onRebuild}
          type="button"
        >
          {props.rebuilding ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <RotateCcw aria-hidden="true" className="size-4" />
          )}
          重建
        </Button>
      </div>
    </div>
  )
}
