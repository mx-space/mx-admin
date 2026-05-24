import type { RecentlyModel } from '~/app/models/recently'

import { deleteJson, getJson, postJson, putJson } from './http'

export interface RecentlyInput {
  content: string
}

export function getRecentlyList() {
  return getJson<RecentlyModel[]>('/recently/all')
}

export function createRecently(data: RecentlyInput) {
  return postJson<RecentlyModel, RecentlyInput>('/recently', data)
}

export function updateRecently(id: string, data: RecentlyInput) {
  return putJson<RecentlyModel, RecentlyInput>(`/recently/${id}`, data)
}

export function deleteRecently(id: string) {
  return deleteJson<void>(`/recently/${id}`)
}
