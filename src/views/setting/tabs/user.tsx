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
import { HeaderActionButton } from '~/components/button/rounded-button'
import { IpInfoPopover } from '~/components/ip-info'
import { RelativeTime } from '~/components/time/relative-time'
import { UploadWrapper } from '~/components/upload'
import { socialKeyMap } from '~/constants/social'
import { useLayout } from '~/layouts/content'
import { SettingsCard, SettingsItem } from '~/layouts/settings-layout'
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
    <div class="w-full">
      {loading.value ? (
        <UserSkeleton />
      ) : (
        <>
          {/* Profile Header Section */}
          <SettingsCard title="个人资料" icon={UserIcon}>
            <div class="flex items-center gap-5">
              {/* Avatar with upload */}
              <div class="relative size-[100px] shrink-0 [&_.n-upload-trigger]:size-[100px] [&_.n-upload-trigger]:overflow-hidden [&_.n-upload-trigger]:rounded-full [&_.n-upload]:size-[100px] [&_.n-upload]:overflow-hidden [&_.n-upload]:rounded-full">
                <UploadWrapper
                  onFinish={handleAvatarUpload}
                  type="avatar"
                  v-slots={{
                    default: () => (
                      <div class="hover:ring-primary/30 dark:hover:ring-primary/30 relative size-[100px] overflow-hidden rounded-full ring-4 ring-neutral-100 transition-all dark:ring-neutral-800">
                        <Avatar src={data.value.avatar} size={100} />
                        <div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                          <CameraIcon class="size-6 text-white" />
                        </div>
                      </div>
                    ),
                  }}
                />
              </div>

              {/* Name & Meta */}
              <div class="min-w-0 flex-1">
                <h2 class="m-0 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {data.value.name || '–'}
                </h2>
                <p class="m-0 mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                  @{data.value.username}
                </p>
                <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {data.value.mail && (
                    <span class="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400">
                      <MailIcon class="size-3.5" aria-hidden="true" />
                      {data.value.mail}
                    </span>
                  )}
                  {data.value.lastLoginTime && (
                    <span class="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400">
                      <CalendarIcon class="size-3.5" aria-hidden="true" />
                      上次登录: <RelativeTime time={data.value.lastLoginTime} />
                    </span>
                  )}
                  {data.value.lastLoginIp && (
                    <span class="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400">
                      <GlobeIcon class="size-3.5" aria-hidden="true" />
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
          </SettingsCard>

          {/* Basic Info Section */}
          <SettingsCard title="基本信息" icon={UserIcon}>
            <SettingsItem title="昵称">
              <NInput
                value={data.value.name}
                onInput={(v) => (data.value.name = v)}
                placeholder="输入昵称…"
                inputProps={{
                  id: 'user-name',
                  autocomplete: 'name',
                }}
              />
            </SettingsItem>

            <SettingsItem title="用户名">
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
            </SettingsItem>

            <SettingsItem title="邮箱">
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
            </SettingsItem>

            <SettingsItem title="个人网站">
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
            </SettingsItem>

            <SettingsItem title="个人简介">
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
            </SettingsItem>

            <SettingsItem
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
            </SettingsItem>
          </SettingsCard>

          {/* Social Links Section */}
          <SettingsCard
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
                  <PlusIcon class="mr-1 size-4" aria-hidden="true" />
                  添加
                </NButton>
              ),
            }}
          >
            {socialEntries.value.length === 0 ? (
              <div class="rounded-lg border border-dashed border-neutral-300 py-8 text-center text-sm text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
                暂未添加任何社交链接
              </div>
            ) : (
              <div class="flex flex-col gap-3">
                {socialEntries.value.map(({ key, value }) => (
                  <div class="flex items-center gap-3" key={key}>
                    <NSelect
                      class="w-40 shrink-0"
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
                      class="focus-visible:ring-primary/50 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 dark:text-neutral-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      onClick={() => removeSocialEntry(key)}
                      aria-label={`删除 ${key} 社交链接`}
                    >
                      <TrashIcon class="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SettingsCard>
        </>
      )}
    </div>
  )
})

const UserSkeleton = defineComponent(() => {
  return () => (
    <div class="w-full">
      <section class="mb-8 w-full max-w-2xl">
        <div class="flex items-center gap-5">
          <NSkeleton circle style={{ width: '128px', height: '128px' }} />
          <div class="min-w-0 flex-1">
            <NSkeleton text style={{ width: '120px', height: '28px' }} />
            <NSkeleton
              text
              style={{ width: '80px', height: '18px', marginTop: '4px' }}
            />
            <div class="mt-3 flex gap-4">
              <NSkeleton text style={{ width: '150px' }} />
              <NSkeleton text style={{ width: '120px' }} />
            </div>
          </div>
        </div>
      </section>
      <section class="mb-8 w-full max-w-2xl">
        <NSkeleton text style={{ width: '80px', height: '20px' }} />
        <div class="mt-4 grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <NSkeleton
                text
                style={{ width: '60px', height: '16px', marginBottom: '8px' }}
              />
              <NSkeleton text style={{ width: '100%', height: '34px' }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
})
