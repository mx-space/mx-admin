import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Mail, Save, Settings } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { ConfigFormGroup, ConfigFormSchema } from '~/api/options'

import { testCommentReview } from '~/api/ai'
import { sendTestEmail } from '~/api/health'
import { getAllOptions, patchOption } from '~/api/options'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { Panel } from '~/ui/primitives/panel'
import { TextArea } from '~/ui/primitives/text-field'

import { settingsQueryKey } from '../constants'
import {
  cloneJson,
  getErrorMessage,
  isDeepEqual,
  normalizeAIConfig,
  setPathImmutable,
} from '../utils/settings'
import { AIConfigEditor } from './ai/AIConfigEditor'
import { ConfigSectionFields } from './config/ConfigSectionFields'
import { Modal, SettingsSkeleton } from './SettingsPrimitives'

export function SystemSettings(props: {
  activeGroup: ConfigFormGroup
  schema?: ConfigFormSchema
}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [configs, setConfigs] = useState<Record<string, unknown>>({})
  const [origin, setOrigin] = useState<Record<string, unknown>>({})
  const [testAiOpen, setTestAiOpen] = useState(false)
  const [testAiText, setTestAiText] = useState('')

  const optionsQuery = useQuery({
    enabled: Boolean(props.schema),
    queryFn: getAllOptions,
    queryKey: [...settingsQueryKey, 'options'],
  })

  useEffect(() => {
    if (!optionsQuery.data) return
    setConfigs(cloneJson(optionsQuery.data))
    setOrigin(cloneJson(optionsQuery.data))
  }, [optionsQuery.data])

  const dirtySections = useMemo(() => {
    const keys = new Set([...Object.keys(origin), ...Object.keys(configs)])
    return [...keys].filter((key) => !isDeepEqual(origin[key], configs[key]))
  }, [configs, origin])

  const patchMutation = useMutation({
    mutationFn: (sectionKey: string) =>
      patchOption(sectionKey, configs[sectionKey] ?? {}),
    onError: (error: unknown) =>
      toast.error(
        getErrorMessage(error, t('settings.common.error.savedFailed')),
      ),
    onSuccess: async () => {
      toast.success(t('settings.common.savedOne'))
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey })
    },
  })

  const saveAllMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        dirtySections.map((sectionKey) =>
          patchOption(sectionKey, configs[sectionKey] ?? {}),
        ),
      ),
    onError: (error: unknown) =>
      toast.error(
        getErrorMessage(error, t('settings.common.error.savedFailed')),
      ),
    onSuccess: async () => {
      toast.success(
        t('settings.common.savedAll', { count: dirtySections.length }),
      )
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey })
    },
  })

  const testEmailMutation = useMutation({
    mutationFn: sendTestEmail,
    onError: (error: unknown) =>
      toast.error(
        getErrorMessage(error, t('settings.common.error.sendTestEmailFailed')),
      ),
    onSuccess: (result) => {
      if (result.message)
        toast.error(
          t('settings.system.section.testEmailFailed', {
            message: result.message,
          }),
        )
      else toast.success(t('settings.system.section.testEmailSent'))
    },
  })

  const testAiMutation = useMutation({
    mutationFn: () => testCommentReview({ text: testAiText }),
    onError: (error: unknown) =>
      toast.error(
        getErrorMessage(error, t('settings.common.error.testAiReviewFailed')),
      ),
    onSuccess: (result) => {
      const scoreSuffix =
        result.score === undefined
          ? ''
          : t('settings.system.test.scoreSuffix', { score: result.score })
      if (result.isSpam) {
        const reasonSuffix = result.reason
          ? t('settings.system.test.reasonSuffix', { reason: result.reason })
          : ''
        toast.warning(
          t('settings.system.test.aiSpam', { scoreSuffix, reasonSuffix }),
        )
      } else {
        toast.success(t('settings.system.test.aiNormal', { scoreSuffix }))
      }
      setTestAiOpen(false)
      setTestAiText('')
    },
  })

  const updateValue = (path: string, value: unknown) => {
    setConfigs((current) => setPathImmutable(current, path, value))
  }

  if (optionsQuery.isLoading)
    return <SettingsSkeleton title={props.activeGroup.title} />

  return (
    <div className="space-y-4">
      {dirtySections.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <span>
            {t('settings.common.savingDirty', {
              count: dirtySections.length,
            })}
          </span>
          <Button
            disabled={saveAllMutation.isPending}
            onClick={() => saveAllMutation.mutate()}
            type="button"
          >
            {saveAllMutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            {t('settings.common.section.saveAll')}
          </Button>
        </div>
      ) : null}

      {props.activeGroup.sections
        .filter((section) => !section.hidden)
        .map((section) => (
          <Panel
            description={section.description}
            key={section.key}
            title={
              <span className="inline-flex items-center gap-2">
                <Settings aria-hidden="true" className="size-4" />
                {section.title}
              </span>
            }
          >
            <div className="border-b border-neutral-100 p-4 dark:border-neutral-900">
              {section.key === 'ai' ? (
                <AIConfigEditor
                  modelCacheKey={[...settingsQueryKey, 'ai-models']}
                  onChange={(value) => updateValue(section.key, value)}
                  value={normalizeAIConfig(configs[section.key])}
                />
              ) : (
                <ConfigSectionFields
                  fields={section.fields}
                  formData={configs}
                  onAction={(actionId) => {
                    if (actionId === 'test-ai-review') setTestAiOpen(true)
                    else
                      toast.warning(
                        t('settings.common.section.unknownAction', {
                          action: actionId,
                        }),
                      )
                  }}
                  prefix={section.key}
                  updateValue={updateValue}
                />
              )}
            </div>
            <div className="flex flex-wrap justify-between gap-2 p-3">
              <div>
                {section.key === 'mailOptions' ? (
                  <Button
                    disabled={testEmailMutation.isPending}
                    onClick={() => testEmailMutation.mutate()}
                    type="button"
                    variant="subtle"
                  >
                    {testEmailMutation.isPending ? (
                      <Loader2
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : (
                      <Mail aria-hidden="true" className="size-4" />
                    )}
                    {t('settings.system.section.sendTestEmail')}
                  </Button>
                ) : null}
              </div>
              <Button
                disabled={
                  patchMutation.isPending ||
                  !dirtySections.includes(section.key)
                }
                onClick={() => patchMutation.mutate(section.key)}
                type="button"
              >
                {patchMutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Save aria-hidden="true" className="size-4" />
                )}
                {t('settings.common.section.save')}
              </Button>
            </div>
          </Panel>
        ))}

      <Modal
        onClose={() => setTestAiOpen(false)}
        open={testAiOpen}
        title={t('settings.system.section.testAiModal')}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!testAiText.trim()) {
              toast.warning(t('settings.system.section.testInputRequired'))
              return
            }
            testAiMutation.mutate()
          }}
        >
          <TextArea
            controlClassName="min-h-28"
            label={t('settings.system.section.commentLabel')}
            onChange={setTestAiText}
            placeholder={t('settings.system.placeholder.testAi')}
            value={testAiText}
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setTestAiOpen(false)}
              type="button"
              variant="subtle"
            >
              {t('common.cancel')}
            </Button>
            <Button disabled={testAiMutation.isPending} type="submit">
              {t('settings.system.section.testButton')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
