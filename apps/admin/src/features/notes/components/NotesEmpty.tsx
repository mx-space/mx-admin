import { BookOpen, Plus } from 'lucide-react'
import type { NoteFilter } from '../types/notes'

import { ButtonLink } from '~/ui/primitives/button'

export function NotesEmpty(props: { filter: NoteFilter; keyword: string }) {
  const isPlainEmpty = !props.keyword && props.filter === 'all'

  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
      <BookOpen
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p>
        {props.keyword
          ? '没有匹配的手记'
          : props.filter === 'bookmark'
            ? '暂无回忆项'
            : props.filter === 'unpublished'
              ? '暂无草稿项'
              : '暂无手记'}
      </p>
      {isPlainEmpty ? (
        <ButtonLink className="mt-4" to="/notes/edit" variant="subtle">
          <Plus aria-hidden="true" className="size-4" />
          创建第一条手记
        </ButtonLink>
      ) : null}
    </div>
  )
}
