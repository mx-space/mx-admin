import { FileText, Plus } from 'lucide-react'

import { ButtonLink } from '~/ui/button'

export function PagesEmpty() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
      <FileText
        aria-hidden="true"
        className="mb-4 size-12 text-neutral-300 dark:text-neutral-700"
      />
      <p>暂无页面</p>
      <ButtonLink className="mt-4" to="/pages/edit" variant="subtle">
        <Plus aria-hidden="true" className="size-4" />
        创建第一个页面
      </ButtonLink>
    </div>
  )
}
