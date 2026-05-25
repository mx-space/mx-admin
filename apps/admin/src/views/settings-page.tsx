import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  Globe,
  GripVertical,
  Key,
  ListPlus,
  Loader2,
  Lock,
  Mail,
  Plus,
  Save,
  Settings,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react'
import {
  KeyboardEvent,
  ReactNode,
  SVGProps,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type {
  CreateMetaPresetDto,
  MetaFieldOption,
  MetaFieldType,
  MetaPresetChild,
  MetaPresetField,
  MetaPresetScope,
} from '~/models/meta-preset'
import type { TokenModel } from '~/models/token'
import type {
  ConfigFormField,
  ConfigFormGroup,
  ConfigFormSchema,
  UpdateOwnerData,
} from '../api/options'

import {
  getModelList,
  getModels,
  testCommentReview,
  testConfig,
} from '../api/ai'
import {
  authAsOwner,
  createToken,
  deletePasskey,
  deleteToken,
  getToken,
  getTokens,
  listPasskeys,
} from '../api/auth'
import { uploadFile } from '../api/files'
import { sendTestEmail } from '../api/health'
import {
  createMetaPreset,
  deleteMetaPreset,
  getMetaPresets,
  updateMetaPreset,
  updateMetaPresetOrder,
} from '../api/meta-presets'
import {
  getAllOptions,
  getFormSchema,
  getOption,
  getOwner,
  patchOption,
  updateOwner,
} from '../api/options'
import { API_URL } from '../constants/env'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { IpInfoPopover } from '../ui/ip-info-popover'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { MasterDetailLayout } from '../ui/page-layout'
import { Panel } from '../ui/panel'
import { Scroll } from '../ui/scroll'
import { SelectField } from '../ui/select'
import { Switch } from '../ui/switch'
import { TextArea, TextInput } from '../ui/text-field'
import { authClient } from '../utils/authjs/auth'

const settingsQueryKey = ['settings'] as const
const metaPresetsQueryKey = ['meta-presets'] as const
const accountQueryKey = ['settings', 'account'] as const

type AIProviderType =
  | 'anthropic'
  | 'openai'
  | 'openai-compatible'
  | 'openrouter'

interface AIProviderConfig {
  apiKey: string
  defaultModel: string
  enabled: boolean
  endpoint?: string
  id: string
  name: string
  type: AIProviderType
}

interface AIModelAssignment {
  model?: string
  providerId?: string
}

interface AIConfig {
  commentReviewModel?: AIModelAssignment
  enableAutoGenerateInsightsOnCreate?: boolean
  enableAutoGenerateInsightsOnUpdate?: boolean
  enableAutoGenerateSummaryOnCreate?: boolean
  enableAutoGenerateSummaryOnUpdate?: boolean
  enableAutoGenerateTranslation?: boolean
  enableAutoTranslateInsights?: boolean
  enableInsights?: boolean
  enableSummary?: boolean
  enableTranslation?: boolean
  insightsMinTextLength?: number
  insightsModel?: AIModelAssignment
  insightsTargetLanguages?: string[]
  insightsTranslationModel?: AIModelAssignment
  providers?: AIProviderConfig[]
  summaryMinTextLength?: number
  summaryModel?: AIModelAssignment
  summaryTargetLanguages?: string[]
  translationModel?: AIModelAssignment
  translationTargetLanguages?: string[]
  writerModel?: AIModelAssignment
}

interface AIProviderModel {
  id: string
  name: string
}

const aiProviderTypeOptions: Array<{ label: string; value: AIProviderType }> = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'OpenAI Compatible', value: 'openai-compatible' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'OpenRouter', value: 'openrouter' },
]

const socialOptions = [
  { label: 'GitHub', value: 'github' },
  { label: 'Weibo', value: 'weibo' },
  { label: '网易云', value: 'netease' },
  { label: '哔哩哔哩', value: 'bilibili' },
] as const

const staticGroupsBefore: SettingsGroupSummary[] = [
  {
    description: '个人资料',
    icon: User,
    key: 'user',
    title: '用户',
    type: 'user',
  },
]

const staticGroupsAfter: SettingsGroupSummary[] = [
  {
    description: '登录、认证、凭证',
    icon: Shield,
    key: 'account',
    title: '账号安全',
    type: 'account',
  },
  {
    description: '预设模板',
    icon: ListPlus,
    key: 'meta-preset',
    title: 'Meta 预设',
    type: 'meta-preset',
  },
]

type SettingsGroupType = 'account' | 'meta-preset' | 'system' | 'user'
type OauthProviderType = 'github' | 'google'

interface OauthOptions {
  providers?: Array<{
    enabled?: boolean
    type: OauthProviderType
  }>
  public?: Partial<
    Record<
      OauthProviderType,
      {
        clientId?: string
      }
    >
  >
}

interface FlatOauthProvider {
  clientId: string
  enabled: boolean
  type: OauthProviderType
}

const oauthProviders = [
  { label: 'GitHub', type: 'github' },
  { label: 'Google', type: 'google' },
] as const satisfies Array<{ label: string; type: OauthProviderType }>

interface SettingsGroupSummary {
  description: string
  icon: typeof User
  key: string
  systemGroup?: ConfigFormGroup
  title: string
  type: SettingsGroupType
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { tab } = useParams()
  const [searchParams] = useSearchParams()
  const queryGroup = searchParams.get('group')
  const selectedGroup = tab || queryGroup || 'user'
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(() =>
    Boolean(tab || queryGroup),
  )

  const schemaQuery = useQuery({
    queryFn: getFormSchema,
    queryKey: [...settingsQueryKey, 'schema'],
  })

  const groups = useMemo(() => {
    const systemGroups =
      schemaQuery.data?.groups.map((group) => ({
        description: group.description,
        icon: getGroupIcon(group.icon),
        key: group.key,
        systemGroup: group,
        title: group.title,
        type: 'system' as const,
      })) ?? []

    return [...staticGroupsBefore, ...systemGroups, ...staticGroupsAfter]
  }, [schemaQuery.data?.groups])

  const activeGroup =
    groups.find((group) => group.key === selectedGroup) ?? groups[0]

  const selectGroup = (key: string) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('group')
    const search = nextSearchParams.toString()

    navigate({
      pathname: `/setting/${encodeURIComponent(key)}`,
      search: search ? `?${search}` : '',
    })
    setShowDetailOnMobile(true)
  }

  useEffect(() => {
    if (tab || !queryGroup) return

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('group')
    const search = nextSearchParams.toString()

    navigate(
      {
        pathname: `/setting/${encodeURIComponent(queryGroup)}`,
        search: search ? `?${search}` : '',
      },
      { replace: true },
    )
  }, [navigate, queryGroup, searchParams, tab])

  return (
    <MasterDetailLayout
      defaultSize={28}
      maxSize={36}
      minSize={22}
      showDetailOnMobile={showDetailOnMobile}
      list={
        <aside className="flex h-full min-h-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
                设置
              </h2>
            </div>
            <span className="text-xs text-neutral-400">{groups.length} 项</span>
          </div>

          <Scroll className="flex-1" innerClassName="p-2">
            <nav>
              {groups.map((group) => {
                const Icon = group.icon
                const selected = activeGroup.key === group.key

                return (
                  <button
                    className={cn(
                      'flex w-full items-center gap-3 rounded px-3 py-2 text-left transition-colors',
                      selected
                        ? 'bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50'
                        : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900/70',
                    )}
                    key={group.key}
                    onClick={() => selectGroup(group.key)}
                    type="button"
                  >
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded',
                        selected
                          ? 'bg-[var(--color-primary-shallow)] text-[var(--color-primary)]'
                          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400',
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {group.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {group.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </nav>
          </Scroll>
        </aside>
      }
      detail={
        <main className="flex h-full min-h-0 min-w-0 flex-col">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-5 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Button
                aria-label="返回设置列表"
                className="h-8 px-2 lg:hidden"
                onClick={() => setShowDetailOnMobile(false)}
                type="button"
                variant="subtle"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
                  {activeGroup.title}
                </h1>
                <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {activeGroup.description}
                </p>
              </div>
            </div>
            {schemaQuery.isFetching ? (
              <span className="inline-flex shrink-0 items-center gap-2 text-xs text-neutral-500">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                同步配置结构
              </span>
            ) : null}
          </div>

          <Scroll className="flex-1" innerClassName="p-4">
            {activeGroup.type === 'user' ? (
              <OwnerSettings
                onSaved={() =>
                  queryClient.invalidateQueries({ queryKey: settingsQueryKey })
                }
              />
            ) : null}
            {activeGroup.type === 'account' ? <AccountSettings /> : null}
            {activeGroup.type === 'meta-preset' ? <MetaPresetSettings /> : null}
            {activeGroup.type === 'system' && activeGroup.systemGroup ? (
              <SystemSettings
                activeGroup={activeGroup.systemGroup}
                schema={schemaQuery.data}
              />
            ) : null}
          </Scroll>
        </main>
      }
    />
  )
}

function OwnerSettings(props: { onSaved: () => Promise<unknown> }) {
  const [form, setForm] = useState<UpdateOwnerData>({})
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const ownerQuery = useQuery({
    queryFn: getOwner,
    queryKey: [...settingsQueryKey, 'owner'],
  })

  useEffect(() => {
    setForm({
      avatar: ownerQuery.data?.avatar,
      introduce: ownerQuery.data?.introduce,
      mail: ownerQuery.data?.mail,
      name: ownerQuery.data?.name,
      socialIds: ownerQuery.data?.socialIds,
      url: ownerQuery.data?.url,
      username: ownerQuery.data?.username,
    })
  }, [ownerQuery.data])

  const mutation = useMutation({
    mutationFn: () => updateOwner(form),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存失败')),
    onSuccess: async () => {
      toast.success('用户资料已保存')
      await props.onSaved()
    },
  })
  const avatarUploadMutation = useMutation({
    mutationFn: (file: File) => uploadFile(file, 'avatar'),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '头像上传失败')),
    onSuccess: (result) => {
      setForm((current) => ({ ...current, avatar: result.url }))
      toast.success('头像已上传')
    },
  })

  const socialEntries = Object.entries(form.socialIds ?? {})
  const usedSocialKeys = new Set(socialEntries.map(([key]) => key))
  const availableSocialOption = socialOptions.find(
    (option) => !usedSocialKeys.has(option.value),
  )

  const setField = (key: keyof UpdateOwnerData, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const updateSocial = (oldKey: string, nextKey: string, value: string) => {
    if (oldKey !== nextKey && Object.hasOwn(form.socialIds ?? {}, nextKey)) {
      toast.warning('该社交平台已存在')
      return
    }

    setForm((current) => {
      const next = { ...current.socialIds }
      if (oldKey !== nextKey) delete next[oldKey]
      next[nextKey] = value
      return { ...current, socialIds: next }
    })
  }

  const removeSocial = (key: string) => {
    setForm((current) => {
      const next = { ...current.socialIds }
      delete next[key]
      return { ...current, socialIds: next }
    })
  }

  const addSocial = () => {
    if (!availableSocialOption) return
    updateSocial(`custom-${Date.now()}`, availableSocialOption.value, '')
  }

  if (ownerQuery.isLoading) return <SettingsSkeleton title="用户" />

  return (
    <Panel description="Owner 基础资料、头像链接和社交账号。" title="用户">
      <form
        className="space-y-4 p-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <div className="flex flex-wrap items-center gap-4 border-b border-neutral-100 pb-4 dark:border-neutral-900">
          <input
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) avatarUploadMutation.mutate(file)
            }}
            ref={avatarInputRef}
            type="file"
          />
          <button
            className="group relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-lg font-semibold text-neutral-500 ring-4 ring-neutral-100 transition-all hover:ring-[var(--color-primary-shallow)] dark:bg-neutral-900 dark:ring-neutral-800"
            onClick={() => avatarInputRef.current?.click()}
            title="上传头像"
            type="button"
          >
            {form.avatar ? (
              <img
                alt=""
                className="size-full object-cover"
                src={form.avatar}
              />
            ) : (
              form.name?.slice(0, 1) || form.username?.slice(0, 1) || 'U'
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {avatarUploadMutation.isPending ? (
                <Loader2
                  aria-hidden="true"
                  className="size-5 animate-spin text-white"
                />
              ) : (
                <Camera aria-hidden="true" className="size-5 text-white" />
              )}
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
              {form.name || '未命名用户'}
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              @{form.username || 'username'}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
              {form.mail ? (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Mail
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-neutral-400"
                  />
                  <span className="truncate">{form.mail}</span>
                </span>
              ) : null}
              {ownerQuery.data?.lastLoginTime ? (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Shield
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-neutral-400"
                  />
                  <span>
                    上次登录：{formatDateTime(ownerQuery.data.lastLoginTime)}
                  </span>
                </span>
              ) : null}
              {ownerQuery.data?.lastLoginIp ? (
                <IpInfoPopover
                  className="inline-flex min-w-0 items-center gap-1.5 hover:underline"
                  ip={ownerQuery.data.lastLoginIp}
                  trigger={
                    <>
                      <Globe
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-neutral-400"
                      />
                      <span>{ownerQuery.data.lastLoginIp}</span>
                    </>
                  }
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="昵称"
            onChange={(value) => setField('name', value)}
            value={form.name ?? ''}
          />
          <TextInput
            label="用户名"
            onChange={(value) => setField('username', value)}
            value={form.username ?? ''}
          />
          <TextInput
            label="邮箱"
            onChange={(value) => setField('mail', value)}
            type="email"
            value={form.mail ?? ''}
          />
          <TextInput
            label="站点"
            onChange={(value) => setField('url', value)}
            value={form.url ?? ''}
          />
        </div>

        <TextInput
          label="头像"
          onChange={(value) => setField('avatar', value)}
          value={form.avatar ?? ''}
        />
        <TextArea
          controlClassName="min-h-24"
          label="介绍"
          onChange={(value) => setField('introduce', value)}
          value={form.introduce ?? ''}
        />

        <section className="rounded border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 dark:border-neutral-900">
            <h3 className="text-sm font-medium">社交账号</h3>
            <Button
              disabled={!availableSocialOption}
              onClick={addSocial}
              type="button"
              variant="subtle"
            >
              <Plus aria-hidden="true" className="size-4" />
              添加
            </Button>
          </div>
          <div className="space-y-2 p-3">
            {socialEntries.length === 0 ? (
              <p className="text-sm text-neutral-500">暂无社交账号。</p>
            ) : (
              socialEntries.map(([key, value]) => (
                <div
                  className="grid gap-2 md:grid-cols-[12rem_1fr_auto]"
                  key={key}
                >
                  {socialOptions.some((option) => option.value === key) ? (
                    <SelectField
                      aria-label="社交平台"
                      onValueChange={(nextKey) =>
                        updateSocial(key, nextKey, String(value))
                      }
                      options={socialOptions.filter(
                        (option) =>
                          option.value === key ||
                          !usedSocialKeys.has(option.value),
                      )}
                      value={key}
                    />
                  ) : (
                    <TextInput
                      aria-label={undefined}
                      onChange={(nextKey) =>
                        updateSocial(key, nextKey, String(value))
                      }
                      value={key}
                    />
                  )}
                  <TextInput
                    onChange={(nextValue) => updateSocial(key, key, nextValue)}
                    value={String(value)}
                  />
                  <Button
                    onClick={() => removeSocial(key)}
                    type="button"
                    variant="subtle"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>

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

function SystemSettings(props: {
  activeGroup: ConfigFormGroup
  schema?: ConfigFormSchema
}) {
  const queryClient = useQueryClient()
  const [configs, setConfigs] = useState<Record<string, unknown>>({})
  const [origin, setOrigin] = useState<Record<string, unknown>>({})
  const [testAiOpen, setTestAiOpen] = useState(false)
  const [testAiText, setTestAiText] = useState('')

  const optionsQuery = useQuery({
    enabled: Boolean(props.schema),
    queryFn: getAllOptions,
    queryKey: [...settingsQueryKey, 'options'],
  })

  useEffect(() => {
    if (!optionsQuery.data) return
    setConfigs(cloneJson(optionsQuery.data))
    setOrigin(cloneJson(optionsQuery.data))
  }, [optionsQuery.data])

  const dirtySections = useMemo(() => {
    const keys = new Set([...Object.keys(origin), ...Object.keys(configs)])
    return [...keys].filter((key) => !isDeepEqual(origin[key], configs[key]))
  }, [configs, origin])

  const patchMutation = useMutation({
    mutationFn: (sectionKey: string) =>
      patchOption(sectionKey, configs[sectionKey] ?? {}),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存失败')),
    onSuccess: async () => {
      toast.success('修改成功')
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey })
    },
  })

  const saveAllMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        dirtySections.map((sectionKey) =>
          patchOption(sectionKey, configs[sectionKey] ?? {}),
        ),
      ),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存失败')),
    onSuccess: async () => {
      toast.success(`已保存 ${dirtySections.length} 项修改`)
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey })
    },
  })

  const testEmailMutation = useMutation({
    mutationFn: sendTestEmail,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '发送测试邮件失败')),
    onSuccess: (result) => {
      if (result.message) toast.error(`发送失败: ${result.message}`)
      else toast.success('测试邮件已发送，请检查收件箱')
    },
  })

  const testAiMutation = useMutation({
    mutationFn: () => testCommentReview({ text: testAiText }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '测试 AI 审核失败')),
    onSuccess: (result) => {
      if (result.isSpam) {
        toast.warning(
          `判定为垃圾评论${result.score === undefined ? '' : `，评分 ${result.score}`}${result.reason ? `：${result.reason}` : ''}`,
        )
      } else {
        toast.success(
          `判定为正常评论${result.score === undefined ? '' : `，评分 ${result.score}`}`,
        )
      }
      setTestAiOpen(false)
      setTestAiText('')
    },
  })

  const updateValue = (path: string, value: unknown) => {
    setConfigs((current) => setPathImmutable(current, path, value))
  }

  if (optionsQuery.isLoading)
    return <SettingsSkeleton title={props.activeGroup.title} />

  return (
    <div className="space-y-4">
      {dirtySections.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <span>你有 {dirtySections.length} 项未保存的修改。</span>
          <Button
            disabled={saveAllMutation.isPending}
            onClick={() => saveAllMutation.mutate()}
            type="button"
          >
            {saveAllMutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            保存全部
          </Button>
        </div>
      ) : null}

      {props.activeGroup.sections
        .filter((section) => !section.hidden)
        .map((section) => (
          <Panel
            description={section.description}
            key={section.key}
            title={
              <span className="inline-flex items-center gap-2">
                <Settings aria-hidden="true" className="size-4" />
                {section.title}
              </span>
            }
          >
            <div className="border-b border-neutral-100 p-4 dark:border-neutral-900">
              {section.key === 'ai' ? (
                <AIConfigEditor
                  modelCacheKey={[...settingsQueryKey, 'ai-models']}
                  onChange={(value) => updateValue(section.key, value)}
                  value={normalizeAIConfig(configs[section.key])}
                />
              ) : (
                <ConfigSectionFields
                  fields={section.fields}
                  formData={configs}
                  onAction={(actionId) => {
                    if (actionId === 'test-ai-review') setTestAiOpen(true)
                    else toast.warning(`未知操作：${actionId}`)
                  }}
                  prefix={section.key}
                  updateValue={updateValue}
                />
              )}
            </div>
            <div className="flex flex-wrap justify-between gap-2 p-3">
              <div>
                {section.key === 'mailOptions' ? (
                  <Button
                    disabled={testEmailMutation.isPending}
                    onClick={() => testEmailMutation.mutate()}
                    type="button"
                    variant="subtle"
                  >
                    {testEmailMutation.isPending ? (
                      <Loader2
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : (
                      <Mail aria-hidden="true" className="size-4" />
                    )}
                    发送测试邮件
                  </Button>
                ) : null}
              </div>
              <Button
                disabled={
                  patchMutation.isPending ||
                  !dirtySections.includes(section.key)
                }
                onClick={() => patchMutation.mutate(section.key)}
                type="button"
              >
                {patchMutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Save aria-hidden="true" className="size-4" />
                )}
                保存本节
              </Button>
            </div>
          </Panel>
        ))}

      <Modal
        onClose={() => setTestAiOpen(false)}
        open={testAiOpen}
        title="测试 AI 审核"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!testAiText.trim()) {
              toast.warning('请输入测试内容')
              return
            }
            testAiMutation.mutate()
          }}
        >
          <TextArea
            controlClassName="min-h-28"
            label="评论内容"
            onChange={setTestAiText}
            placeholder="输入要测试的评论内容..."
            value={testAiText}
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setTestAiOpen(false)}
              type="button"
              variant="subtle"
            >
              取消
            </Button>
            <Button disabled={testAiMutation.isPending} type="submit">
              测试
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function AIConfigEditor(props: {
  modelCacheKey: readonly unknown[]
  onChange: (value: AIConfig) => void
  value: AIConfig
}) {
  const queryClient = useQueryClient()
  const [loadingProviderId, setLoadingProviderId] = useState<string | null>(
    null,
  )
  const [testingProviderId, setTestingProviderId] = useState<string | null>(
    null,
  )
  const hasEnabledProvider = (props.value.providers ?? []).some(
    (provider) => provider.enabled,
  )
  const modelsQuery = useQuery({
    enabled: hasEnabledProvider,
    queryFn: async () => {
      const response = await getModels()
      return response.reduce<Record<string, AIProviderModel[]>>(
        (result, provider) => ({
          ...result,
          [provider.providerId]: provider.models ?? [],
        }),
        {},
      )
    },
    queryKey: props.modelCacheKey,
    staleTime: 24 * 60 * 60 * 1000,
  })
  const providerModels = modelsQuery.data ?? {}
  const providers = props.value.providers ?? []

  const updateConfig = (patch: Partial<AIConfig>) =>
    props.onChange({ ...props.value, ...patch })

  const updateProvider = (id: string, patch: Partial<AIProviderConfig>) => {
    updateConfig({
      providers: providers.map((provider) =>
        provider.id === id ? { ...provider, ...patch } : provider,
      ),
    })
  }

  const addProvider = () => {
    const type: AIProviderType = 'openai'
    const provider: AIProviderConfig = {
      apiKey: '',
      defaultModel: getDefaultAIModel(type),
      enabled: true,
      id: crypto.randomUUID(),
      name: '',
      type,
    }

    updateConfig({ providers: [...providers, provider] })
  }

  const deleteProvider = (id: string) => {
    updateConfig({
      providers: providers.filter((provider) => provider.id !== id),
    })
  }

  const refreshModels = async (provider: AIProviderConfig) => {
    setLoadingProviderId(provider.id)
    try {
      const response = await getModelList({
        apiKey: provider.apiKey || undefined,
        endpoint: provider.endpoint || undefined,
        providerId: provider.id,
        type: provider.type,
      })
      queryClient.setQueryData<Record<string, AIProviderModel[]>>(
        props.modelCacheKey,
        (current) => ({ ...current, [provider.id]: response.models ?? [] }),
      )
      if (response.error) toast.warning(`获取模型列表：${response.error}`)
      else toast.success('模型列表已更新')
    } catch (error) {
      toast.error(getErrorMessage(error, '获取模型列表失败'))
    } finally {
      setLoadingProviderId(null)
    }
  }

  const testProvider = async (provider: AIProviderConfig) => {
    if (!provider.defaultModel.trim()) {
      toast.warning('请先填写默认模型')
      return
    }

    setTestingProviderId(provider.id)
    try {
      await testConfig({
        apiKey: provider.apiKey || undefined,
        endpoint: provider.endpoint || undefined,
        model: provider.defaultModel,
        providerId: provider.id,
        type: provider.type,
      })
      toast.success('连接可用')
    } catch (error) {
      toast.error(getErrorMessage(error, '连接测试失败'))
    } finally {
      setTestingProviderId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">AI 服务商</h3>
            <p className="mt-1 text-xs text-neutral-500">
              配置 AI 服务提供商、密钥、Endpoint 与默认模型。
            </p>
          </div>
          <Button onClick={addProvider} type="button" variant="subtle">
            <Plus aria-hidden="true" className="size-4" />
            添加服务商
          </Button>
        </div>
        {providers.length === 0 ? (
          <EmptyState
            icon={<Settings className="size-7" />}
            label="暂无服务商"
          />
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => {
              const modelListId = `ai-models-${provider.id}`
              const models = providerModels[provider.id] ?? []
              const showEndpoint =
                provider.type === 'openai' ||
                provider.type === 'openai-compatible' ||
                provider.type === 'openrouter'

              return (
                <div
                  className="rounded border border-neutral-200 p-3 dark:border-neutral-800"
                  key={provider.id}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {formatAIProviderLabel(provider)}
                      </div>
                      <div className="mt-1 truncate text-xs text-neutral-500">
                        {provider.defaultModel || '未设置模型'}
                      </div>
                    </div>
                    <Switch
                      checked={provider.enabled}
                      className="border-0 px-0 py-0"
                      label="启用"
                      onCheckedChange={(enabled) =>
                        updateProvider(provider.id, { enabled })
                      }
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FieldShell label="服务类型">
                      <SelectField<AIProviderType>
                        aria-label="服务类型"
                        onValueChange={(type) =>
                          updateProvider(provider.id, {
                            defaultModel: getDefaultAIModel(type),
                            type,
                          })
                        }
                        options={aiProviderTypeOptions}
                        value={provider.type}
                      />
                    </FieldShell>
                    <TextInput
                      label="显示名称"
                      onChange={(name) => updateProvider(provider.id, { name })}
                      placeholder={getAIProviderNamePlaceholder(provider.type)}
                      value={provider.name}
                    />
                    <TextInput
                      label="API Key"
                      onChange={(apiKey) =>
                        updateProvider(provider.id, { apiKey })
                      }
                      placeholder={getAIProviderKeyPlaceholder(provider.type)}
                      type="password"
                      value={provider.apiKey}
                    />
                    {showEndpoint ? (
                      <TextInput
                        label="Endpoint"
                        onChange={(endpoint) =>
                          updateProvider(provider.id, { endpoint })
                        }
                        placeholder={
                          provider.type === 'openai-compatible'
                            ? '必填，如 https://api.deepseek.com'
                            : '可选，留空使用默认'
                        }
                        value={provider.endpoint ?? ''}
                      />
                    ) : null}
                    <TextInput
                      label="默认模型"
                      list={modelListId}
                      onChange={(defaultModel) =>
                        updateProvider(provider.id, { defaultModel })
                      }
                      placeholder={getAIProviderModelPlaceholder(provider.type)}
                      value={provider.defaultModel}
                    />
                    <datalist id={modelListId}>
                      {models.map((model) => (
                        <option
                          key={model.id}
                          label={model.name || model.id}
                          value={model.id}
                        />
                      ))}
                    </datalist>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button
                      disabled={loadingProviderId === provider.id}
                      onClick={() => void refreshModels(provider)}
                      type="button"
                      variant="subtle"
                    >
                      {loadingProviderId === provider.id ? (
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                      ) : null}
                      获取模型
                    </Button>
                    <Button
                      disabled={testingProviderId === provider.id}
                      onClick={() => void testProvider(provider)}
                      type="button"
                      variant="subtle"
                    >
                      {testingProviderId === provider.id ? (
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                      ) : null}
                      测试连接
                    </Button>
                    <Button
                      onClick={() => {
                        if (window.confirm('确认删除此 Provider？')) {
                          deleteProvider(provider.id)
                        }
                      }}
                      type="button"
                      variant="subtle"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      删除
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">模型分配</h3>
        <div className="grid gap-3">
          <AIModelAssignmentField
            description="用于生成文章摘要的模型。"
            label="摘要功能"
            models={providerModels}
            onChange={(summaryModel) => updateConfig({ summaryModel })}
            providers={providers}
            value={props.value.summaryModel}
          />
          <AIModelAssignmentField
            description="用于生成标题、Slug 等的模型。"
            label="写作助手"
            models={providerModels}
            onChange={(writerModel) => updateConfig({ writerModel })}
            providers={providers}
            value={props.value.writerModel}
          />
          <AIModelAssignmentField
            description="用于审核评论的模型。"
            label="评论审核"
            models={providerModels}
            onChange={(commentReviewModel) =>
              updateConfig({ commentReviewModel })
            }
            providers={providers}
            value={props.value.commentReviewModel}
          />
          <AIModelAssignmentField
            description="用于生成文章翻译的模型。"
            label="翻译功能"
            models={providerModels}
            onChange={(translationModel) => updateConfig({ translationModel })}
            providers={providers}
            value={props.value.translationModel}
          />
          <AIModelAssignmentField
            description="用于生成长篇精读的模型。"
            label="精读生成"
            models={providerModels}
            onChange={(insightsModel) => updateConfig({ insightsModel })}
            providers={providers}
            value={props.value.insightsModel}
          />
          <AIModelAssignmentField
            description="用于翻译精读；留空则复用翻译模型。"
            label="精读翻译"
            models={providerModels}
            onChange={(insightsTranslationModel) =>
              updateConfig({ insightsTranslationModel })
            }
            providers={providers}
            value={props.value.insightsTranslationModel}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">功能开关</h3>
        <div className="grid gap-4">
          <Switch
            checked={Boolean(props.value.enableSummary)}
            label="启用 AI 摘要"
            onCheckedChange={(enableSummary) => updateConfig({ enableSummary })}
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateSummaryOnCreate)}
            disabled={!props.value.enableSummary}
            label="文章创建时自动生成摘要"
            onCheckedChange={(enableAutoGenerateSummaryOnCreate) =>
              updateConfig({ enableAutoGenerateSummaryOnCreate })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateSummaryOnUpdate)}
            disabled={!props.value.enableSummary}
            label="文章更新时重新生成摘要"
            onCheckedChange={(enableAutoGenerateSummaryOnUpdate) =>
              updateConfig({ enableAutoGenerateSummaryOnUpdate })
            }
          />
          <AITextListField
            disabled={!props.value.enableSummary}
            label="摘要目标语言"
            onChange={(summaryTargetLanguages) =>
              updateConfig({ summaryTargetLanguages })
            }
            value={props.value.summaryTargetLanguages ?? []}
          />
          <TextInput
            disabled={!props.value.enableSummary}
            inputMode="numeric"
            label="摘要自动生成最小文本长度"
            onChange={(value) =>
              updateConfig({
                summaryMinTextLength: value.trim() ? Number(value) : 0,
              })
            }
            type="number"
            value={String(props.value.summaryMinTextLength ?? 0)}
          />
          <Switch
            checked={Boolean(props.value.enableInsights)}
            label="启用 AI 精读"
            onCheckedChange={(enableInsights) =>
              updateConfig({ enableInsights })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateInsightsOnCreate)}
            disabled={!props.value.enableInsights}
            label="文章创建时自动生成精读"
            onCheckedChange={(enableAutoGenerateInsightsOnCreate) =>
              updateConfig({ enableAutoGenerateInsightsOnCreate })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateInsightsOnUpdate)}
            disabled={!props.value.enableInsights}
            label="文章更新时重新生成精读"
            onCheckedChange={(enableAutoGenerateInsightsOnUpdate) =>
              updateConfig({ enableAutoGenerateInsightsOnUpdate })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoTranslateInsights)}
            disabled={!props.value.enableInsights}
            label="自动翻译精读"
            onCheckedChange={(enableAutoTranslateInsights) =>
              updateConfig({ enableAutoTranslateInsights })
            }
          />
          <AITextListField
            disabled={!props.value.enableInsights}
            label="精读目标语言"
            onChange={(insightsTargetLanguages) =>
              updateConfig({ insightsTargetLanguages })
            }
            value={props.value.insightsTargetLanguages ?? []}
          />
          <TextInput
            disabled={!props.value.enableInsights}
            inputMode="numeric"
            label="精读自动生成最小文本长度"
            onChange={(value) =>
              updateConfig({
                insightsMinTextLength: value.trim() ? Number(value) : 0,
              })
            }
            type="number"
            value={String(props.value.insightsMinTextLength ?? 0)}
          />
          <Switch
            checked={Boolean(props.value.enableTranslation)}
            label="启用 AI 翻译"
            onCheckedChange={(enableTranslation) =>
              updateConfig({ enableTranslation })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateTranslation)}
            disabled={!props.value.enableTranslation}
            label="自动生成翻译"
            onCheckedChange={(enableAutoGenerateTranslation) =>
              updateConfig({ enableAutoGenerateTranslation })
            }
          />
          <AITextListField
            disabled={!props.value.enableTranslation}
            label="翻译目标语言"
            onChange={(translationTargetLanguages) =>
              updateConfig({ translationTargetLanguages })
            }
            value={props.value.translationTargetLanguages ?? []}
          />
        </div>
      </section>
    </div>
  )
}

function AIModelAssignmentField(props: {
  description: string
  label: string
  models: Record<string, AIProviderModel[]>
  onChange: (value: AIModelAssignment | undefined) => void
  providers: AIProviderConfig[]
  value?: AIModelAssignment
}) {
  const modelListId = `assignment-models-${props.label}`
  const providerId = props.value?.providerId ?? ''
  const providerModels = providerId ? (props.models[providerId] ?? []) : []

  return (
    <div className="grid gap-2 rounded border border-neutral-100 p-3 text-sm md:grid-cols-[12rem_minmax(0,1fr)] dark:border-neutral-900">
      <div>
        <div className="font-medium text-neutral-700 dark:text-neutral-300">
          {props.label}
        </div>
        <p className="mt-1 text-xs text-neutral-500">{props.description}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <SelectField<string>
          aria-label={`${props.label}服务商`}
          onValueChange={(nextProviderId) =>
            props.onChange(
              nextProviderId
                ? { providerId: nextProviderId, model: undefined }
                : undefined,
            )
          }
          options={[
            { label: '不指定', value: '' },
            ...props.providers.map((provider) => ({
              label: formatAIProviderLabel(provider),
              value: provider.id,
            })),
          ]}
          value={providerId}
        />
        <TextInput
          disabled={!providerId}
          list={modelListId}
          onChange={(model) =>
            props.onChange(providerId ? { providerId, model } : undefined)
          }
          placeholder="使用 Provider 默认模型"
          value={props.value?.model ?? ''}
        />
        <datalist id={modelListId}>
          {providerModels.map((model) => (
            <option
              key={model.id}
              label={model.name || model.id}
              value={model.id}
            />
          ))}
        </datalist>
      </div>
    </div>
  )
}

function AITextListField(props: {
  disabled?: boolean
  label: string
  onChange: (value: string[]) => void
  value: string[]
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = draft.trim().toLowerCase()
    if (!value || props.disabled) return
    if (value.length !== 2) {
      toast.warning('请使用 ISO 639-1 语言代码（2 个字母）')
      return
    }
    if (props.value.includes(value)) {
      toast.warning(`语言 ${value} 已存在`)
      return
    }
    props.onChange([...props.value, value])
    setDraft('')
  }

  return (
    <FieldShell label={props.label}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <TextInput
            className="min-w-0 flex-1"
            disabled={props.disabled}
            maxLength={2}
            onChange={setDraft}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                add()
              }
            }}
            placeholder="如 en, ja, ko"
            value={draft}
          />
          <Button
            disabled={props.disabled || !draft.trim()}
            onClick={add}
            type="button"
            variant="subtle"
          >
            添加
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {props.value.map((item) => (
            <button
              className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-900 dark:text-neutral-300"
              disabled={props.disabled}
              key={item}
              onClick={() =>
                props.onChange(props.value.filter((value) => value !== item))
              }
              type="button"
            >
              {item.toUpperCase()}
              <X aria-hidden="true" className="ml-1 inline size-3" />
            </button>
          ))}
        </div>
      </div>
    </FieldShell>
  )
}

function ConfigSectionFields(props: {
  fields: ConfigFormField[]
  formData: Record<string, unknown>
  onAction: (actionId: string) => void
  prefix: string
  updateValue: (path: string, value: unknown) => void
}) {
  return (
    <div className="space-y-4">
      {props.fields
        .filter((field) => !field.ui.hidden)
        .filter((field) => shouldShowField(field, props.formData, props.prefix))
        .map((field) => {
          const fieldPath = `${props.prefix}.${field.key}`

          if (field.fields?.length) {
            return (
              <section
                className="rounded border border-neutral-100 p-3 dark:border-neutral-900"
                key={fieldPath}
              >
                {field.subsection ? (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold uppercase text-neutral-500">
                      {field.subsection.title}
                    </h4>
                    {field.subsection.description ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        {field.subsection.description}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <ConfigSectionFields
                  fields={field.fields}
                  formData={props.formData}
                  onAction={props.onAction}
                  prefix={fieldPath}
                  updateValue={props.updateValue}
                />
              </section>
            )
          }

          return (
            <ConfigFieldEditor
              field={field}
              key={fieldPath}
              onAction={props.onAction}
              onChange={(value) => props.updateValue(fieldPath, value)}
              value={getPath(props.formData, fieldPath)}
            />
          )
        })}
    </div>
  )
}

function ConfigFieldEditor(props: {
  field: ConfigFormField
  onAction: (actionId: string) => void
  onChange: (value: unknown) => void
  value: unknown
}) {
  const { field } = props
  const description = field.description ? (
    <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
      {field.description}
    </p>
  ) : null

  const label = (
    <span>
      {field.title}
      {field.required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </span>
  )

  if (field.ui.component === 'switch') {
    return (
      <Switch
        checked={Boolean(props.value)}
        description={description}
        label={label}
        onCheckedChange={props.onChange}
      />
    )
  }

  return (
    <label className="grid gap-2 text-sm md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
      <span className="pt-2 text-neutral-600 dark:text-neutral-300">
        {label}
        {description}
      </span>
      {renderConfigControl(props)}
    </label>
  )
}

function renderConfigControl(props: {
  field: ConfigFormField
  onAction: (actionId: string) => void
  onChange: (value: unknown) => void
  value: unknown
}) {
  const { field } = props
  const placeholder = field.ui.placeholder

  switch (field.ui.component) {
    case 'password':
      return (
        <TextInput
          onChange={props.onChange as (value: string) => void}
          placeholder={placeholder}
          type="password"
          value={stringValue(props.value)}
        />
      )
    case 'textarea':
      return (
        <TextArea
          controlClassName="min-h-24"
          onChange={props.onChange as (value: string) => void}
          placeholder={placeholder}
          value={stringValue(props.value)}
        />
      )
    case 'number':
      return (
        <TextInput
          inputMode="decimal"
          onChange={(value) =>
            props.onChange(value.trim() ? Number(value) : undefined)
          }
          placeholder={placeholder}
          type="number"
          value={
            typeof props.value === 'number'
              ? String(props.value)
              : stringValue(props.value)
          }
        />
      )
    case 'select':
      return (
        <SelectField<number | string>
          aria-label={field.title}
          onValueChange={props.onChange}
          options={field.ui.options ?? []}
          value={
            typeof props.value === 'number' || typeof props.value === 'string'
              ? props.value
              : (field.ui.options?.[0]?.value ?? '')
          }
        />
      )
    case 'tags':
      return (
        <TagsEditor
          onChange={props.onChange}
          value={Array.isArray(props.value) ? props.value.map(String) : []}
        />
      )
    case 'action':
      return (
        <div>
          <Button
            onClick={() => {
              if (field.ui.actionId) props.onAction(field.ui.actionId)
            }}
            type="button"
            variant="subtle"
          >
            {field.ui.actionLabel || field.title}
          </Button>
        </div>
      )
    case 'input':
    default:
      return (
        <TextInput
          onChange={props.onChange as (value: string) => void}
          placeholder={placeholder}
          value={stringValue(props.value)}
        />
      )
  }
}

function AccountSettings() {
  const [activePanel, setActivePanel] = useState<'passkeys' | 'tokens' | null>(
    null,
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const validateProvider = searchParams.get(
    'validate',
  ) as OauthProviderType | null

  const authAsOwnerMutation = useMutation({
    mutationFn: authAsOwner,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '设定主人账户失败')),
    onSuccess: async () => {
      toast.success('已设定为主人账户')
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  useEffect(() => {
    if (!validateProvider) return

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('validate')
        return next
      },
      { replace: true },
    )

    void authClient.getSession().then((result) => {
      if (result.error || !result.data) {
        toast.error('OAuth 验证失败')
        return
      }

      toast.success('OAuth 验证成功')
      if (window.confirm('设定为主人账户？')) {
        authAsOwnerMutation.mutate()
      }
    })
  }, [authAsOwnerMutation, setSearchParams, validateProvider])

  return (
    <div className="grid min-h-[34rem] grid-cols-1 overflow-hidden border border-neutral-200 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)] dark:border-neutral-800">
      <div className="min-w-0 border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
        <div className="space-y-4 p-4">
          <SessionSection />
          <PasswordSection />
          <AccountEntry
            active={activePanel === 'tokens'}
            description="用于 API 调用的访问令牌。"
            icon={<Key aria-hidden="true" className="size-4" />}
            onClick={() =>
              setActivePanel((current) =>
                current === 'tokens' ? null : 'tokens',
              )
            }
            title="API Token"
          />
          <AccountEntry
            active={activePanel === 'passkeys'}
            description="浏览器和设备上的无密码登录凭证。"
            icon={<Fingerprint aria-hidden="true" className="size-4" />}
            onClick={() =>
              setActivePanel((current) =>
                current === 'passkeys' ? null : 'passkeys',
              )
            }
            title="Passkey"
          />
          <OauthSection />
        </div>
      </div>
      <div className="min-w-0 bg-neutral-50 dark:bg-neutral-950">
        {activePanel === 'tokens' ? (
          <TokenPanel onBack={() => setActivePanel(null)} />
        ) : activePanel === 'passkeys' ? (
          <PasskeyPanel onBack={() => setActivePanel(null)} />
        ) : (
          <div className="flex h-full min-h-72 flex-col items-center justify-center px-4 text-center">
            <Shield aria-hidden="true" className="size-8 text-neutral-300" />
            <p className="mt-3 text-sm text-neutral-500">
              选择一个安全项查看详情。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function AccountEntry(props: {
  active: boolean
  description: string
  icon: ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center justify-between rounded border border-neutral-200 px-4 py-3 text-left transition-colors dark:border-neutral-800',
        props.active
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onClick}
      type="button"
    >
      <span className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded bg-neutral-100 text-neutral-500 dark:bg-neutral-900">
          {props.icon}
        </span>
        <span>
          <span className="block text-sm font-medium">{props.title}</span>
          <span className="mt-0.5 block text-xs text-neutral-500">
            {props.description}
          </span>
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className={cn('size-4 text-neutral-400', props.active && 'rotate-90')}
      />
    </button>
  )
}

function OauthSection() {
  const queryClient = useQueryClient()
  const oauthQuery = useQuery({
    queryFn: () => getOption<OauthOptions>('oauth'),
    queryKey: [...accountQueryKey, 'oauth'],
  })

  const saveMutation = useMutation({
    mutationFn: (payload: {
      clientId: string
      clientSecret: string
      enabled: boolean
      type: OauthProviderType
    }) =>
      patchOption('oauth', {
        providers: [{ enabled: payload.enabled, type: payload.type }],
        public: {
          [payload.type]: {
            clientId: payload.clientId,
          },
        },
        secrets: {
          [payload.type]: {
            clientSecret: payload.clientSecret,
          },
        },
      }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存 OAuth 配置失败')),
    onSuccess: async () => {
      toast.success('OAuth 配置已保存')
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const oauthData = useMemo(
    () => flattenOauthOptions(oauthQuery.data),
    [oauthQuery.data],
  )

  return (
    <Panel
      description="配置第三方账号登录方式。"
      title={
        <span className="inline-flex items-center gap-2">
          <GitHubIcon aria-hidden="true" className="size-4" />
          OAuth 登录
        </span>
      }
    >
      {oauthQuery.isLoading ? (
        <div className="p-4 text-sm text-neutral-500">加载中...</div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
          {oauthProviders.map((provider) => (
            <OauthProviderSection
              data={oauthData[provider.type]}
              key={provider.type}
              label={provider.label}
              onSave={(payload) => saveMutation.mutate(payload)}
              saving={saveMutation.isPending}
              type={provider.type}
            />
          ))}
        </div>
      )}
    </Panel>
  )
}

function OauthProviderSection(props: {
  data: FlatOauthProvider
  label: string
  onSave: (payload: {
    clientId: string
    clientSecret: string
    enabled: boolean
    type: OauthProviderType
  }) => void
  saving: boolean
  type: OauthProviderType
}) {
  const [enabled, setEnabled] = useState(props.data.enabled)
  const [clientId, setClientId] = useState(props.data.clientId)
  const [clientSecret, setClientSecret] = useState('')
  const callbackUrl = `${API_URL}/auth/callback/${props.type}`

  useEffect(() => {
    setEnabled(props.data.enabled)
    setClientId(props.data.clientId)
    setClientSecret('')
  }, [props.data])

  const validate = () => {
    const callback = new URL(location.href)
    callback.searchParams.set('validate', props.type)
    void authClient.signIn.social({
      callbackURL: callback.toString(),
      provider: props.type,
    })
  }

  const Icon = props.type === 'github' ? GitHubIcon : GoogleIcon

  return (
    <section className="px-4 py-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {props.label}
          </h3>
        </div>
        <Switch checked={enabled} label="启用" onCheckedChange={setEnabled} />
      </div>

      <div className="grid gap-3">
        <TextInput
          label="Client ID"
          onChange={setClientId}
          placeholder="输入 Client ID"
          value={clientId}
        />
        <TextInput
          label="Client Secret"
          onChange={setClientSecret}
          placeholder="输入 Client Secret"
          type="password"
          value={clientSecret}
        />
        <div className="grid gap-1.5 text-sm">
          <span className="text-neutral-600 dark:text-neutral-300">
            Callback URL
          </span>
          <div className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
            <code className="min-w-0 flex-1 truncate text-xs text-neutral-600 dark:text-neutral-300">
              {callbackUrl}
            </code>
            <Button
              aria-label="复制 Callback URL"
              className="h-7 px-2"
              onClick={() => {
                void navigator.clipboard.writeText(callbackUrl)
                toast.success('已复制到剪贴板')
              }}
              type="button"
              variant="subtle"
            >
              <Copy aria-hidden="true" className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={validate} type="button" variant="subtle">
            验证连接
          </Button>
          <Button
            disabled={props.saving || !clientId.trim() || !clientSecret.trim()}
            onClick={() =>
              props.onSave({
                clientId: clientId.trim(),
                clientSecret: clientSecret.trim(),
                enabled,
                type: props.type,
              })
            }
            type="button"
          >
            保存配置
          </Button>
        </div>
      </div>
    </section>
  )
}

function flattenOauthOptions(
  data: OauthOptions | undefined,
): Record<OauthProviderType, FlatOauthProvider> {
  const providerMap = new Map(
    (data?.providers ?? []).map((provider) => [provider.type, provider]),
  )

  return {
    github: {
      clientId: data?.public?.github?.clientId ?? '',
      enabled: providerMap.get('github')?.enabled ?? false,
      type: 'github',
    },
    google: {
      clientId: data?.public?.google?.clientId ?? '',
      enabled: providerMap.get('google')?.enabled ?? false,
      type: 'google',
    },
  }
}

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M12 2C6.48 2 2 6.59 2 12.25c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.93.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.34 9.34 0 0 1 12 6.92c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.15 10.15 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="currentColor"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="currentColor"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="currentColor"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="currentColor"
      />
    </svg>
  )
}

function SessionSection() {
  const [expanded, setExpanded] = useState(false)
  const sessionsQuery = useQuery({
    queryFn: listSessions,
    queryKey: [...accountQueryKey, 'sessions'],
  })

  const deleteMutation = useMutation({
    mutationFn: async (session: AccountSession) => {
      if (session.current) {
        const result = await authClient.signOut()
        if (result.error) throw new Error(result.error.message || '注销失败')
      } else {
        const result = await authClient.revokeSession({ token: session.token })
        if (result.error)
          throw new Error(result.error.message || '踢出设备失败')
      }
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '操作失败')),
    onSuccess: async (_, session) => {
      toast.success(session.current ? '已注销当前会话' : '已踢出设备')
      if (session.current) window.location.reload()
      await sessionsQuery.refetch()
    },
  })

  const revokeOthersMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.revokeOtherSessions()
      if (result.error) throw new Error(result.error.message || '踢出设备失败')
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '踢出设备失败')),
    onSuccess: async () => {
      toast.success('已踢出其他设备')
      await sessionsQuery.refetch()
    },
  })
  const sessions = sessionsQuery.data ?? []
  const visibleSessions = expanded ? sessions : sessions.slice(0, 5)
  const hiddenSessionCount = Math.max(
    sessions.length - visibleSessions.length,
    0,
  )

  return (
    <Panel
      description="管理登录会话，保护账户安全。"
      title={
        <span className="inline-flex items-center gap-2">
          <Shield aria-hidden="true" className="size-4" />
          登录设备
        </span>
      }
    >
      <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
        {sessionsQuery.isLoading ? (
          <div className="p-4 text-sm text-neutral-500">加载中...</div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-sm text-neutral-500">暂无会话。</div>
        ) : (
          <>
            {visibleSessions.map((session) => (
              <div className="px-4 py-3" key={session.token}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs',
                          session.current
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900',
                        )}
                      >
                        {session.current ? '当前设备' : '其他设备'}
                      </span>
                      {session.ip ? (
                        <IpInfoPopover
                          className="inline-flex min-w-0 items-center gap-1 text-xs text-neutral-500 hover:underline dark:text-neutral-400"
                          ip={session.ip}
                          trigger={
                            <>
                              <Globe
                                aria-hidden="true"
                                className="size-3 shrink-0 text-neutral-400"
                              />
                              <span>{session.ip}</span>
                            </>
                          }
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 truncate font-mono text-xs text-neutral-600 dark:text-neutral-300">
                      {session.ua || 'Unknown user agent'}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {session.current ? '活跃时间' : '登录时间'}：
                      {formatDateTime(session.lastActiveAt)}
                    </p>
                  </div>
                  <Button
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          session.current
                            ? '确认注销当前会话？'
                            : '确认踢出此设备？',
                        )
                      ) {
                        deleteMutation.mutate(session)
                      }
                    }}
                    type="button"
                    variant="subtle"
                  >
                    {session.current ? '注销' : '踢出'}
                  </Button>
                </div>
              </div>
            ))}
            {sessions.length > 5 ? (
              <div className="px-4 py-3">
                <button
                  className="flex w-full items-center justify-center text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
                  onClick={() => setExpanded((current) => !current)}
                  type="button"
                >
                  {expanded
                    ? '收起'
                    : `查看更多（${hiddenSessionCount} 个设备）`}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="flex justify-end border-t border-neutral-100 p-3 dark:border-neutral-900">
        <Button
          disabled={revokeOthersMutation.isPending}
          onClick={() => {
            if (window.confirm('确认踢掉全部其他登录设备？')) {
              revokeOthersMutation.mutate()
            }
          }}
          type="button"
          variant="subtle"
        >
          踢掉其他设备
        </Button>
      </div>
    </Panel>
  )
}

interface AccountSession {
  current?: boolean
  ip?: string
  lastActiveAt: string
  token: string
  ua?: string
}

async function listSessions(): Promise<AccountSession[]> {
  const [sessionsResult, currentResult] = await Promise.all([
    authClient.listSessions(),
    authClient.getSession(),
  ])

  if (sessionsResult.error) {
    throw new Error(sessionsResult.error.message || '获取会话失败')
  }

  const currentToken = currentResult.data?.session?.token
  return (sessionsResult.data ?? []).map((session: any) => {
    const token = String(session.token || session.id)
    return {
      current: currentToken ? token === currentToken : false,
      ip: session.ipAddress || '',
      lastActiveAt: new Date(
        session.updatedAt || session.createdAt || Date.now(),
      ).toISOString(),
      token,
      ua: session.userAgent || '',
    }
  })
}

function PasswordSection() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!currentPassword || !newPassword) throw new Error('请输入密码')
      if (newPassword !== confirmPassword) throw new Error('两次密码输入不一致')
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      if (result.error) throw new Error(result.error.message || '密码修改失败')
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '密码修改失败')),
    onSuccess: async () => {
      toast.success('密码修改成功，请重新登录')
      setOpen(false)
      await authClient.signOut()
      navigate('/login')
    },
  })

  return (
    <>
      <Panel description="修改后需要重新登录。" title="修改密码">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-neutral-500">
            定期更改密码可以提高账户安全性。
          </p>
          <Button onClick={() => setOpen(true)} type="button" variant="subtle">
            <Lock aria-hidden="true" className="size-4" />
            修改密码
          </Button>
        </div>
      </Panel>
      <Modal onClose={() => setOpen(false)} open={open} title="修改密码">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <TextInput
            label="当前密码"
            onChange={setCurrentPassword}
            type="password"
            value={currentPassword}
          />
          <TextInput
            label="新密码"
            onChange={setNewPassword}
            type="password"
            value={newPassword}
          />
          <TextInput
            label="确认新密码"
            onChange={setConfirmPassword}
            type="password"
            value={confirmPassword}
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="subtle"
            >
              取消
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              确认修改
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function TokenPanel(props: { onBack: () => void }) {
  const queryClient = useQueryClient()
  const [visibleTokens, setVisibleTokens] = useState<Record<string, string>>({})
  const [createOpen, setCreateOpen] = useState(false)
  const [createdToken, setCreatedToken] = useState<TokenModel | null>(null)
  const [name, setName] = useState('')
  const [expires, setExpires] = useState(formatDateTimeInputValue(new Date()))
  const [expiresEnabled, setExpiresEnabled] = useState(false)

  const tokensQuery = useQuery({
    queryFn: getTokens,
    queryKey: [...accountQueryKey, 'tokens'],
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createToken({
        expired: expiresEnabled ? new Date(expires).toISOString() : undefined,
        name,
      }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '创建 Token 失败')),
    onSuccess: async (token) => {
      try {
        await navigator.clipboard.writeText(token.token)
        toast.success('Token 已创建并复制到剪贴板')
      } catch {
        toast.success('Token 已创建')
      }
      setCreatedToken(token)
      setCreateOpen(false)
      setName('')
      setExpires(formatDateTimeInputValue(new Date()))
      setExpiresEnabled(false)
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteToken,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除 Token 失败')),
    onSuccess: async () => {
      toast.success('删除成功')
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const revealToken = async (token: TokenModel) => {
    if (visibleTokens[token.id]) {
      setVisibleTokens((current) => {
        const next = { ...current }
        delete next[token.id]
        return next
      })
      return
    }

    try {
      const detail = await getToken(token.id)
      setVisibleTokens((current) => ({ ...current, [token.id]: detail.token }))
    } catch (error) {
      toast.error(getErrorMessage(error, '获取 Token 详情失败'))
    }
  }

  return (
    <div className="flex h-full min-h-72 flex-col">
      <PanelHeader onBack={props.onBack} title="API Token">
        <Button onClick={() => setCreateOpen(true)} type="button">
          <Plus aria-hidden="true" className="size-4" />
          新增
        </Button>
      </PanelHeader>
      <Scroll className="flex-1">
        {tokensQuery.isLoading ? (
          <div className="p-4 text-sm text-neutral-500">加载中...</div>
        ) : (tokensQuery.data ?? []).length === 0 ? (
          <EmptyState icon={<Key className="size-7" />} label="暂无 Token" />
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {tokensQuery.data?.map((token) => {
              const visible = visibleTokens[token.id]
              return (
                <div className="p-4" key={token.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium">
                        {token.name}
                      </h3>
                      <button
                        className="mt-2 max-w-full truncate font-mono text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                        onClick={() => {
                          if (visible)
                            void navigator.clipboard.writeText(visible)
                        }}
                        type="button"
                      >
                        {visible || '••••••••••••••••••••••••'}
                      </button>
                      <p className="mt-2 text-xs text-neutral-500">
                        创建于 {formatDateTime(token.createdAt)}
                        {token.expired
                          ? ` · 过期 ${formatDateTime(String(token.expired))}`
                          : ' · 永不过期'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => void revealToken(token)}
                        type="button"
                        variant="subtle"
                      >
                        {visible ? (
                          <EyeOff aria-hidden="true" className="size-4" />
                        ) : (
                          <Eye aria-hidden="true" className="size-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          if (
                            window.confirm(`确认删除 Token「${token.name}」？`)
                          ) {
                            deleteMutation.mutate(token.id)
                          }
                        }}
                        type="button"
                        variant="subtle"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Scroll>

      <Modal
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        title="创建 Token"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!name.trim()) {
              toast.warning('请输入 Token 名称')
              return
            }
            if (expiresEnabled && Number.isNaN(new Date(expires).getTime())) {
              toast.warning('请选择有效的过期时间')
              return
            }
            createMutation.mutate()
          }}
        >
          <TextInput
            label="名称"
            onChange={setName}
            placeholder="为这个 Token 起个名字..."
            required
            value={name}
          />
          <Switch
            checked={expiresEnabled}
            label="是否过期"
            onCheckedChange={setExpiresEnabled}
          />
          <TextInput
            disabled={!expiresEnabled}
            label="过期时间"
            onChange={setExpires}
            type="datetime-local"
            value={expires}
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setCreateOpen(false)}
              type="button"
              variant="subtle"
            >
              取消
            </Button>
            <Button disabled={createMutation.isPending} type="submit">
              创建
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        onClose={() => setCreatedToken(null)}
        open={Boolean(createdToken)}
        title="Token 创建成功"
      >
        <div className="space-y-4">
          <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            Token 创建成功，请妥善保存。
          </div>
          <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-neutral-500">名称：</span>
            <span className="font-medium">{createdToken?.name}</span>
          </div>
          <div className="flex items-center gap-2 rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <code className="min-w-0 flex-1 break-all text-xs">
              {createdToken?.token}
            </code>
            <Button
              onClick={() => {
                if (createdToken?.token) {
                  void navigator.clipboard.writeText(createdToken.token)
                  toast.success('Token 已复制')
                }
              }}
              type="button"
              variant="subtle"
            >
              <Copy aria-hidden="true" className="size-4" />
            </Button>
          </div>
          {createdToken?.expired ? (
            <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">
              <span className="text-neutral-500">过期时间：</span>
              <span className="font-medium">
                {formatDateTime(String(createdToken.expired))}
              </span>
            </div>
          ) : null}
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            关闭此窗口后将无法再次查看完整 Token。
          </p>
        </div>
      </Modal>
    </div>
  )
}

function PasskeyPanel(props: { onBack: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  const authSecurityQuery = useQuery({
    queryFn: () =>
      getOption<{ disablePasswordLogin?: boolean }>('authSecurity'),
    queryKey: [...accountQueryKey, 'auth-security'],
  })

  const passkeysQuery = useQuery({
    queryFn: listPasskeys,
    queryKey: [...accountQueryKey, 'passkeys'],
  })

  const updateAuthSecurityMutation = useMutation({
    mutationFn: (disablePasswordLogin: boolean) =>
      patchOption('authSecurity', { disablePasswordLogin }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '更新登录安全设置失败')),
    onSuccess: async () => {
      toast.success('登录安全设置已更新')
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.passkey.addPasskey({
        name: name.trim() || `Passkey ${new Date().toLocaleDateString()}`,
      })
      if (result.error) throw new Error(result.error.message || '添加失败')
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '添加 Passkey 失败')),
    onSuccess: async () => {
      toast.success('Passkey 已添加')
      setName('')
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePasskey,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除 Passkey 失败')),
    onSuccess: async () => {
      toast.success('删除成功')
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const validateMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.signIn.passkey()
      if (result.error) {
        throw new Error(result.error.message || 'Passkey 验证失败')
      }
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, 'Passkey 验证失败')),
    onSuccess: () => {
      toast.success('Passkey 验证成功')
    },
  })

  return (
    <div className="flex h-full min-h-72 flex-col">
      <PanelHeader onBack={props.onBack} title="Passkey">
        <Button
          disabled={validateMutation.isPending}
          onClick={() => validateMutation.mutate()}
          type="button"
          variant="subtle"
        >
          <Shield aria-hidden="true" className="size-4" />
          验证
        </Button>
      </PanelHeader>
      <div className="border-b border-neutral-100 p-4 dark:border-neutral-900">
        <Switch
          checked={Boolean(authSecurityQuery.data?.disablePasswordLogin)}
          description="开启后只能通过 Passkey 或 OAuth 登录。至少添加一个 Passkey 后才能启用。"
          disabled={
            authSecurityQuery.isLoading || updateAuthSecurityMutation.isPending
          }
          label="禁止密码登录"
          onCheckedChange={(checked) => {
            if (checked && (passkeysQuery.data ?? []).length === 0) {
              toast.error('至少需要一个 Passkey 才能开启这个功能')
              return
            }
            updateAuthSecurityMutation.mutate(checked)
          }}
        />
      </div>
      <div className="border-b border-neutral-100 p-4 dark:border-neutral-900">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            addMutation.mutate()
          }}
        >
          <TextInput
            className="min-w-48 flex-1"
            onChange={setName}
            placeholder="Passkey 名称"
            value={name}
          />
          <Button disabled={addMutation.isPending} type="submit">
            <Plus aria-hidden="true" className="size-4" />
            添加
          </Button>
        </form>
      </div>
      <Scroll className="flex-1">
        {passkeysQuery.isLoading ? (
          <div className="p-4 text-sm text-neutral-500">加载中...</div>
        ) : (passkeysQuery.data ?? []).length === 0 ? (
          <EmptyState
            icon={<Fingerprint className="size-7" />}
            label="暂无 Passkey"
          />
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {passkeysQuery.data?.map((passkey) => (
              <div
                className="flex items-center justify-between gap-3 p-4"
                key={passkey.id}
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium">
                    {passkey.name || passkey.id}
                  </h3>
                  <p className="mt-1 truncate font-mono text-xs text-neutral-500">
                    {passkey.credentialID}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    创建于 {formatDateTime(passkey.createdAt)}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (window.confirm('确认删除该 Passkey？')) {
                      deleteMutation.mutate(passkey.id)
                    }
                  }}
                  type="button"
                  variant="subtle"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Scroll>
    </div>
  )
}

function MetaPresetSettings() {
  const queryClient = useQueryClient()
  const [modalState, setModalState] = useState<{
    id?: string
    mode: 'create' | 'edit'
  } | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const presetsQuery = useQuery({
    queryFn: () => getMetaPresets(),
    queryKey: metaPresetsQueryKey,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      data: Partial<CreateMetaPresetDto>
      id: string
    }) => updateMetaPreset(id, data),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '修改失败')),
    onSuccess: async () => {
      toast.success('修改成功')
      await queryClient.invalidateQueries({ queryKey: metaPresetsQueryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMetaPreset,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('删除成功')
      await queryClient.invalidateQueries({ queryKey: metaPresetsQueryKey })
    },
  })

  const orderMutation = useMutation({
    mutationFn: updateMetaPresetOrder,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '排序保存失败')),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: metaPresetsQueryKey })
    },
  })

  const presets = presetsQuery.data ?? []

  const dropPreset = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return
    const items = [...presets]
    const [item] = items.splice(draggedIndex, 1)
    items.splice(dropIndex, 0, item)
    setDraggedIndex(null)
    orderMutation.mutate(items.map((preset) => preset.id))
  }

  return (
    <Panel
      description="配置可复用的自定义 meta 字段。"
      title={
        <span className="inline-flex items-center gap-2">
          <ListPlus aria-hidden="true" className="size-4" />
          Meta 预设字段
        </span>
      }
    >
      <div className="flex justify-end border-b border-neutral-100 p-3 dark:border-neutral-900">
        <Button onClick={() => setModalState({ mode: 'create' })} type="button">
          <Plus aria-hidden="true" className="size-4" />
          新增预设
        </Button>
      </div>
      {presetsQuery.isLoading ? (
        <div className="p-4 text-sm text-neutral-500">加载中...</div>
      ) : presets.length === 0 ? (
        <EmptyState
          icon={<ListPlus className="size-7" />}
          label="暂无预设字段"
        />
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
          {presets.map((preset, index) => (
            <div
              className={cn(
                'transition-opacity',
                draggedIndex === index && 'opacity-50',
              )}
              draggable={!preset.isBuiltin}
              key={preset.id}
              onDragEnd={() => setDraggedIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDraggedIndex(index)}
              onDrop={(event) => {
                event.preventDefault()
                dropPreset(index)
              }}
            >
              <MetaPresetRow
                onDelete={(id) => {
                  if (window.confirm(`确认删除预设字段「${preset.label}」？`)) {
                    deleteMutation.mutate(id)
                  }
                }}
                onEdit={(id) => setModalState({ id, mode: 'edit' })}
                onToggle={(item) =>
                  updateMutation.mutate({
                    data: { enabled: !item.enabled },
                    id: item.id,
                  })
                }
                preset={preset}
              />
            </div>
          ))}
        </div>
      )}

      <MetaPresetModal
        id={modalState?.id}
        onClose={() => setModalState(null)}
        open={Boolean(modalState)}
      />
    </Panel>
  )
}

function MetaPresetRow(props: {
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onToggle: (preset: MetaPresetField) => void
  preset: MetaPresetField
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {!props.preset.isBuiltin ? (
        <GripVertical aria-hidden="true" className="size-4 text-neutral-300" />
      ) : (
        <Lock aria-hidden="true" className="size-4 text-neutral-300" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-neutral-950 dark:text-neutral-50">
            {props.preset.label}
          </span>
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-500 dark:bg-neutral-900">
            {props.preset.key}
          </code>
          <SmallBadge>{fieldTypeLabels[props.preset.type]}</SmallBadge>
          <SmallBadge>{scopeLabels[props.preset.scope]}</SmallBadge>
          {props.preset.isBuiltin ? <SmallBadge>内置</SmallBadge> : null}
        </div>
        {props.preset.description ? (
          <p className="mt-1 truncate text-sm text-neutral-500">
            {props.preset.description}
          </p>
        ) : null}
      </div>
      <Switch
        checked={props.preset.enabled}
        className="border-0 px-0 py-0"
        label=""
        onCheckedChange={() => props.onToggle(props.preset)}
      />
      {!props.preset.isBuiltin ? (
        <>
          <Button
            onClick={() => props.onEdit(props.preset.id)}
            type="button"
            variant="subtle"
          >
            编辑
          </Button>
          <Button
            onClick={() => props.onDelete(props.preset.id)}
            type="button"
            variant="subtle"
          >
            删除
          </Button>
        </>
      ) : null}
    </div>
  )
}

function MetaPresetModal(props: {
  id?: string
  onClose: () => void
  open: boolean
}) {
  const queryClient = useQueryClient()
  const presetsQuery = useQuery({
    enabled: props.open && Boolean(props.id),
    queryFn: async () => {
      const presets = await getMetaPresets()
      return presets.find((preset) => preset.id === props.id) ?? null
    },
    queryKey: [...metaPresetsQueryKey, props.id],
  })
  const [form, setForm] = useState<CreateMetaPresetDto>(emptyMetaPreset())

  useEffect(() => {
    if (!props.open) return
    if (props.id && presetsQuery.data) {
      setForm(metaPresetToForm(presetsQuery.data))
      return
    }
    if (!props.id) setForm(emptyMetaPreset())
  }, [props.id, props.open, presetsQuery.data])

  const mutation = useMutation({
    mutationFn: () =>
      props.id ? updateMetaPreset(props.id, form) : createMetaPreset(form),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, props.id ? '修改失败' : '创建失败')),
    onSuccess: async () => {
      toast.success(props.id ? '修改成功' : '创建成功')
      props.onClose()
      await queryClient.invalidateQueries({ queryKey: metaPresetsQueryKey })
    },
  })

  const setField = <TKey extends keyof CreateMetaPresetDto>(
    key: TKey,
    value: CreateMetaPresetDto[TKey],
  ) => setForm((current) => ({ ...current, [key]: value }))

  const submit = () => {
    const error = validateMetaPreset(form)
    if (error) {
      toast.error(error)
      return
    }
    mutation.mutate()
  }

  return (
    <Modal
      onClose={props.onClose}
      open={props.open}
      title={props.id ? '编辑预设字段' : '新建预设字段'}
    >
      {presetsQuery.isLoading ? (
        <div className="py-12 text-center text-sm text-neutral-500">
          加载中...
        </div>
      ) : (
        <form
          className="space-y-4"
          onKeyDown={(event: KeyboardEvent<HTMLFormElement>) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
          }}
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="字段 Key"
              onChange={(value) => setField('key', value)}
              required
              value={form.key}
            />
            <TextInput
              label="显示名称"
              onChange={(value) => setField('label', value)}
              required
              value={form.label}
            />
            <FieldShell label="字段类型">
              <SelectField<MetaFieldType>
                aria-label="字段类型"
                onValueChange={(value) => setField('type', value)}
                options={fieldTypeOptions}
                value={form.type}
              />
            </FieldShell>
            <FieldShell label="作用域">
              <SelectField<MetaPresetScope>
                aria-label="作用域"
                onValueChange={(value) => setField('scope', value)}
                options={scopeOptions}
                value={form.scope ?? 'both'}
              />
            </FieldShell>
          </div>
          <TextInput
            label="描述"
            onChange={(value) => setField('description', value)}
            value={form.description ?? ''}
          />
          <TextInput
            label="占位文本"
            onChange={(value) => setField('placeholder', value)}
            value={form.placeholder ?? ''}
          />
          <Switch
            checked={Boolean(form.enabled ?? true)}
            label="启用"
            onCheckedChange={(value) => setField('enabled', value)}
          />

          {typesWithOptions.includes(form.type) ? (
            <OptionsEditor
              onChange={(options) => setField('options', options)}
              options={form.options ?? []}
            />
          ) : null}

          {form.type === 'object' ? (
            <ChildrenEditor
              childrenFields={form.children ?? []}
              onChange={(children) => setField('children', children)}
            />
          ) : null}

          <div className="flex justify-end gap-2">
            <Button onClick={props.onClose} type="button" variant="subtle">
              取消
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Check aria-hidden="true" className="size-4" />
              )}
              保存
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function OptionsEditor(props: {
  onChange: (options: MetaFieldOption[]) => void
  options: MetaFieldOption[]
}) {
  const update = (index: number, patch: Partial<MetaFieldOption>) => {
    props.onChange(
      props.options.map((option, itemIndex) =>
        itemIndex === index ? { ...option, ...patch } : option,
      ),
    )
  }

  return (
    <section className="rounded border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">选项配置</h3>
        <Button
          onClick={() =>
            props.onChange([...props.options, { label: '', value: '' }])
          }
          type="button"
          variant="subtle"
        >
          <Plus aria-hidden="true" className="size-4" />
          添加选项
        </Button>
      </div>
      <div className="space-y-2">
        {props.options.map((option, index) => (
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" key={index}>
            <TextInput
              onChange={(value) => update(index, { value })}
              placeholder="值"
              value={String(option.value ?? '')}
            />
            <TextInput
              onChange={(label) => update(index, { label })}
              placeholder="显示文本"
              value={option.label}
            />
            <Button
              onClick={() =>
                props.onChange(
                  props.options.filter((_, itemIndex) => itemIndex !== index),
                )
              }
              type="button"
              variant="subtle"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}

function ChildrenEditor(props: {
  childrenFields: MetaPresetChild[]
  onChange: (children: MetaPresetChild[]) => void
}) {
  const update = (index: number, patch: Partial<MetaPresetChild>) => {
    props.onChange(
      props.childrenFields.map((child, itemIndex) =>
        itemIndex === index ? { ...child, ...patch } : child,
      ),
    )
  }

  return (
    <section className="rounded border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">对象子字段</h3>
        <Button
          onClick={() =>
            props.onChange([
              ...props.childrenFields,
              { key: '', label: '', type: 'text' },
            ])
          }
          type="button"
          variant="subtle"
        >
          <Plus aria-hidden="true" className="size-4" />
          添加子字段
        </Button>
      </div>
      <div className="space-y-2">
        {props.childrenFields.map((child, index) => (
          <div
            className="grid gap-2 md:grid-cols-[1fr_1fr_10rem_auto]"
            key={index}
          >
            <TextInput
              onChange={(key) => update(index, { key })}
              placeholder="key"
              value={child.key}
            />
            <TextInput
              onChange={(label) => update(index, { label })}
              placeholder="显示名称"
              value={child.label}
            />
            <SelectField<MetaFieldType>
              aria-label="字段类型"
              onValueChange={(type) => update(index, { type })}
              options={fieldTypeOptions}
              value={child.type}
            />
            <Button
              onClick={() =>
                props.onChange(
                  props.childrenFields.filter(
                    (_, itemIndex) => itemIndex !== index,
                  ),
                )
              }
              type="button"
              variant="subtle"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}

function TagsEditor(props: {
  onChange: (value: string[]) => void
  value: string[]
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = draft.trim()
    if (!value) return
    props.onChange([...props.value, value])
    setDraft('')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {props.value.map((tag) => (
          <button
            className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
            key={tag}
            onClick={() =>
              props.onChange(props.value.filter((item) => item !== tag))
            }
            type="button"
          >
            {tag}
            <X aria-hidden="true" className="ml-1 inline size-3" />
          </button>
        ))}
      </div>
      <TextInput
        onChange={setDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            add()
          }
        }}
        placeholder="输入后按 Enter"
        value={draft}
      />
    </div>
  )
}

function PanelHeader(props: {
  children?: ReactNode
  onBack: () => void
  title: string
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800',
        APP_SHELL_HEADER_HEIGHT_CLASS,
      )}
    >
      <div className="flex items-center gap-3">
        <button
          className="flex size-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
          onClick={props.onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <h2 className="text-base font-semibold">{props.title}</h2>
      </div>
      {props.children}
    </div>
  )
}

function Modal(props: {
  children: ReactNode
  onClose: () => void
  open: boolean
  title: string
}) {
  if (!props.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="text-lg font-semibold">{props.title}</h2>
          <button
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
            onClick={props.onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <Scroll className="flex-1" innerClassName="p-5">
          {props.children}
        </Scroll>
      </div>
    </div>
  )
}

function FieldShell(props: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-neutral-700 dark:text-neutral-300">
        {props.label}
      </span>
      {props.children}
    </label>
  )
}

function EmptyState(props: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center px-4 text-center">
      <div className="text-neutral-300">{props.icon}</div>
      <p className="mt-3 text-sm text-neutral-500">{props.label}</p>
    </div>
  )
}

function SettingsSkeleton(props: { title: string }) {
  return (
    <Panel title={props.title}>
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

function SmallBadge(props: { children: ReactNode }) {
  return (
    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
      {props.children}
    </span>
  )
}

function getGroupIcon(icon: string) {
  const iconMap: Record<string, typeof User> = {
    bell: Mail,
    database: Settings,
    globe: Settings,
    search: Settings,
    settings: Settings,
    shield: Shield,
    sparkles: Settings,
    user: User,
    'file-text': Settings,
    'list-plus': ListPlus,
  }
  return iconMap[icon] ?? Settings
}

function shouldShowField(
  field: ConfigFormField,
  formData: Record<string, unknown>,
  sectionPrefix: string,
) {
  const showWhen = field.ui.showWhen
  if (!showWhen) return true

  return Object.entries(showWhen).every(([key, expected]) => {
    const actual = getPath(formData, `${sectionPrefix}.${key}`)
    const values = Array.isArray(expected) ? expected : [expected]
    return values.some((value) => String(actual) === String(value))
  })
}

function getPath(source: unknown, path: string) {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, source)
}

function setPathImmutable<T extends Record<string, unknown>>(
  source: T,
  path: string,
  value: unknown,
): T {
  const [head, ...rest] = path.split('.')
  if (!head) return source

  if (rest.length === 0) return { ...source, [head]: value }

  const current =
    source[head] && typeof source[head] === 'object'
      ? (source[head] as Record<string, unknown>)
      : {}

  return {
    ...source,
    [head]: setPathImmutable(current, rest.join('.'), value),
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? {})) as T
}

function isDeepEqual(left: unknown, right: unknown) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
}

function stringValue(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatDateTimeInputValue(value: Date) {
  const offsetDate = new Date(
    value.getTime() - value.getTimezoneOffset() * 60_000,
  )
  return offsetDate.toISOString().slice(0, 16)
}

function normalizeAIConfig(value: unknown): AIConfig {
  if (!value || typeof value !== 'object') {
    return { providers: [] }
  }
  const config = value as AIConfig
  return {
    ...config,
    providers: (config.providers ?? []).map((provider) => ({
      apiKey: provider.apiKey ?? '',
      defaultModel: provider.defaultModel ?? '',
      enabled: Boolean(provider.enabled),
      endpoint: provider.endpoint ?? '',
      id: provider.id || crypto.randomUUID(),
      name: provider.name ?? '',
      type: provider.type ?? 'openai',
    })),
  }
}

function formatAIProviderLabel(provider: AIProviderConfig) {
  const name = provider.name.trim()
  if (name) return name
  return (
    aiProviderTypeOptions.find((option) => option.value === provider.type)
      ?.label ?? provider.type
  )
}

function getDefaultAIModel(type: AIProviderType) {
  switch (type) {
    case 'anthropic':
      return 'claude-sonnet-4.5'
    case 'openai':
      return 'gpt-5-mini'
    case 'openrouter':
      return 'anthropic/claude-sonnet-4.5'
    case 'openai-compatible':
      return ''
  }
}

function getAIProviderNamePlaceholder(type: AIProviderType) {
  switch (type) {
    case 'anthropic':
      return '如 Claude Sonnet'
    case 'openai':
      return '如 OpenAI GPT'
    case 'openrouter':
      return '如 OpenRouter'
    case 'openai-compatible':
      return '如 DeepSeek'
  }
}

function getAIProviderKeyPlaceholder(type: AIProviderType) {
  switch (type) {
    case 'anthropic':
      return 'sk-ant-...'
    case 'openrouter':
      return 'sk-or-...'
    case 'openai':
    case 'openai-compatible':
      return 'sk-...'
  }
}

function getAIProviderModelPlaceholder(type: AIProviderType) {
  switch (type) {
    case 'anthropic':
      return '如 claude-sonnet-4.5'
    case 'openai':
      return '如 gpt-5-mini'
    case 'openrouter':
      return '如 anthropic/claude-sonnet-4.5'
    case 'openai-compatible':
      return '如 deepseek-chat'
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

const fieldTypeLabels: Record<MetaFieldType, string> = {
  boolean: '开关',
  checkbox: '复选框',
  'multi-select': '多选',
  number: '数字',
  object: '对象',
  select: '单选',
  tags: '标签',
  text: '文本',
  textarea: '多行文本',
  url: 'URL',
}

const scopeLabels: Record<MetaPresetScope, string> = {
  both: '通用',
  note: '笔记',
  post: '博文',
}

const fieldTypeOptions: Array<{ label: string; value: MetaFieldType }> = [
  { label: '文本', value: 'text' },
  { label: '多行文本', value: 'textarea' },
  { label: '数字', value: 'number' },
  { label: 'URL', value: 'url' },
  { label: '单选', value: 'select' },
  { label: '多选', value: 'multi-select' },
  { label: '复选框', value: 'checkbox' },
  { label: '标签', value: 'tags' },
  { label: '开关', value: 'boolean' },
  { label: '对象', value: 'object' },
]

const scopeOptions: Array<{ label: string; value: MetaPresetScope }> = [
  { label: '博文', value: 'post' },
  { label: '笔记', value: 'note' },
  { label: '通用', value: 'both' },
]

const typesWithOptions: MetaFieldType[] = ['checkbox', 'multi-select', 'select']

function emptyMetaPreset(): CreateMetaPresetDto {
  return {
    enabled: true,
    key: '',
    label: '',
    scope: 'both',
    type: 'text',
  }
}

function metaPresetToForm(preset: MetaPresetField): CreateMetaPresetDto {
  return {
    allowCustomOption: preset.allowCustomOption,
    children: preset.children,
    description: preset.description ?? '',
    enabled: preset.enabled,
    key: preset.key,
    label: preset.label,
    options: preset.options,
    placeholder: preset.placeholder ?? '',
    scope: preset.scope,
    type: preset.type,
  }
}

function validateMetaPreset(form: CreateMetaPresetDto) {
  if (!form.key.trim()) return '请输入字段 Key'
  if (!/^[\w-]+$/.test(form.key))
    return 'Key 只能包含字母、数字、下划线和连字符'
  if (!form.label.trim()) return '请输入显示名称'
  if (typesWithOptions.includes(form.type) && !form.options?.length) {
    return '请至少添加一个选项'
  }
  if (form.type === 'object' && !form.children?.length) {
    return '请至少添加一个子字段'
  }
  return null
}
