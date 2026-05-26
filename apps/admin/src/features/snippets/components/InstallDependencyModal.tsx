import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { FormEvent } from 'react'

import { Button } from '~/ui/primitives/button'
import { TextArea } from '~/ui/primitives/text-field'

import { parsePackageInput } from '../utils/snippets'
import { Field, Modal } from './SnippetPrimitives'

export function InstallDependencyModal(props: {
  initialPackages: string
  onInstall: (packages: string[]) => void
  onClose: () => void
  open: boolean
}) {
  const [input, setInput] = useState(props.initialPackages)

  useEffect(() => {
    if (props.open) setInput(props.initialPackages)
  }, [props.initialPackages, props.open])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const packages = parsePackageInput(input)
    if (packages.length === 0) {
      toast.error('请输入依赖包名')
      return
    }
    props.onInstall(packages)
    props.onClose()
  }

  return (
    <Modal onClose={props.onClose} open={props.open} title="安装依赖">
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Package Name">
          <TextArea
            controlClassName="min-h-28 resize-y font-mono text-xs"
            onChange={setInput}
            placeholder="E.g. qs 或 qs@latest；多个依赖可用换行或逗号分隔"
            spellCheck={false}
            value={input}
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit">
            <Download aria-hidden="true" className="size-4" />
            安装
          </Button>
        </div>
      </form>
    </Modal>
  )
}
