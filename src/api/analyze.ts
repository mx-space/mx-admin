import type { PaginateResult } from '~/models/base'

import { request } from '~/utils/request'

export interface AnalyzeRecord {
  id: string
  ip: string
  path: string
  ua: string
  country?: string
  region?: string
  city?: string
  created: string
}

export interface IPAggregate {
  today: Array<{
    hour: string
    key: 'ip' | 'pv'
    value: number
  }>
  weeks: Array<{
    day: string
    key: 'ip' | 'pv'
    value: number
  }>
  months: Array<{
    date: string
    key: 'ip' | 'pv'
    value: number
  }>
  paths: Array<{
    count: number
    path: string
  }>
  total: {
    callTime: number
    uv: number
  }
  todayIps: string[]
}

export interface GetAnalyzeParams {
  page?: number
  size?: number
  from?: string
  to?: string
}

export interface TrafficSourceResponse {
  categories: Array<{ name: string; value: number }>
  details: Array<{ source: string; count: number }>
}

export interface DeviceDistributionResponse {
  browsers: Array<{ name: string; value: number }>
  os: Array<{ name: string; value: number }>
  devices: Array<{ name: string; value: number }>
}

export const analyzeApi = {
  // 获取分析列表
  getList: (params?: GetAnalyzeParams) =>
    request.get<PaginateResult<AnalyzeRecord>>('/analyze', { params }),

  // 获取聚合数据
  getAggregate: () => request.get<IPAggregate>('/analyze/aggregate'),

  // 获取流量来源
  getTrafficSource: (params?: { from?: string; to?: string }) =>
    request.get<TrafficSourceResponse>('/analyze/traffic-source', { params }),

  // 获取设备分布
  getDeviceDistribution: (params?: { from?: string; to?: string }) =>
    request.get<DeviceDistributionResponse>('/analyze/device', { params }),

  // 清空分析数据
  deleteAll: () => request.delete<void>('/analyze'),
}
