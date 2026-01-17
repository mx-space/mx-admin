import { cloneDeep, isEmpty } from 'es-toolkit/compat'
import {
  Calendar as CalendarIcon,
  Camera as CameraIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NInput,
  NSelect,
  NSkeleton,
  NUploadDragger,
  useMessage,
} from 'naive-ui'
import { computed, defineComponent, onMounted, ref } from 'vue'
import type { UserModel } from '~/models/user'

import Avatar from '~/components/avatar'
import { IpInfoPopover } from '~/components/ip-info'
import { RelativeTime } from '~/components/time/relative-time'
import { UploadWrapper } from '~/components/upload'
import { socialKeyMap } from '~/constants/social'
import { deepDiff, RESTManager } from '~/utils'

import styles from '../index.module.css'

export const TabUser = defineComponent(() => {
  const data = ref({} as UserModel)
  const loading = ref(true)
  let origin: UserModel

  async function fetchMaster() {
    loading.value = true
    const response = (await RESTManager.api.master.get()) as UserModel
    data.value = response
    origin = { ...response }
    loading.value = false
  }

  onMounted(async () => {
    await fetchMaster()
  })

  const message = useMessage()
  const diff = computed(() => deepDiff(origin, data.value))

  const handleSave = async () => {
    const submitData = cloneDeep(unref(diff))
    if (submitData.socialIds) {
      submitData.socialIds = data.value.socialIds
    }

    await RESTManager.api.master.patch({
      data: submitData,
    })
    message.success('保存成功')
    await fetchMaster()
  }

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

  return () => (
    <div class={styles.userTabContainer}>
      {loading.value ? (
        <ProfileSkeleton />
      ) : (
        <>
          <section class={styles.userSection}>
            <div class={styles.userSectionHeader}>
              <UploadWrapper
                type="avatar"
                onFinish={(ev) => {
                  const { file, event } = ev
                  try {
                    const res = JSON.parse(
                      (event?.target as XMLHttpRequest).responseText,
                    )
                    data.value.avatar = res.url
                  } catch {
                    // noop
                  }
                  return file
                }}
              >
                <NUploadDragger class="border-0 bg-transparent p-0 hover:border-0">
                  <div class={styles.avatarWrapper}>
                    <Avatar src={data.value.avatar} size={80} />
                    <div class={styles.avatarUploadOverlay}>
                      <CameraIcon class={styles.avatarUploadIcon} />
                    </div>
                  </div>
                </NUploadDragger>
              </UploadWrapper>

              <div class={styles.userHeaderInfo}>
                <h2 class={styles.userName}>{data.value.name || 'Unnamed'}</h2>
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
                      <MapPinIcon
                        class={styles.userMetaIcon}
                        aria-hidden="true"
                      />
                      <IpInfoPopover
                        trigger="hover"
                        ip={data.value.lastLoginIp}
                        triggerEl={
                          <span class="cursor-pointer">
                            {data.value.lastLoginIp}
                          </span>
                        }
                      />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section class={styles.userSection}>
            <h3 class={styles.userSectionTitle}>基本信息</h3>
            <div class={styles.formGrid}>
              <div class={styles.formGroup}>
                <label class={styles.formLabel}>用户名</label>
                <NInput
                  value={data.value.username}
                  onUpdateValue={(e) => {
                    data.value.username = e?.trim() || ''
                  }}
                  placeholder="用于登录的用户名"
                />
              </div>

              <div class={styles.formGroup}>
                <label class={styles.formLabel}>昵称</label>
                <NInput
                  value={data.value.name}
                  onUpdateValue={(e) => {
                    data.value.name = e?.trim() || ''
                  }}
                  placeholder="显示的昵称"
                />
              </div>

              <div class={styles.formGroup}>
                <label class={styles.formLabel}>邮箱</label>
                <NInput
                  value={data.value.mail}
                  onUpdateValue={(e) => {
                    data.value.mail = e
                  }}
                  placeholder="your@email.com"
                  inputProps={{ type: 'email', autocomplete: 'email' }}
                />
              </div>

              <div class={styles.formGroup}>
                <label class={styles.formLabel}>个人首页</label>
                <NInput
                  value={data.value.url}
                  onUpdateValue={(e) => {
                    data.value.url = e
                  }}
                  placeholder="https://example.com"
                  inputProps={{ type: 'url', autocomplete: 'url' }}
                />
              </div>

              <div class={styles.formGroup}>
                <label class={styles.formLabel}>头像 URL</label>
                <NInput
                  value={data.value.avatar}
                  onUpdateValue={(e) => {
                    data.value.avatar = e
                  }}
                  placeholder="https://example.com/avatar.png"
                />
                <span class={styles.formDescription}>
                  可直接输入 URL 或点击上方头像上传
                </span>
              </div>

              <div class={[styles.formGroup, styles.formGroupFull]}>
                <label class={styles.formLabel}>个人介绍</label>
                <NInput
                  type="textarea"
                  rows={3}
                  value={data.value.introduce}
                  onUpdateValue={(e) => {
                    data.value.introduce = e
                  }}
                  placeholder="写点什么介绍一下自己吧…"
                />
              </div>
            </div>
          </section>

          <section class={styles.userSection}>
            <div class={styles.userSectionTitleRow}>
              <h3 class={styles.userSectionTitle}>社交平台</h3>
              <NButton size="small" quaternary onClick={addSocialEntry}>
                {{
                  icon: () => <PlusIcon class="size-4" />,
                  default: () => '添加',
                }}
              </NButton>
            </div>

            <div class={styles.socialList}>
              {socialEntries.value.length === 0 ? (
                <div class={styles.socialEmpty}>暂无社交平台，点击上方添加</div>
              ) : (
                socialEntries.value.map((entry, index) => (
                  <div key={`${entry.key}-${index}`} class={styles.socialRow}>
                    <NSelect
                      class={styles.socialSelect}
                      value={entry.key}
                      onUpdateValue={(newKey) =>
                        updateSocialKey(entry.key, newKey)
                      }
                      options={socialOptions.map((o) => ({
                        ...o,
                        disabled:
                          o.value !== entry.key &&
                          usedSocialKeys.value.has(o.value),
                      }))}
                      filterable
                      tag
                      placeholder="选择平台"
                    />
                    <NInput
                      class={styles.socialInput}
                      value={entry.value}
                      onUpdateValue={(v) => updateSocialValue(entry.key, v)}
                      placeholder="输入账号或链接"
                    />
                    <button
                      type="button"
                      class={styles.socialRemoveBtn}
                      onClick={() => removeSocialEntry(entry.key)}
                      aria-label="删除"
                    >
                      <TrashIcon class="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <div class={styles.actionFooter}>
            <NButton
              type="primary"
              onClick={handleSave}
              disabled={isEmpty(diff.value)}
            >
              保存更改
            </NButton>
          </div>
        </>
      )}
    </div>
  )
})

const ProfileSkeleton = defineComponent(() => {
  return () => (
    <div class={styles.userSection}>
      <div class={styles.userSectionHeader}>
        <NSkeleton circle width={80} height={80} />
        <div class={styles.userHeaderInfo}>
          <NSkeleton
            text
            style={{ width: '120px', height: '24px', marginBottom: '8px' }}
          />
          <NSkeleton
            text
            style={{ width: '80px', height: '16px', marginBottom: '12px' }}
          />
          <div class="flex gap-4">
            <NSkeleton text style={{ width: '100px', height: '14px' }} />
            <NSkeleton text style={{ width: '120px', height: '14px' }} />
          </div>
        </div>
      </div>
    </div>
  )
})
