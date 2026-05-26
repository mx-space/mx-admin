import { Bookmark, BookOpen, EyeOff, Heart, MapPin } from 'lucide-react'
import type { NoteModel } from '~/models/note'
import type { NoteMetadataUpdate } from '../types/notes'

import { WEB_URL } from '~/constants/env'
import {
  ContentEntryListItem,
  ContentListStatusBadge,
} from '~/features/_shared/components/content-list-item'
import { relativeTimeFromNow } from '~/utils/time'

import { buildNotePublicPath, formatCompactNumber } from '../utils/format'
import { InlineTextEdit } from './InlineTextEdit'

export function NoteRow(props: {
  deleting: boolean
  note: NoteModel
  onDelete: (id: string) => void
  onMetadataChange: (id: string, data: NoteMetadataUpdate) => void
  onPublishChange: (id: string, isPublished: boolean) => void
  onSelectedChange: (checked: boolean) => void
  publishing: boolean
  selected: boolean
  updatingMetadata: boolean
}) {
  const note = props.note
  const isFuture = note.publicAt && +new Date(note.publicAt) - Date.now() > 0
  const publicHref = `${WEB_URL}${buildNotePublicPath(note)}`
  const title = note.title || '未命名手记'
  const editPath = `/notes/edit?id=${encodeURIComponent(note.id)}`

  return (
    <ContentEntryListItem
      checkboxLabel={`选择手记「${title}」`}
      deleteDisabled={props.deleting}
      deleteTitle="删除手记"
      editTitle="编辑手记"
      editTo={editPath}
      externalHref={publicHref}
      leading={
        <>
          <span className="shrink-0 font-mono text-xs text-neutral-400">
            #{note.nid}
          </span>
          {!note.isPublished || isFuture ? (
            <EyeOff
              aria-hidden="true"
              className="size-3.5 shrink-0 text-neutral-500 dark:text-neutral-400"
            />
          ) : null}
          {note.bookmark ? (
            <Bookmark aria-hidden="true" className="size-3.5 text-red-500" />
          ) : null}
        </>
      }
      meta={
        <>
          <InlineTextEdit
            disabled={props.updatingMetadata}
            label="心情"
            onCommit={(value) =>
              props.onMetadataChange(note.id, { mood: value || null })
            }
            placeholder="心情"
            value={note.mood ?? ''}
          />
          <InlineTextEdit
            disabled={props.updatingMetadata}
            label="天气"
            onCommit={(value) =>
              props.onMetadataChange(note.id, { weather: value || null })
            }
            placeholder="天气"
            value={note.weather ?? ''}
          />
          <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
            {note.slug || '-'}
          </span>
          {note.location ? (
            <span className="inline-flex max-w-40 items-center gap-1 truncate">
              <MapPin aria-hidden="true" className="size-3" />
              {note.location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <BookOpen aria-hidden="true" className="size-3" />
            {formatCompactNumber(note.readCount ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart aria-hidden="true" className="size-3" />
            {formatCompactNumber(note.likeCount ?? 0)}
          </span>
          <time dateTime={note.createdAt}>
            {relativeTimeFromNow(note.createdAt)}
          </time>
        </>
      }
      onDelete={() => props.onDelete(note.id)}
      onPublishToggle={() => props.onPublishChange(note.id, !note.isPublished)}
      onSelectedChange={props.onSelectedChange}
      openTitle="打开手记"
      publishDisabled={props.publishing}
      publishLabel={note.isPublished ? '下架' : '发布'}
      selected={props.selected}
      status={
        <ContentListStatusBadge active={Boolean(note.isPublished && !isFuture)}>
          {!note.isPublished ? '草稿' : isFuture ? '定时' : '已发布'}
        </ContentListStatusBadge>
      }
      title={title}
      titleTo={editPath}
    />
  )
}
