import { Monitor, MonitorSmartphone, Route } from 'lucide-react'
import type { DeviceDistributionResponse } from '~/api/analyze'

import { DistributionGroup } from './DistributionList'

export function DeviceDistributionChart(props: {
  data: DeviceDistributionResponse
}) {
  return (
    <div className="grid gap-4 p-4">
      <DistributionGroup
        icon={<MonitorSmartphone aria-hidden="true" className="size-3.5" />}
        items={props.data.devices}
        label="设备"
      />
      <DistributionGroup
        icon={<Monitor aria-hidden="true" className="size-3.5" />}
        items={props.data.browsers}
        label="浏览器"
      />
      <DistributionGroup
        icon={<Route aria-hidden="true" className="size-3.5" />}
        items={props.data.os}
        label="系统"
      />
    </div>
  )
}
