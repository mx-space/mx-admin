import { useMutation } from '@tanstack/react-query'
import { Loader2, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { AiQueryType, writerGenerate } from '~/api/ai'
import { Button } from '~/ui/button'
import { SelectField } from '~/ui/select'
import { TextArea, TextInput } from '~/ui/text-field'

import { getErrorMessage } from '../utils/ai'
import { Field } from './AiPrimitives'

export function WriterGeneratePanel() {
  const [type, setType] = useState<AiQueryType>(AiQueryType.TitleSlug)
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      writerGenerate({
        text: type === AiQueryType.TitleSlug ? text : undefined,
        title: type === AiQueryType.Slug ? title : undefined,
        type,
      }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '生成失败')),
  })

  return (
    <section className="bg-white p-4 dark:bg-neutral-950">
      <h2 className="text-sm font-medium">标题与 Slug 生成</h2>
      <div className="mt-3 grid gap-3">
        <SelectField
          aria-label="标题与 Slug 生成类型"
          onValueChange={setType}
          options={[
            {
              label: '文本生成标题与 slug',
              value: AiQueryType.TitleSlug,
            },
            { label: '标题生成 slug', value: AiQueryType.Slug },
          ]}
          value={type}
        />
        {type === AiQueryType.TitleSlug ? (
          <TextArea
            controlClassName="min-h-32 focus:border-neutral-400"
            onChange={setText}
            placeholder="文章内容"
            value={text}
          />
        ) : (
          <TextInput
            controlClassName="h-9 focus:border-neutral-400"
            onChange={setTitle}
            placeholder="标题"
            value={title}
          />
        )}
        <Button
          disabled={
            mutation.isPending ||
            (type === AiQueryType.TitleSlug ? !text.trim() : !title.trim())
          }
          onClick={() => mutation.mutate()}
          type="button"
        >
          {mutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <WandSparkles aria-hidden="true" className="size-4" />
          )}
          生成
        </Button>
        {mutation.data ? (
          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            <Field label="标题">{mutation.data.title ?? '-'}</Field>
            <div className="mt-3">
              <Field label="Slug">{mutation.data.slug ?? '-'}</Field>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
