import { Users } from 'lucide-react'

import { useI18n } from '~/i18n'

export function ReaderEmptyState() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Users
        aria-hidden="true"
        className="mb-4 size-12 text-neutral-300 dark:text-neutral-600"
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {t('readers.empty')}
      </p>
    </div>
  )
}
