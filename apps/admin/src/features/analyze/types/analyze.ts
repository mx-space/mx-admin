import type { getActivityList } from '~/api/activity'

export type AnalyzePeriod = 'day' | 'month' | 'week'

export type RankRange = 'day' | 'month' | 'week'

export interface TrendPoint {
  ip: number
  label: string
  pv: number
}

export interface IPInfo {
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

export type ActivityListResponseObjects = NonNullable<
  Awaited<ReturnType<typeof getActivityList>>['objects']
>
