import { Rocket } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { restoreFromBackup } from '~/api/system'

import { primaryButtonClassName, secondaryButtonClassName } from '../constants'
import { getErrorMessage } from '../utils/setup'

export function SetupStartStep(props: { onNext: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [restoring, setRestoring] = useState(false)

  const restore = async (file: File | undefined) => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    setRestoring(true)

    try {
      await restoreFromBackup(formData)
      toast.success('恢复成功，页面将会重载')
      setTimeout(() => {
        location.reload()
      }, 1000)
    } catch (error) {
      toast.error(getErrorMessage(error, '恢复失败'))
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="mb-4 flex size-24 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
        <Rocket aria-hidden="true" className="size-12" />
      </div>

      <p className="mb-4 text-center text-sm text-white/80">
        开始全新配置，或从备份文件恢复
      </p>

      <div className="flex w-full max-w-xs gap-3">
        <button
          className={`${secondaryButtonClassName} flex-1`}
          disabled={restoring}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          还原备份
        </button>
        <button
          className={`${primaryButtonClassName} flex-1`}
          onClick={props.onNext}
          type="button"
        >
          开始配置
        </button>
        <input
          accept=".zip"
          className="hidden"
          onChange={(event) => {
            void restore(event.target.files?.[0])
          }}
          ref={fileInputRef}
          type="file"
        />
      </div>
    </div>
  )
}
