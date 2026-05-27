import { Play } from 'lucide-react'
import type { CronTaskDefinition } from '~/api/cron-tasks'

import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'

import { taskTypeLabelKeys } from '../constants'
import { formatNullableDate } from '../utils/cron'

export function DefinitionRow(props: {
  definition: CronTaskDefinition
  onRun: () => void
  running: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-neutral-950 dark:text-neutral-50">
          {props.definition.description ||
            t(taskTypeLabelKeys[props.definition.type])}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-900">
            {props.definition.cronExpression}
          </code>
          <span>{formatNullableDate(props.definition.nextDate, t)}</span>
        </div>
      </div>
      <Button
        aria-label={t('cron.definitions.runAria', {
          description: props.definition.description,
        })}
        disabled={props.running}
        onClick={props.onRun}
        type="button"
      >
        <Play aria-hidden="true" className="size-4" />
        {t('cron.definitions.run')}
      </Button>
    </div>
  )
}
