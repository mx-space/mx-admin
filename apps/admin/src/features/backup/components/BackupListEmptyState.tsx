import { Database, Upload } from 'lucide-react'

import { Button } from '~/ui/primitives/button'

export function BackupListEmptyState(props: {
  onCreate: () => void
  onRestore: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Database
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500">暂无备份</p>
      <p className="mb-4 mt-1 text-xs text-neutral-400">创建备份以保护数据</p>
      <div className="flex items-center gap-2">
        <Button onClick={props.onCreate} type="button">
          立即备份
        </Button>
        <Button onClick={props.onRestore} type="button" variant="subtle">
          <Upload aria-hidden="true" className="size-4" />
          上传恢复
        </Button>
      </div>
    </div>
  )
}
