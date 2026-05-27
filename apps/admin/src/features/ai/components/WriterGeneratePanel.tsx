import { useMutation } from '@tanstack/react-query'
import { Loader2, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { AiQueryType, writerGenerate } from '~/api/ai'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { SelectField } from '~/ui/primitives/select'
import { TextArea, TextInput } from '~/ui/primitives/text-field'

import { getErrorMessage } from '../utils/ai'
import { Field } from './AiPrimitives'

export function WriterGeneratePanel() {
  const { t } = useI18n()
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
      toast.error(getErrorMessage(error, t('ai.toast.writerFailed'))),
  })

  return (
    <section className="bg-white p-4 dark:bg-neutral-950">
      <h2 className="text-sm font-medium">{t('ai.writer.title')}</h2>
      <div className="mt-3 grid gap-3">
        <SelectField
          aria-label={t('ai.writer.typeAria')}
          onValueChange={setType}
          options={[
            {
              label: t('ai.writer.textToTitleSlug'),
              value: AiQueryType.TitleSlug,
            },
            { label: t('ai.writer.titleToSlug'), value: AiQueryType.Slug },
          ]}
          value={type}
        />
        {type === AiQueryType.TitleSlug ? (
          <TextArea
            controlClassName="min-h-32 focus:border-neutral-400"
            onChange={setText}
            placeholder={t('ai.writer.placeholder.text')}
            value={text}
          />
        ) : (
          <TextInput
            controlClassName="h-9 focus:border-neutral-400"
            onChange={setTitle}
            placeholder={t('ai.writer.placeholder.title')}
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
          {t('ai.action.generate')}
        </Button>
        {mutation.data ? (
          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            <Field label={t('ai.writer.fieldTitle')}>
              {mutation.data.title ?? '-'}
            </Field>
            <div className="mt-3">
              <Field label={t('ai.writer.fieldSlug')}>
                {mutation.data.slug ?? '-'}
              </Field>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
