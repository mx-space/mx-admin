import {
  Check,
  ChevronLeft,
  PartyPopper,
  Rocket,
  Settings,
  User,
} from 'lucide-vue-next'
import { NDynamicTags } from 'naive-ui'
import {
  computed,
  defineComponent,
  h,
  inject,
  onBeforeMount,
  onMounted,
  provide,
  reactive,
  ref,
} from 'vue'
import { toast } from 'vue-sonner'
import type { PropType } from 'vue'
import type { UserModel } from '../../models/user'

import { systemApi } from '~/api'
import { showConfetti } from '~/utils/confetti'
import { checkIsInit } from '~/utils/is-init'

const useDefaultConfigs = () => inject<any>('configs')

// Shared input styles matching login page
const inputClass =
  'h-[42px] w-full rounded-full border-0 bg-white/20 px-4 text-sm text-white backdrop-blur-md transition-all placeholder:text-white/60 focus-visible:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'

const labelClass = 'mb-2 block text-sm font-medium text-white/90'

const buttonPrimaryClass =
  'h-[42px] rounded-full bg-white/90 px-6 text-sm font-medium text-neutral-900 transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'

const buttonSecondaryClass =
  'h-[42px] rounded-full bg-white/15 px-6 text-sm text-white/90 backdrop-blur-sm transition-all hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'

export default defineComponent({
  setup() {
    onBeforeMount(async () => {
      await checkIsInit()
    })

    const defaultConfigs = reactive<any>({})
    const isLoading = ref(true)

    onMounted(async () => {
      const configs = await systemApi.getInitDefaultConfigs()
      Object.assign(defaultConfigs, configs)
      isLoading.value = false
    })
    provide('configs', defaultConfigs)

    const step = ref(0)

    const steps = [
      { icon: Rocket, title: '开始' },
      { icon: Settings, title: '站点' },
      { icon: User, title: '账户' },
      { icon: PartyPopper, title: '完成' },
    ]

    const StepComponents = [Step0, Step1, Step2, Step3]

    return () => (
      <div class="flex min-h-screen flex-col items-center justify-center p-4">
        {/* Step Indicators */}
        <div class="mb-8 flex items-center gap-3">
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = step.value === i
            const isCompleted = step.value > i

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (i < step.value) step.value = i
                }}
                disabled={i > step.value}
                aria-label={`${s.title}${isCompleted ? '（已完成）' : isActive ? '（当前）' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                class={[
                  'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                  isActive
                    ? 'bg-white/90 text-neutral-900'
                    : isCompleted
                      ? 'cursor-pointer bg-white/40 text-white hover:bg-white/50'
                      : 'cursor-not-allowed bg-white/10 text-white/40',
                ]}
              >
                {isCompleted ? (
                  <Check class="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Icon class="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>

        {/* Title */}
        <h1 class="mb-2 text-xl font-medium tracking-wide text-white drop-shadow-lg">
          {steps[step.value].title}
        </h1>
        <p class="mb-8 text-sm text-white/70">
          {
            [
              '欢迎进行初始化配置',
              '请配置站点基本信息',
              '请创建管理员账户',
              '初始化即将完成',
            ][step.value]
          }
        </p>

        {/* Content Card */}
        <div class="w-full max-w-md">
          {isLoading.value ? (
            <div class="flex items-center justify-center py-12">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            </div>
          ) : (
            h(StepComponents[step.value], {
              onNext: () => {
                step.value++
              },
              onPrev: () => {
                step.value--
              },
            })
          )}
        </div>
      </div>
    )
  },
})

const stepFormProps = {
  onNext: {
    type: Function as PropType<() => void>,
    required: true,
  },
  onPrev: {
    type: Function as PropType<() => void>,
  },
} as const

const Step0 = defineComponent({
  props: stepFormProps,

  setup(props) {
    const handleUploadAndRestore = async () => {
      const $file = document.createElement('input')
      $file.type = 'file'
      $file.style.cssText = `position: absolute; opacity: 0; z-index: -9999;top: 0; left: 0`
      $file.accept = '.zip'
      document.body.append($file)
      $file.click()
      $file.addEventListener('change', () => {
        const file = $file.files![0]
        const formData = new FormData()
        formData.append('file', file)
        systemApi.restoreFromBackup(formData, 1 << 30).then(() => {
          toast.success('恢复成功，页面将会重载')
          setTimeout(() => {
            location.reload()
          }, 1000)
        })
      })
    }

    return () => (
      <div class="flex flex-col items-center gap-4">
        <div class="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
          <Rocket class="h-12 w-12" aria-hidden="true" />
        </div>

        <p class="mb-4 text-center text-sm text-white/80">
          开始全新配置，或从备份文件恢复
        </p>

        <div class="flex w-full max-w-xs gap-3">
          <button
            type="button"
            onClick={handleUploadAndRestore}
            class={`${buttonSecondaryClass} flex-1`}
          >
            还原备份
          </button>
          <button
            type="button"
            onClick={() => props.onNext()}
            class={`${buttonPrimaryClass} flex-1`}
          >
            开始配置
          </button>
        </div>
      </div>
    )
  },
})

const Step1 = defineComponent({
  props: stepFormProps,

  setup(props) {
    const defaultConfigs = useDefaultConfigs()

    const title = ref(defaultConfigs?.seo?.title || '')
    const keywords = ref(defaultConfigs?.seo?.keywords as string[])
    const description = ref(defaultConfigs?.seo?.description || '')
    const url = reactive({
      adminUrl: `${location.origin}/qaqdmin`,
      serverUrl: `${location.origin}/api/v2`,
      webUrl: location.origin,
      wsUrl: location.origin,
    })

    const isSubmitting = ref(false)
    const canSubmit = computed(() => title.value && description.value)

    const handleNext = async () => {
      if (isSubmitting.value || !canSubmit.value) return
      isSubmitting.value = true

      try {
        await Promise.all([
          systemApi.patchInitConfig('seo', {
            title: title.value,
            keywords: keywords.value,
            description: description.value,
          }),
          systemApi.patchInitConfig('url', { ...url }),
        ])
        props.onNext()
      } finally {
        isSubmitting.value = false
      }
    }

    return () => (
      <div class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleNext()
          }}
        >
          <div class="space-y-4">
            {/* 站点标题 */}
            <div>
              <label for="site-title" class={labelClass}>
                站点标题 <span class="text-red-300">*</span>
              </label>
              <input
                id="site-title"
                type="text"
                value={title.value}
                onInput={(e) => {
                  title.value = (e.target as HTMLInputElement).value
                }}
                placeholder="输入站点标题"
                autocomplete="organization"
                class={inputClass}
              />
            </div>

            {/* 站点描述 */}
            <div>
              <label for="site-description" class={labelClass}>
                站点描述 <span class="text-red-300">*</span>
              </label>
              <input
                id="site-description"
                type="text"
                value={description.value}
                onInput={(e) => {
                  description.value = (e.target as HTMLInputElement).value
                }}
                placeholder="输入站点描述"
                autocomplete="off"
                class={inputClass}
              />
            </div>

            {/* 关键字 */}
            <div>
              <label class={labelClass}>关键字</label>
              <NDynamicTags
                value={keywords.value}
                onUpdateValue={(e) => {
                  keywords.value = e
                }}
                class="setup-tags"
              />
            </div>

            {/* URL 设置 */}
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="web-url" class={labelClass}>
                  前端地址
                </label>
                <input
                  id="web-url"
                  type="url"
                  value={url.webUrl}
                  onInput={(e) => {
                    url.webUrl = (e.target as HTMLInputElement).value
                  }}
                  autocomplete="url"
                  class={inputClass}
                />
              </div>

              <div>
                <label for="api-url" class={labelClass}>
                  API 地址
                </label>
                <input
                  id="api-url"
                  type="url"
                  value={url.serverUrl}
                  onInput={(e) => {
                    url.serverUrl = (e.target as HTMLInputElement).value
                  }}
                  autocomplete="url"
                  class={inputClass}
                />
              </div>

              <div>
                <label for="admin-url" class={labelClass}>
                  后台地址
                </label>
                <input
                  id="admin-url"
                  type="url"
                  value={url.adminUrl}
                  onInput={(e) => {
                    url.adminUrl = (e.target as HTMLInputElement).value
                  }}
                  autocomplete="url"
                  class={inputClass}
                />
              </div>

              <div>
                <label for="gateway-url" class={labelClass}>
                  Gateway 地址
                </label>
                <input
                  id="gateway-url"
                  type="url"
                  value={url.wsUrl}
                  onInput={(e) => {
                    url.wsUrl = (e.target as HTMLInputElement).value
                  }}
                  autocomplete="url"
                  class={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div class="mt-6 flex justify-between">
            <button
              type="button"
              onClick={props.onPrev}
              class={buttonSecondaryClass}
            >
              <ChevronLeft class="mr-1 inline h-4 w-4" aria-hidden="true" />
              返回
            </button>
            <button
              type="submit"
              disabled={!canSubmit.value || isSubmitting.value}
              class={buttonPrimaryClass}
            >
              下一步
            </button>
          </div>
        </form>
      </div>
    )
  },
})

const Step2 = defineComponent({
  props: stepFormProps,
  setup(props) {
    const user = reactive({} as UserModel & { password: string })
    const repassword = ref('')
    const isSubmitting = ref(false)

    const canSubmit = computed(
      () => user.username && user.mail && user.password && repassword.value,
    )

    const handleNext = async () => {
      if (isSubmitting.value || !canSubmit.value) return

      if (repassword.value !== user.password) {
        toast.error('两次密码不一致')
        return
      }

      isSubmitting.value = true

      try {
        for (const key in user) {
          if (user[key] === '') {
            user[key] = undefined
          }
        }
        await systemApi.createOwner({
          username: user.username,
          password: user.password,
          name: user.name,
          mail: user.mail || '',
          url: user.url,
          avatar: user.avatar,
          introduce: user.introduce,
        })
        props.onNext()
      } finally {
        isSubmitting.value = false
      }
    }

    return () => (
      <div class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleNext()
          }}
        >
          <div class="space-y-4">
            {/* 用户名 */}
            <div>
              <label for="username" class={labelClass}>
                用户名（登录凭证）<span class="text-red-300">*</span>
              </label>
              <input
                id="username"
                type="text"
                value={user.username}
                onInput={(e) => {
                  user.username = (e.target as HTMLInputElement).value
                }}
                placeholder="输入用户名"
                autocomplete="username"
                class={inputClass}
              />
            </div>

            {/* 昵称 */}
            <div>
              <label for="nickname" class={labelClass}>
                昵称
              </label>
              <input
                id="nickname"
                type="text"
                value={user.name}
                onInput={(e) => {
                  user.name = (e.target as HTMLInputElement).value
                }}
                placeholder="输入昵称"
                autocomplete="name"
                class={inputClass}
              />
            </div>

            {/* 邮箱 */}
            <div>
              <label for="email" class={labelClass}>
                邮箱 <span class="text-red-300">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={user.mail}
                onInput={(e) => {
                  user.mail = (e.target as HTMLInputElement).value
                }}
                placeholder="输入邮箱"
                autocomplete="email"
                class={inputClass}
              />
            </div>

            {/* 密码 */}
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="password" class={labelClass}>
                  密码 <span class="text-red-300">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={user.password}
                  onInput={(e) => {
                    user.password = (e.target as HTMLInputElement).value
                  }}
                  placeholder="输入密码"
                  autocomplete="new-password"
                  class={inputClass}
                />
              </div>

              <div>
                <label for="confirm-password" class={labelClass}>
                  确认密码 <span class="text-red-300">*</span>
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={repassword.value}
                  onInput={(e) => {
                    repassword.value = (e.target as HTMLInputElement).value
                  }}
                  placeholder="再次输入密码"
                  autocomplete="new-password"
                  class={inputClass}
                />
              </div>
            </div>

            {/* 可选信息 */}
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="personal-url" class={labelClass}>
                  个人首页
                </label>
                <input
                  id="personal-url"
                  type="url"
                  value={user.url}
                  onInput={(e) => {
                    user.url = (e.target as HTMLInputElement).value
                  }}
                  placeholder="https://"
                  autocomplete="url"
                  class={inputClass}
                />
              </div>

              <div>
                <label for="avatar" class={labelClass}>
                  头像 URL
                </label>
                <input
                  id="avatar"
                  type="url"
                  value={user.avatar}
                  onInput={(e) => {
                    user.avatar = (e.target as HTMLInputElement).value
                  }}
                  placeholder="https://"
                  autocomplete="photo"
                  class={inputClass}
                />
              </div>
            </div>

            {/* 个人介绍 */}
            <div>
              <label for="introduce" class={labelClass}>
                个人介绍
              </label>
              <input
                id="introduce"
                type="text"
                value={user.introduce}
                onInput={(e) => {
                  user.introduce = (e.target as HTMLInputElement).value
                }}
                placeholder="一句话介绍自己"
                autocomplete="off"
                class={inputClass}
              />
            </div>
          </div>

          {/* Actions */}
          <div class="mt-6 flex justify-between">
            <button
              type="button"
              onClick={props.onPrev}
              class={buttonSecondaryClass}
            >
              <ChevronLeft class="mr-1 inline h-4 w-4" aria-hidden="true" />
              返回
            </button>
            <button
              type="submit"
              disabled={!canSubmit.value || isSubmitting.value}
              class={buttonPrimaryClass}
            >
              下一步
            </button>
          </div>
        </form>
      </div>
    )
  },
})

const Step3 = defineComponent({
  props: stepFormProps,
  setup(props) {
    const handleComplete = () => {
      localStorage.setItem('to-setting', 'true')
      showConfetti()
      setTimeout(() => {
        location.reload()
      }, 200)
    }

    return () => (
      <div class="flex flex-col items-center gap-4">
        <div class="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
          <PartyPopper class="h-12 w-12" aria-hidden="true" />
        </div>

        <p class="mb-4 text-center text-sm text-white/80">
          所有配置已完成，点击下方按钮开始使用
        </p>

        <div class="flex gap-3">
          <button
            type="button"
            onClick={props.onPrev}
            class={buttonSecondaryClass}
          >
            <ChevronLeft class="mr-1 inline h-4 w-4" aria-hidden="true" />
            返回
          </button>
          <button
            type="button"
            onClick={handleComplete}
            class={buttonPrimaryClass}
          >
            LINK START
          </button>
        </div>
      </div>
    )
  },
})
