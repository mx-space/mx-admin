import { cloneDeep, isEmpty } from 'es-toolkit/compat'
import {
  Calendar as CalendarIcon,
  Camera as CameraIcon,
  CircleCheck as CheckCircleOutlinedIcon,
  Globe as GlobeIcon,
  Link as LinkIcon,
  Mail as MailIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  User as UserIcon,
} from 'lucide-vue-next'
import { NButton, NInput, NSelect, NSkeleton } from 'naive-ui'
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  unref,
  watch,
} from 'vue'
import { toast } from 'vue-sonner'
import type { UserModel } from '~/models/user'

import { useMutation } from '@tanstack/vue-query'

import { userApi } from '~/api/user'
import Avatar from '~/components/avatar'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { IpInfoPopover } from '~/components/ip-info'
import { RelativeTime } from '~/components/time/relative-time'
import { UploadWrapper } from '~/components/upload'
import { socialKeyMap } from '~/constants/social'
import { useLayout } from '~/layouts/content'
import { SettingsRow, SettingsSection } from '~/layouts/settings-layout'
import { deepDiff } from '~/utils'

export const TabUser = defineComponent(() => {
  const data = ref({} as UserModel)
  const loading = ref(true)
  let origin: UserModel

  async function fetchMaster() {
    loading.value = true
    const response = await userApi.getMaster()
    data.value = response
    origin = cloneDeep(response)
    loading.value = false
  }

  onMounted(async () => {
    await fetchMaster()
  })
  const diff = computed(() => deepDiff(origin, data.value))
  const hasChanges = computed(() => !isEmpty(diff.value))

  const { setActions: setHeaderButton } = useLayout()

  const updateMutation = useMutation({
    mutationFn: userApi.updateMaster,
    onSuccess: async () => {
      toast.success('保存成功')
      await fetchMaster()
    },
  })

  const handleSave = () => {
    if (!hasChanges.value) return

    const submitData = cloneDeep(unref(diff))
    if (submitData.socialIds) {
      submitData.socialIds = data.value.socialIds
    }

    updateMutation.mutate(submitData)
  }

  onMounted(() => {
    setHeaderButton(
      <HeaderActionButton
        disabled={true}
        onClick={handleSave}
        icon={<CheckCircleOutlinedIcon />}
      />,
    )
  })

  onBeforeUnmount(() => {
    setHeaderButton(null)
  })

  watch(
    () => hasChanges.value,
    (canSave) => {
      setHeaderButton(
        <HeaderActionButton
          disabled={!canSave}
          icon={<CheckCircleOutlinedIcon />}
          onClick={handleSave}
        />,
      )
    },
  )

  const socialOptions = Object.keys(socialKeyMap).map((key) => ({
    label: key,
    value: socialKeyMap[key],
  }))

  const socialEntries = computed(() => {
    const ids = data.value.socialIds || {}
    return Object.entries(ids).map(([key, value]) => ({
      key,
      value: String(value),
    }))
  })

  const usedSocialKeys = computed(
    () => new Set(socialEntries.value.map((e) => e.key)),
  )

  const addSocialEntry = () => {
    const currentIds = data.value.socialIds || {}
    const availableKey =
      socialOptions.find((o) => !usedSocialKeys.value.has(o.value))?.value || ''
    if (!availableKey) return
    data.value.socialIds = { ...currentIds, [availableKey]: '' }
  }

  const updateSocialKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return
    const ids = { ...data.value.socialIds }
    const value = ids[oldKey]
    delete ids[oldKey]
    ids[newKey] = value
    data.value.socialIds = ids
  }

  const updateSocialValue = (key: string, value: string) => {
    data.value.socialIds = { ...data.value.socialIds, [key]: value }
  }

  const removeSocialEntry = (key: string) => {
    const ids = { ...data.value.socialIds }
    delete ids[key]
    data.value.socialIds = ids
  }

  const handleAvatarUpload: import('naive-ui').UploadOnFinish = (e) => {
    const res = JSON.parse((e.event?.target as XMLHttpRequest).responseText)
    e.file.url = res.url
    data.value.avatar = res.url
    return e.file
  }

  return () => (
    <div class="space-y-8">
      {loading.value ? (
        <UserSkeleton />
      ) : (
        <>
          {/* Profile Header */}
          <div class="flex items-center gap-5 pb-6">
            <div class="relative size-20 shrink-0 [&_.n-upload-trigger]:size-20 [&_.n-upload-trigger]:overflow-hidden [&_.n-upload-trigger]:rounded-full [&_.n-upload]:size-20 [&_.n-upload]:overflow-hidden [&_.n-upload]:rounded-full">
              <UploadWrapper
                onFinish={handleAvatarUpload}
                type="avatar"
                v-slots={{
                  default: () => (
                    <div class="hover:ring-primary/30 dark:hover:ring-primary/30 relative size-20 overflow-hidden rounded-full ring-4 ring-neutral-100 transition-all dark:ring-neutral-800">
                      <Avatar src={data.value.avatar} size={80} />
                      <div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                        <CameraIcon class="size-5 text-white" />
                      </div>
                    </div>
                  ),
                }}
              />
            </div>

            <div class="min-w-0 flex-1">
              <h2 class="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {data.value.name || '–'}
              </h2>
              <p class="m-0 mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                @{data.value.username}
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                {data.value.mail && (
                  <span class="flex shrink-0 items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <MailIcon class="size-3.5" />
                    {data.value.mail}
                  </span>
                )}
                {data.value.lastLoginTime && (
                  <span class="flex shrink-0 items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <CalendarIcon class="size-3.5" />
                    上次登录: <RelativeTime time={data.value.lastLoginTime} />
                  </span>
                )}
                {data.value.lastLoginIp && (
                  <span class="flex shrink-0 items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <GlobeIcon class="size-3.5" />
                    <IpInfoPopover
                      ip={data.value.lastLoginIp}
                      triggerEl={
                        <NButton quaternary size="tiny" type="primary">
                          {data.value.lastLoginIp}
                        </NButton>
                      }
                    />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info Section */}
          <SettingsSection title="基本信息" icon={UserIcon}>
            <SettingsRow title="昵称">
              <NInput
                value={data.value.name}
                onInput={(v) => (data.value.name = v)}
                placeholder="输入昵称…"
                inputProps={{
                  id: 'user-name',
                  autocomplete: 'name',
                }}
              />
            </SettingsRow>

            <SettingsRow title="用户名">
              <NInput
                value={data.value.username}
                onInput={(v) => (data.value.username = v)}
                placeholder="输入用户名…"
                inputProps={{
                  id: 'user-username',
                  autocomplete: 'username',
                  spellcheck: false,
                }}
              />
            </SettingsRow>

            <SettingsRow title="邮箱">
              <NInput
                value={data.value.mail}
                onInput={(v) => (data.value.mail = v)}
                placeholder="输入邮箱地址…"
                inputProps={{
                  id: 'user-mail',
                  type: 'email',
                  inputmode: 'email',
                  autocomplete: 'email',
                  spellcheck: false,
                }}
              />
            </SettingsRow>

            <SettingsRow title="个人网站">
              <NInput
                value={data.value.url}
                onInput={(v) => (data.value.url = v)}
                placeholder="https://example.com"
                inputProps={{
                  id: 'user-url',
                  type: 'url',
                  inputmode: 'url',
                  autocomplete: 'url',
                  spellcheck: false,
                }}
              />
            </SettingsRow>

            <SettingsRow title="个人简介">
              <NInput
                value={data.value.introduce}
                onInput={(v) => (data.value.introduce = v)}
                type="textarea"
                placeholder="介绍一下自己…"
                autosize={{ minRows: 3, maxRows: 6 }}
                inputProps={{
                  id: 'user-introduce',
                }}
              />
            </SettingsRow>

            <SettingsRow
              title="头像 URL"
              description="也可以点击上方头像直接上传图片"
            >
              <NInput
                value={data.value.avatar}
                onInput={(v) => (data.value.avatar = v)}
                placeholder="https://example.com/avatar.jpg"
                inputProps={{
                  id: 'user-avatar',
                  type: 'url',
                  inputmode: 'url',
                  spellcheck: false,
                }}
              />
            </SettingsRow>
          </SettingsSection>

          {/* Social Links Section */}
          <SettingsSection
            title="社交链接"
            icon={LinkIcon}
            v-slots={{
              actions: () => (
                <NButton
                  size="small"
                  secondary
                  onClick={addSocialEntry}
                  disabled={
                    !socialOptions.some(
                      (o) => !usedSocialKeys.value.has(o.value),
                    )
                  }
                >
                  <PlusIcon class="mr-1 size-4" />
                  添加
                </NButton>
              ),
            }}
          >
            {socialEntries.value.length === 0 ? (
              <div class="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
                暂未添加任何社交链接
              </div>
            ) : (
              <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
                {socialEntries.value.map(({ key, value }) => (
                  <div class="flex items-center gap-3 py-3" key={key}>
                    <NSelect
                      class="w-36 shrink-0"
                      value={key}
                      options={socialOptions.map((opt) => ({
                        ...opt,
                        disabled:
                          usedSocialKeys.value.has(opt.value) &&
                          opt.value !== key,
                      }))}
                      onUpdateValue={(newKey) => updateSocialKey(key, newKey)}
                    />
                    <NInput
                      class="min-w-0 flex-1"
                      value={value}
                      onInput={(v) => updateSocialValue(key, v)}
                      placeholder="输入链接或 ID…"
                      inputProps={{ spellcheck: false }}
                    />
                    <button
                      type="button"
                      class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-neutral-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      onClick={() => removeSocialEntry(key)}
                    >
                      <TrashIcon class="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SettingsSection>
        </>
      )}
    </div>
  )
})

const UserSkeleton = defineComponent(() => {
  return () => (
    <div class="space-y-8">
      <div class="flex items-center gap-5 pb-6">
        <NSkeleton circle style={{ width: '80px', height: '80px' }} />
        <div class="min-w-0 flex-1">
          <NSkeleton text style={{ width: '120px', height: '24px' }} />
          <NSkeleton
            text
            style={{ width: '80px', height: '16px', marginTop: '4px' }}
          />
          <div class="mt-2 flex gap-4">
            <NSkeleton text style={{ width: '150px' }} />
            <NSkeleton text style={{ width: '120px' }} />
          </div>
        </div>
      </div>
      <div>
        <NSkeleton text style={{ width: '80px', height: '20px' }} />
        <div class="mt-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} class="flex gap-8">
              <NSkeleton text style={{ width: '80px', height: '16px' }} />
              <NSkeleton text style={{ width: '100%', height: '34px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
