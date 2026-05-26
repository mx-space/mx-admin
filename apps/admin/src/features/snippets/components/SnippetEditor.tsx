import { useMutation } from '@tanstack/react-query'
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Save,
  ScrollText,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { CreateSnippetData } from '~/api/snippets'
import type { SnippetModel } from '~/models/snippet'
import type { FormEvent } from 'react'

import { createSnippet, updateSnippet } from '~/api/snippets'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { SnippetType, SnippetTypeToLanguage } from '~/models/snippet'
import { Button } from '~/ui/primitives/button'
import { Checkbox } from '~/ui/primitives/checkbox'
import { CodeEditor } from '~/ui/primitives/code-editor'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { TextArea, TextInput } from '~/ui/primitives/text-field'
import { cn } from '~/utils/cn'

import { snippetTypes } from '../constants'
import {
  getErrorMessage,
  getSnippetDefaultsForType,
  normalizeSnippet,
  prepareSnippetPayload,
  serializeSnippetSecret,
} from '../utils/snippets'
import { Field } from './SnippetPrimitives'

export function SnippetEditor(props: {
  deleting?: boolean
  initialValue: CreateSnippetData | SnippetModel
  mode: 'create' | 'edit'
  onBack: () => void
  onDelete?: (snippet: SnippetModel) => void
  onInstallDependency?: () => void
  onOpenCompiled?: () => void
  onOpenLogs?: () => void
  onReset?: (snippet: SnippetModel) => void
  onSaved: (snippet: SnippetModel) => void
  resetting?: boolean
}) {
  const [form, setForm] = useState<CreateSnippetData>(() =>
    normalizeSnippet(props.initialValue),
  )

  useEffect(() => {
    setForm(normalizeSnippet(props.initialValue))
  }, [props.initialValue])

  const mutation = useMutation({
    mutationFn: () =>
      props.mode === 'create'
        ? createSnippet(prepareSnippetPayload(form))
        : updateSnippet(
            (props.initialValue as SnippetModel).id,
            prepareSnippetPayload(form),
          ),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存失败')),
    onSuccess: (snippet) => {
      toast.success('片段已保存')
      props.onSaved(snippet)
    },
  })

  const save = () => {
    if (!form.name.trim()) {
      toast.error('请填写片段名称')
      return
    }
    mutation.mutate()
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    save()
  }

  const editSnippet =
    props.mode === 'edit' ? (props.initialValue as SnippetModel) : null
  const isFunction = form.type === SnippetType.Function
  const isBuiltInFunction = Boolean(editSnippet?.builtIn && isFunction)
  const typeDisabled = Boolean(
    editSnippet && editSnippet.type === SnippetType.Function,
  )

  const changeType = (type: SnippetType) => {
    setForm((current) => ({
      ...current,
      ...getSnippetDefaultsForType(type, current.type, current.raw),
      type,
    }))
  }

  return (
    <form className="flex h-full min-h-0 flex-col" onSubmit={onSubmit}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Button
            aria-label="返回片段列表"
            className="h-8 px-2 lg:hidden"
            onClick={props.onBack}
            type="button"
            variant="subtle"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
              {props.mode === 'create' ? '新建片段' : form.name || '未命名片段'}
            </h2>
            <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
              {form.type} · {form.reference || 'root'}
            </p>
          </div>
        </div>
        <Scroll
          className="shrink-0"
          innerClassName="flex items-center gap-2"
          orientation="horizontal"
        >
          {isFunction && editSnippet ? (
            <>
              <Button
                className="h-8 px-2"
                onClick={props.onOpenCompiled}
                type="button"
                variant="subtle"
              >
                <FileText aria-hidden="true" className="size-4" />
                编译产物
              </Button>
              <Button
                className="h-8 px-2"
                onClick={props.onOpenLogs}
                type="button"
                variant="subtle"
              >
                <ScrollText aria-hidden="true" className="size-4" />
                调用日志
              </Button>
              <Button
                className="h-8 px-2"
                onClick={props.onInstallDependency}
                type="button"
                variant="subtle"
              >
                <Download aria-hidden="true" className="size-4" />
                安装依赖
              </Button>
            </>
          ) : null}
          {editSnippet?.builtIn && props.onReset ? (
            <Button
              className="h-8 px-2"
              disabled={props.resetting}
              onClick={() => props.onReset?.(editSnippet)}
              type="button"
              variant="subtle"
            >
              {props.resetting ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <RotateCcw aria-hidden="true" className="size-4" />
              )}
              重置
            </Button>
          ) : null}
          {editSnippet && props.onDelete ? (
            <Button
              className="h-8 border-red-200 px-2 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
              disabled={props.deleting}
              onClick={() => props.onDelete?.(editSnippet)}
              type="button"
              variant="subtle"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              删除
            </Button>
          ) : null}
          <Button
            className="h-8 px-2"
            disabled={mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            保存
          </Button>
        </Scroll>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <Scroll
          className="min-h-0 border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800"
          innerClassName="space-y-3 p-4"
        >
          <Field label="名称">
            <TextInput
              disabled={isBuiltInFunction}
              onChange={(name) => setForm((current) => ({ ...current, name }))}
              value={form.name}
            />
          </Field>
          <Field label="类型">
            <SelectField
              disabled={typeDisabled}
              onValueChange={changeType}
              options={snippetTypes.map((type) => ({
                label: type,
                value: type,
              }))}
              value={form.type}
            />
          </Field>
          <Field label="分组">
            <TextInput
              disabled={isBuiltInFunction}
              onChange={(reference) =>
                setForm((current) => ({ ...current, reference }))
              }
              value={form.reference ?? ''}
            />
          </Field>
          <Field label="注释">
            <TextInput
              onChange={(comment) =>
                setForm((current) => ({ ...current, comment }))
              }
              value={form.comment ?? ''}
            />
          </Field>
          <Field label="Metatype">
            <TextInput
              onChange={(metatype) =>
                setForm((current) => ({ ...current, metatype }))
              }
              value={form.metatype ?? ''}
            />
          </Field>
          <Checkbox
            checked={Boolean(form.private)}
            disabled={isBuiltInFunction}
            label="私有"
            onCheckedChange={(checked) =>
              setForm((current) => ({
                ...current,
                private: checked,
              }))
            }
          />
          {isFunction ? (
            <>
              <Checkbox
                checked={Boolean(form.enable)}
                disabled={isBuiltInFunction}
                label="启用函数"
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    enable: checked,
                  }))
                }
              />
              <Field label="Method">
                <TextInput
                  disabled={isBuiltInFunction}
                  onChange={(method) =>
                    setForm((current) => ({ ...current, method }))
                  }
                  value={form.method ?? ''}
                />
              </Field>
              <Field label="Path">
                <TextInput
                  onChange={(customPath) =>
                    setForm((current) => ({ ...current, customPath }))
                  }
                  value={form.customPath ?? ''}
                />
              </Field>
              <Field label="Secret">
                <TextArea
                  controlClassName="min-h-24 resize-y font-mono text-xs"
                  onChange={(secret) =>
                    setForm((current) => ({ ...current, secret }))
                  }
                  spellCheck={false}
                  value={serializeSnippetSecret(form.secret)}
                />
              </Field>
            </>
          ) : (
            <Field label="Schema">
              <TextArea
                controlClassName="min-h-24 resize-y font-mono text-xs"
                onChange={(schema) =>
                  setForm((current) => ({ ...current, schema }))
                }
                spellCheck={false}
                value={form.schema ?? ''}
              />
            </Field>
          )}
        </Scroll>

        <CodeEditor
          className="min-h-[32rem]"
          language={SnippetTypeToLanguage[form.type]}
          onChange={(raw) => setForm((current) => ({ ...current, raw }))}
          onSave={save}
          title={SnippetTypeToLanguage[form.type]}
          value={form.raw}
        />
      </div>
    </form>
  )
}
