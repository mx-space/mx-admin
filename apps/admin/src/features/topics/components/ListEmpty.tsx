import { Inbox } from 'lucide-react'

import { Button } from '~/ui/button'

export function ListEmpty(props: { onCreate: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-4 text-center">
      <Inbox aria-hidden="true" className="size-9 text-neutral-300" />
      <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        暂无专栏
      </p>
      <Button className="mt-3" onClick={props.onCreate} type="button">
        新建专栏
      </Button>
    </div>
  )
}
