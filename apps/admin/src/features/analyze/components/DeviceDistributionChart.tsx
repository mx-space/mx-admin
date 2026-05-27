import { Monitor, MonitorSmartphone, Route } from 'lucide-react'
import type { DeviceDistributionResponse } from '~/api/analyze'

import { useI18n } from '~/i18n'

import { DistributionGroup } from './DistributionList'

export function DeviceDistributionChart(props: {
  data: DeviceDistributionResponse
}) {
  const { t } = useI18n()

  return (
    <div className="grid gap-4 p-4">
      <DistributionGroup
        icon={<MonitorSmartphone aria-hidden="true" className="size-3.5" />}
        items={props.data.devices}
        label={t('analyze.device.device')}
      />
      <DistributionGroup
        icon={<Monitor aria-hidden="true" className="size-3.5" />}
        items={props.data.browsers}
        label={t('analyze.device.browser')}
      />
      <DistributionGroup
        icon={<Route aria-hidden="true" className="size-3.5" />}
        items={props.data.os}
        label={t('analyze.device.os')}
      />
    </div>
  )
}
