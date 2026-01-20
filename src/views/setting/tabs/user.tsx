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
import { NButton, NInput, NSelect, NSkeleton, useMessage } from 'naive-ui'
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  unref,
  watch,
} from 'vue'
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
import { deepDiff } from '~/utils'

import styles from '../index.module.css'

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

  const message = useMessage()
  const diff = computed(() => deepDiff(origin, data.value))
  const hasChanges = computed(() => !isEmpty(diff.value))

  const { setActions: setHeaderButton } = useLayout()

  // 更新用户信息
  const updateMutation = useMutation({
    mutationFn: userApi.updateMaster,
    onSuccess: async () => {
      message.success('保存成功')
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
    if (!data.value.socialIds) {
      data.value.socialIds = {}
    }
    const availableKey =
      socialOptions.find((o) => !usedSocialKeys.value.has(o.value))?.value || ''
    data.value.socialIds = { ...data.value.socialIds, [availableKey]: '' }
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
    <div class={styles.userTabContainer}>
      {loading.value ? (
        <UserSkeleton />
      ) : (
        <>
          {/* Profile Header Section */}
          <section class={styles.userSection}>
            <div class={styles.userSectionHeader}>
              {/* Avatar with upload */}
              <div class={styles.avatarContainer}>
                <UploadWrapper
                  onFinish={handleAvatarUpload}
                  type="avatar"
                  v-slots={{
                    default: () => (
                      <div class={styles.avatarWrapper}>
                        <Avatar src={data.value.avatar} size={128} />
                        <div class={styles.avatarUploadOverlay}>
                          <CameraIcon class={styles.avatarUploadIcon} />
                        </div>
                      </div>
                    ),
                  }}
                />
              </div>

              {/* Name & Meta */}
              <div class={styles.userHeaderInfo}>
                <h2 class={styles.userName}>{data.value.name || '–'}</h2>
                <p class={styles.userHandle}>@{data.value.username}</p>
                <div class={styles.userMeta}>
                  {data.value.mail && (
                    <span class={styles.userMetaItem}>
                      <MailIcon
                        class={styles.userMetaIcon}
                        aria-hidden="true"
                      />
                      {data.value.mail}
                    </span>
                  )}
                  {data.value.lastLoginTime && (
                    <span class={styles.userMetaItem}>
                      <CalendarIcon
                        class={styles.userMetaIcon}
                        aria-hidden="true"
                      />
                      上次登录: <RelativeTime time={data.value.lastLoginTime} />
                    </span>
                  )}
                  {data.value.lastLoginIp && (
                    <span class={styles.userMetaItem}>
                      <GlobeIcon
                        class={styles.userMetaIcon}
                        aria-hidden="true"
                      />
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
          </section>

          {/* Basic Info Section */}
          <section class={styles.userSection}>
            <h3 class={styles.userSectionTitle}>
              <UserIcon class="mr-1.5 inline-block size-4" aria-hidden="true" />
              基本信息
            </h3>
            <div class={styles.formGrid}>
              <div class={styles.formGroup}>
                <label class={styles.formLabel} for="user-name">
                  昵称
                </label>
                <NInput
                  value={data.value.name}
                  onInput={(v) => (data.value.name = v)}
                  placeholder="输入昵称…"
                  inputProps={{
                    id: 'user-name',
                    autocomplete: 'name',
                  }}
                />
              </div>
              <div class={styles.formGroup}>
                <label class={styles.formLabel} for="user-username">
                  用户名
                </label>
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
              </div>
              <div class={styles.formGroup}>
                <label class={styles.formLabel} for="user-mail">
                  邮箱
                </label>
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
              </div>
              <div class={styles.formGroup}>
                <label class={styles.formLabel} for="user-url">
                  个人网站
                </label>
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
              </div>
              <div class={[styles.formGroup, styles.formGroupFull]}>
                <label class={styles.formLabel} for="user-introduce">
                  个人简介
                </label>
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
              </div>
              <div class={styles.formGroup}>
                <label class={styles.formLabel} for="user-avatar">
                  头像 URL
                </label>
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
                <p class={styles.formDescription}>
                  也可以点击上方头像直接上传图片
                </p>
              </div>
            </div>
          </section>

          {/* Social Links Section */}
          <section class={styles.userSection}>
            <div class={styles.userSectionTitleRow}>
              <h3 class={styles.userSectionTitle}>
                <LinkIcon
                  class="mr-1.5 inline-block size-4"
                  aria-hidden="true"
                />
                社交链接
              </h3>
              <NButton
                size="small"
                type="primary"
                tertiary
                onClick={addSocialEntry}
                disabled={usedSocialKeys.value.size >= socialOptions.length}
              >
                <PlusIcon class="mr-1 size-4" aria-hidden="true" />
                添加
              </NButton>
            </div>

            {socialEntries.value.length === 0 ? (
              <div class={styles.socialEmpty}>暂未添加任何社交链接</div>
            ) : (
              <div class={styles.socialList}>
                {socialEntries.value.map(({ key, value }) => (
                  <div class={styles.socialRow} key={key}>
                    <NSelect
                      class={styles.socialSelect}
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
                      class={styles.socialInput}
                      value={value}
                      onInput={(v) => updateSocialValue(key, v)}
                      placeholder="输入链接或 ID…"
                      inputProps={{ spellcheck: false }}
                    />
                    <button
                      type="button"
                      class={styles.socialRemoveBtn}
                      onClick={() => removeSocialEntry(key)}
                      aria-label={`删除 ${key} 社交链接`}
                    >
                      <TrashIcon class="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
})

const UserSkeleton = defineComponent(() => {
  return () => (
    <div class={styles.userTabContainer}>
      <section class={styles.userSection}>
        <div class={styles.userSectionHeader}>
          <NSkeleton circle style={{ width: '128px', height: '128px' }} />
          <div class={styles.userHeaderInfo}>
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
      <section class={styles.userSection}>
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
