import {
  NButton,
  NCard,
  NDynamicTags,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NSpin,
  NStep,
  NSteps,
  useMessage,
} from 'naive-ui'
import type { PropType } from 'vue'
import { defineComponent, ref } from 'vue'

import type { UserModel } from '../../models/user'
import { getToken, removeToken } from '../../utils'
import { RESTManager } from '../../utils/rest'
import styles from './index.module.css'

const useDefaultConfigs = () => inject<any>('configs')
export default defineComponent({
  setup() {
    onBeforeMount(() => {
      if (getToken()) {
        removeToken()
      }
    })

    const defaultConfigs = reactive<any>({})
    onMounted(async () => {
      const configs = await RESTManager.api.init.configs.default.get<any>()
      Object.assign(defaultConfigs, configs)
    })
    provide('configs', defaultConfigs)

    const step = ref(0)

    return () => (
      <div class={styles.full}>
        <NCard title="初始化" class="modal-card sm m-auto form-card">
          <NSteps size="small" current={step.value}>
            <NStep
              status={step.value > 0 ? 'finish' : 'process'}
              title="站点设置"
              description="先设置一下站点相关配置吧"
            ></NStep>

            <NStep
              status={
                step.value > 1 ? 'finish' : step.value < 1 ? 'wait' : 'process'
              }
              title="主人信息"
              description="请告诉你的名字"
            ></NStep>
            <NStep
              status={
                step.value > 2 ? 'finish' : step.value < 2 ? 'wait' : 'process'
              }
              title="(๑•̀ㅂ•́)و✧"
              description="一切就绪了"
            ></NStep>
          </NSteps>

          <div class="mt-[3.5rem]">
            {JSON.stringify(defaultConfigs) === '{}' ? (
              <div class="text-center py-4">
                <NSpin />
              </div>
            ) : (
              h([Step1, Step2, Step3][step.value], {
                onNext() {
                  step.value++
                },
              })
            )}
          </div>
        </NCard>
      </div>
    )
  },
})

const stepFormProps = {
  onNext: {
    type: Function as PropType<() => void>,
    required: true,
  },
} as const

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

    const handleNext = async () => {
      await Promise.all([
        RESTManager.api.init.configs('seo').patch({
          data: {
            title: title.value,
            keywords: keywords.value,
            description: description.value,
          },
        }),
        RESTManager.api.init.configs('url').patch({
          data: {
            ...url,
          },
        }),
      ])
      props.onNext()
    }

    // TODO 数据验证
    return () => (
      <NForm>
        <NFormItem label="站点标题" required>
          <NInput
            value={title.value}
            onUpdateValue={(e) => void (title.value = e)}
          ></NInput>
        </NFormItem>

        <NFormItem label="站点描述" required>
          <NInput
            value={description.value}
            onUpdateValue={(e) => void (description.value = e)}
          ></NInput>
        </NFormItem>
        <NFormItem label="关键字">
          <NDynamicTags
            value={keywords.value}
            onUpdateValue={(e) => void (keywords.value = e)}
          ></NDynamicTags>
        </NFormItem>

        <NFormItem label="前端地址">
          <NInput
            value={url.webUrl}
            onInput={(e) => void (url.webUrl = e)}
          ></NInput>
        </NFormItem>

        <NFormItem label="API 地址">
          <NInput
            value={url.serverUrl}
            onInput={(e) => void (url.serverUrl = e)}
          ></NInput>
        </NFormItem>

        <NFormItem label="后台地址">
          <NInput
            value={url.adminUrl}
            onInput={(e) => void (url.adminUrl = e)}
          ></NInput>
        </NFormItem>

        <NFormItem label="Gateway 地址">
          <NInput
            value={url.wsUrl}
            onInput={(e) => void (url.wsUrl = e)}
          ></NInput>
        </NFormItem>
        <NSpace justify="end">
          <NButton onClick={handleNext} round type="primary">
            下一步
          </NButton>
        </NSpace>
      </NForm>
    )
  },
})

const Step2 = defineComponent({
  props: stepFormProps,
  setup(props) {
    const user = reactive<UserModel & { password: string }>({} as any)
    const repassword = ref('')
    const message = useMessage()
    const handleNext = async () => {
      if (repassword.value !== user.password) {
        message.error('两次密码不一致')
        return
      }

      await RESTManager.api.user.register.post({
        data: {
          ...user,
        },
      })

      props.onNext()
    }
    return () => (
      <NForm>
        <NFormItem label="你的名字 (登录凭证)" required>
          <NInput
            value={user.username}
            onUpdateValue={(e) => {
              user.username = e
            }}
          />
        </NFormItem>

        <NFormItem label="昵称">
          <NInput
            value={user.name}
            onUpdateValue={(e) => {
              user.name = e
            }}
          />
        </NFormItem>

        <NFormItem label="邮箱" required>
          <NInput
            value={user.mail}
            onUpdateValue={(e) => {
              user.mail = e
            }}
          />
        </NFormItem>

        <NFormItem label="密码" required>
          <NInput
            value={user.password}
            type="password"
            onUpdateValue={(e) => {
              user.password = e
            }}
          />
        </NFormItem>

        <NFormItem label="确认密码" required>
          <NInput
            value={repassword.value}
            type="password"
            onUpdateValue={(e) => {
              repassword.value = e
            }}
          />
        </NFormItem>

        <NFormItem label="个人首页">
          <NInput
            value={user.url}
            onUpdateValue={(e) => {
              user.url = e
            }}
          />
        </NFormItem>
        <NFormItem label="头像">
          <NInput
            value={user.avatar}
            onUpdateValue={(e) => {
              user.avatar = e
            }}
          />
        </NFormItem>

        <NFormItem label="个人介绍">
          <NInput
            value={user.introduce}
            onUpdateValue={(e) => {
              user.introduce = e
            }}
          />
        </NFormItem>
        <NSpace justify="end">
          <NButton
            disabled={
              !user.username ||
              !user.mail ||
              !user.password ||
              !repassword.value
            }
            onClick={handleNext}
            round
            type="primary"
          >
            下一步
          </NButton>
        </NSpace>
      </NForm>
    )
  },
})

const Step3 = defineComponent({
  props: stepFormProps,
  setup() {
    return () => (
      <NSpace class="text-center" vertical>
        <span class="text-base">你已经完成了所有的步骤，干得漂亮。</span>
        <NButton
          type="primary"
          round
          onClick={() => {
            localStorage.setItem('to-setting', 'true')
            location.reload()
          }}
        >
          LINK START
        </NButton>
      </NSpace>
    )
  },
})
