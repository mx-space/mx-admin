import { Popover } from '@base-ui/react/popover'
import { MapPin } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { callBuiltInFunction } from '../api/system'

interface IpInfo {
  cityName?: string
  countryName?: string
  ip: string
  ispDomain?: string
  ownerDomain?: string
  range?: {
    from?: string
    to?: string
  }
  regionName?: string
}

const ipInfoCache = new Map<string, IpInfo>()

export function IpInfoPopover(props: {
  className?: string
  ip: string
  trigger?: ReactNode
}) {
  const [info, setInfo] = useState<IpInfo | null>(
    () => ipInfoCache.get(props.ip) ?? null,
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadInfo = async () => {
    if (!props.ip || ipInfoCache.has(props.ip)) {
      setInfo(ipInfoCache.get(props.ip) ?? null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await callBuiltInFunction<IpInfo>('ip', { ip: props.ip })
      ipInfoCache.set(props.ip, result)
      setInfo(result)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '获取失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (open) void loadInfo()
      }}
    >
      <Popover.Trigger
        className={
          props.className ??
          'inline-flex min-w-0 items-center gap-1.5 hover:underline'
        }
        type="button"
      >
        {props.trigger ?? (
          <>
            <MapPin
              aria-hidden="true"
              className="size-3.5 shrink-0 text-neutral-400"
            />
            <span>{props.ip}</span>
          </>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="start" side="top" sideOffset={8}>
          <Popover.Popup className="outline-hidden z-50 w-72 rounded border border-neutral-200 bg-white p-3 text-xs text-neutral-600 shadow-xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
            {loading ? (
              <span className="text-neutral-400">获取中...</span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : info ? (
              <div className="grid gap-2">
                <InfoRow label="IP" value={info.ip || props.ip} />
                <InfoRow
                  label="城市"
                  value={
                    [info.countryName, info.regionName, info.cityName]
                      .filter(Boolean)
                      .join(' - ') || 'N/A'
                  }
                />
                <InfoRow label="ISP" value={info.ispDomain || 'N/A'} />
                <InfoRow label="组织" value={info.ownerDomain || 'N/A'} />
                <InfoRow
                  label="范围"
                  value={
                    info.range
                      ? [info.range.from, info.range.to]
                          .filter(Boolean)
                          .join(' - ') || 'N/A'
                      : 'N/A'
                  }
                />
              </div>
            ) : (
              <span className="text-neutral-400">暂无信息</span>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function InfoRow(props: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
      <span className="text-neutral-400">{props.label}</span>
      <span className="min-w-0 break-words text-neutral-800 dark:text-neutral-100">
        {props.value}
      </span>
    </div>
  )
}
