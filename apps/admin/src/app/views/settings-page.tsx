import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw, Save } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { UpdateOwnerData } from '../api/options'

import {
  getAllOptions,
  getOwner,
  getUrlOptions,
  patchOption,
  updateOwner,
} from '../api/options'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { Panel } from '../ui/panel'
import { TextArea, TextInput } from '../ui/text-field'

const settingsQueryKey = ['settings']

type SettingsTab = 'options' | 'url' | 'user'

const tabs: Array<{ label: string; value: SettingsTab }> = [
  { label: '用户', value: 'user' },
  { label: 'URL', value: 'url' },
  { label: 'Options', value: 'options' },
]

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<SettingsTab>('user')

  const ownerQuery = useQuery({
    queryFn: getOwner,
    queryKey: [...settingsQueryKey, 'owner'],
  })
  const urlQuery = useQuery({
    queryFn: getUrlOptions,
    queryKey: [...settingsQueryKey, 'url'],
  })
  const optionsQuery = useQuery({
    queryFn: getAllOptions,
    queryKey: [...settingsQueryKey, 'options'],
  })

  const refreshAll = () => {
    void ownerQuery.refetch()
    void urlQuery.refetch()
    void optionsQuery.refetch()
  }

  const invalidateSettings = async () => {
    await queryClient.invalidateQueries({ queryKey: settingsQueryKey })
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 overflow-hidden rounded border border-neutral-200 bg-white lg:grid-cols-[16rem_minmax(0,1fr)] dark:border-neutral-800 dark:bg-neutral-950">
      <aside className="border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
        <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-sm font-medium">设定</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            用户资料与系统配置。
          </p>
        </div>
        <nav className="p-2">
          {tabs.map((tab) => (
            <button
              className={cn(
                'flex w-full items-center rounded px-3 py-2 text-left text-sm transition-colors',
                activeTab === tab.value
                  ? 'bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50'
                  : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900/70',
              )}
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
              {tabs.find((tab) => tab.value === activeTab)?.label}
            </h1>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              设置面板与系统配置项。
            </p>
          </div>
          <Button
            disabled={
              ownerQuery.isFetching ||
              urlQuery.isFetching ||
              optionsQuery.isFetching
            }
            onClick={refreshAll}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn(
                'size-4',
                (ownerQuery.isFetching ||
                  urlQuery.isFetching ||
                  optionsQuery.isFetching) &&
                  'animate-spin',
              )}
            />
            刷新
          </Button>
        </div>

        {activeTab === 'user' ? (
          <OwnerSettings
            loading={ownerQuery.isLoading}
            onSaved={invalidateSettings}
            owner={ownerQuery.data}
          />
        ) : null}
        {activeTab === 'url' ? (
          <UrlSettings data={urlQuery.data} loading={urlQuery.isLoading} />
        ) : null}
        {activeTab === 'options' ? (
          <OptionsSettings
            data={optionsQuery.data}
            loading={optionsQuery.isLoading}
            onSaved={invalidateSettings}
          />
        ) : null}
      </main>
    </div>
  )
}

function OwnerSettings(props: {
  loading: boolean
  onSaved: () => Promise<void>
  owner?: UpdateOwnerData & { id?: string }
}) {
  const [form, setForm] = useState<UpdateOwnerData>({})

  useEffect(() => {
    setForm({
      avatar: props.owner?.avatar,
      introduce: props.owner?.introduce,
      mail: props.owner?.mail,
      name: props.owner?.name,
      url: props.owner?.url,
      username: props.owner?.username,
    })
  }, [props.owner])

  const mutation = useMutation({
    mutationFn: () => updateOwner(form),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存失败')),
    onSuccess: async () => {
      toast.success('用户资料已保存')
      await props.onSaved()
    },
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutation.mutate()
  }

  if (props.loading) return <SettingsSkeleton />

  return (
    <Panel description="Owner 基础资料。" title="用户">
      <form className="space-y-4 p-4" onSubmit={onSubmit}>
        <Field label="名称">
          <TextInput
            onChange={(value) =>
              setForm((current) => ({ ...current, name: value }))
            }
            value={form.name ?? ''}
          />
        </Field>
        <Field label="用户名">
          <TextInput
            onChange={(value) =>
              setForm((current) => ({ ...current, username: value }))
            }
            value={form.username ?? ''}
          />
        </Field>
        <Field label="邮箱">
          <TextInput
            onChange={(value) =>
              setForm((current) => ({ ...current, mail: value }))
            }
            value={form.mail ?? ''}
          />
        </Field>
        <Field label="站点">
          <TextInput
            onChange={(value) =>
              setForm((current) => ({ ...current, url: value }))
            }
            value={form.url ?? ''}
          />
        </Field>
        <Field label="头像">
          <TextInput
            onChange={(value) =>
              setForm((current) => ({ ...current, avatar: value }))
            }
            value={form.avatar ?? ''}
          />
        </Field>
        <Field label="介绍">
          <TextArea
            controlClassName="min-h-24"
            onChange={(introduce) =>
              setForm((current) => ({
                ...current,
                introduce,
              }))
            }
            value={form.introduce ?? ''}
          />
        </Field>
        <div className="flex justify-end">
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            保存
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function UrlSettings(props: {
  data?: {
    adminUrl: string
    serverUrl: string
    webUrl: string
    wsUrl: string
  }
  loading: boolean
}) {
  if (props.loading) return <SettingsSkeleton />

  const rows = [
    ['webUrl', props.data?.webUrl],
    ['adminUrl', props.data?.adminUrl],
    ['serverUrl', props.data?.serverUrl],
    ['wsUrl', props.data?.wsUrl],
  ]

  return (
    <Panel description="后端返回的 URL 配置摘要。" title="URL">
      <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
        {rows.map(([key, value]) => (
          <div
            className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[10rem_minmax(0,1fr)]"
            key={key}
          >
            <span className="text-neutral-500 dark:text-neutral-400">
              {key}
            </span>
            <code className="truncate rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-900">
              {value || '-'}
            </code>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function OptionsSettings(props: {
  data?: Record<string, unknown>
  loading: boolean
  onSaved: () => Promise<void>
}) {
  const keys = Object.keys(props.data ?? {})
  const [selectedKey, setSelectedKey] = useState('')
  const selectedValue = selectedKey ? props.data?.[selectedKey] : undefined
  const [json, setJson] = useState('')

  useEffect(() => {
    const firstKey = keys[0] ?? ''
    setSelectedKey((current) =>
      current && keys.includes(current) ? current : firstKey,
    )
  }, [keys.join('\n')])

  useEffect(() => {
    setJson(selectedKey ? JSON.stringify(selectedValue, null, 2) : '')
  }, [selectedKey, selectedValue])

  const mutation = useMutation({
    mutationFn: () => patchOption(selectedKey, JSON.parse(json)),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存失败')),
    onSuccess: async () => {
      toast.success('配置已保存')
      await props.onSaved()
    },
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedKey) return
    try {
      JSON.parse(json)
    } catch {
      toast.error('JSON 格式无效')
      return
    }
    mutation.mutate()
  }

  if (props.loading) return <SettingsSkeleton />

  return (
    <Panel description="按配置 key 编辑 JSON 值。" title="Options">
      <form
        className="grid min-h-[34rem] grid-cols-1 gap-0 lg:grid-cols-[16rem_minmax(0,1fr)]"
        onSubmit={onSubmit}
      >
        <div className="border-b border-neutral-200 p-2 lg:border-b-0 lg:border-r dark:border-neutral-800">
          {keys.length === 0 ? (
            <div className="p-3 text-sm text-neutral-500">暂无配置</div>
          ) : (
            keys.map((key) => (
              <button
                className={cn(
                  'block w-full truncate rounded px-3 py-2 text-left font-mono text-xs transition-colors',
                  selectedKey === key
                    ? 'bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50'
                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900/70',
                )}
                key={key}
                onClick={() => setSelectedKey(key)}
                type="button"
              >
                {key}
              </button>
            ))
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <TextArea
            controlClassName="min-h-[28rem] flex-1 resize-none rounded-none border-0 bg-transparent p-4 font-mono text-xs leading-5 focus:border-transparent focus:ring-0 dark:border-0 dark:bg-transparent"
            onChange={setJson}
            value={json}
          />
          <div className="flex justify-end border-t border-neutral-200 p-3 dark:border-neutral-800">
            <Button disabled={!selectedKey || mutation.isPending} type="submit">
              {mutation.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="size-4" />
              )}
              保存配置
            </Button>
          </div>
        </div>
      </form>
    </Panel>
  )
}

function Field(props: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm md:grid-cols-[8rem_minmax(0,1fr)] md:items-start">
      <span className="pt-2 text-neutral-500 dark:text-neutral-400">
        {props.label}
      </span>
      {props.children}
    </label>
  )
}

function SettingsSkeleton() {
  return (
    <Panel title="加载中">
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="h-9 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
            key={index}
          />
        ))}
      </div>
    </Panel>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
