import { API_URL } from '~/app/constants/env'

import { deleteJson, patchJson } from './http'

export interface BackupFile {
  createdAt: string
  filename: string
  size: string
}

export async function getBackups() {
  return requestJson<BackupFile[]>('/backups')
}

export function createBackup() {
  return requestBlob('/backups/new')
}

export function downloadBackup(filename: string) {
  return requestBlob(`/backups/${encodeURIComponent(filename)}`)
}

export function deleteBackup(filename: string) {
  return deleteJson<void>(`/backups/${encodeURIComponent(filename)}`)
}

export function rollbackBackup(filename: string) {
  return patchJson<void, Record<string, never>>(
    `/backups/rollback/${encodeURIComponent(filename)}`,
    {},
  )
}

export async function uploadAndRestoreBackup(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/backups/rollback`, {
    body: formData,
    credentials: 'include',
    headers: {
      'x-skip-translation': '1',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(response.statusText || 'Upload restore failed')
  }
}

async function requestJson<TResponse>(path: string) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'x-skip-translation': '1',
    },
  })

  if (!response.ok) {
    throw new Error(response.statusText || 'Request failed')
  }

  const data = await response.json()
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data as TResponse
  }

  return data as TResponse
}

async function requestBlob(path: string) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'x-skip-translation': '1',
    },
  })

  if (!response.ok) {
    throw new Error(response.statusText || 'Request failed')
  }

  return response.blob()
}
