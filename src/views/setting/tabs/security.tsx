import { Plus } from '@vicons/fa/es'
import { Icon } from '@vicons/utils'
import { RelativeTime } from 'components/time/relative-time'
import { TokenModel } from 'models/token'
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NLayoutContent,
  NModal,
  NPopconfirm,
  NSpace,
  NSwitch,
  NText,
} from 'naive-ui'
import { RouteName } from 'router/name'
import { parseDate, removeToken, RESTManager } from 'utils'
import { defineComponent, onBeforeMount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSystemHeaderAction } from '..'
import { autosizeableProps } from './system'

export const TabSecurity = defineComponent(() => {
  const headerRef = useSystemHeaderAction()

  return () => (
    <Fragment>
      <div class="pt-4"></div>
      <NCollapse defaultExpandedNames={['reset']} displayDirective="if">
        <NCollapseItem name="reset" title="修改密码">
          <ResetPass />
        </NCollapseItem>

        <NCollapseItem name="token" title="API Token">
          <ApiToken />
        </NCollapseItem>
      </NCollapse>
    </Fragment>
  )
})

const ApiToken = defineComponent(() => {
  const tokens = ref([] as TokenModel[])

  const defaultModel = () => ({
    name: '',
    expired: false,
    expiredTime: new Date(),
  })
  const dataModel = reactive(defaultModel())
  const fetchToken = async () => {
    const { data } = (await RESTManager.api.auth.token.get()) as any
    tokens.value = data
  }

  onBeforeMount(() => {
    fetchToken()
  })
  const newTokenDialogShow = ref(false)
  const newToken = async () => {
    const payload = {
      name: dataModel.name,
      expired: dataModel.expired
        ? dataModel.expiredTime.toISOString()
        : undefined,
    }

    const response = (await RESTManager.api.auth.token.post({
      data: payload,
    })) as TokenModel

    await navigator.clipboard.writeText(response.token)

    newTokenDialogShow.value = false
    const n = defaultModel()
    for (const key in n) {
      dataModel[key] = n[key]
    }
    message.success('生成成功, Token 已复制, ' + response.token)
    await fetchToken()
    // Backend bug.
    const index = tokens.value.findIndex((i) => i.name === payload.name)
    if (index !== -1) {
      tokens.value[index].token = response.token
    }
  }

  const onDeleteToken = async (id) => {
    await RESTManager.api.auth.token.delete({ params: { id } })
    message.success('删除成功')
    const index = tokens.value.findIndex((i) => i.id === id)
    if (index != -1) {
      tokens.value.splice(index, 1)
    }
  }
  return () => (
    <NLayoutContent class="!overflow-visible">
      <NModal
        show={newTokenDialogShow.value}
        onUpdateShow={(e) => void (newTokenDialogShow.value = e)}
      >
        <NCard bordered={false} title="创建 Token" class="max-w-full w-[500px]">
          <NForm>
            <NFormItem label="名称" required>
              <NInput
                value={dataModel.name}
                onInput={(e) => void (dataModel.name = e)}
              ></NInput>
            </NFormItem>

            <NFormItem label="是否过期">
              <NSwitch
                value={dataModel.expired}
                onUpdateValue={(e) => void (dataModel.expired = e)}
              ></NSwitch>
            </NFormItem>

            <NFormItem label="过期时间">
              <NDatePicker
                disabled={!dataModel.expired}
                // @ts-expect-error
                value={dataModel.expiredTime}
                type="datetime"
                onUpdateValue={(e) =>
                  void (dataModel.expiredTime = new Date(e))
                }
              ></NDatePicker>
            </NFormItem>
          </NForm>
          <NSpace>
            <NButton
              round
              onClick={() => void (newTokenDialogShow.value = false)}
            >
              取消
            </NButton>
            <NButton round type="primary" onClick={newToken}>
              确定
            </NButton>
          </NSpace>
        </NCard>
      </NModal>

      <NButton
        class="absolute right-0 top-[-3rem]"
        round
        type="primary"
        onClick={() => {
          newTokenDialogShow.value = true
        }}
      >
        <Icon>
          <Plus />
        </Icon>
        <span class="ml-2">新增</span>
      </NButton>
      <NDataTable
        remote
        bordered={false}
        data={tokens.value}
        columns={[
          { key: 'name', title: '名称' },
          {
            key: 'token',
            title: 'Token',
            render({ token }) {
              return token ?? '*'.repeat(40)
            },
          },
          {
            title: '创建时间',
            key: 'created',
            render({ created }) {
              return <RelativeTime time={created} />
            },
          },
          {
            title: '过期时间',
            key: 'expired',
            render({ expired }) {
              return parseDate(expired, 'yyyy年M月d日 HH:mm:ss')
            },
          },
          {
            title: '操作',
            key: 'id',
            render({ id, name }) {
              return (
                <NSpace>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={() => {
                      onDeleteToken(id)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton text type="error">
                          删除
                        </NButton>
                      ),

                      default: () => (
                        <span style={{ maxWidth: '12rem' }}>
                          确定要删除 Token "{name}"?
                        </span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          },
        ]}
      ></NDataTable>
    </NLayoutContent>
  )
})
const ResetPass = defineComponent(() => {
  const resetPassword = reactive({
    password: '',
    reenteredPassword: '',
  })
  const formRef = ref<typeof NForm>()
  const router = useRouter()
  const reset = async () => {
    if (!formRef.value) {
      return
    }

    formRef.value.validate(async (err) => {
      if (!err) {
        await RESTManager.api.master.patch({
          data: {
            password: resetPassword.password,
          },
        })
        message.success('更改成功')
        removeToken()
        router.push({ name: RouteName.Login })
      } else {
        console.log(err)
      }
    })
  }

  function validatePasswordSame(rule, value) {
    console.log(rule)

    return value === resetPassword.password
  }

  return () => (
    <NForm
      class="max-w-[300px]"
      ref={formRef}
      model={resetPassword}
      rules={{
        password: [
          {
            required: true,
            message: '请输入密码',
          },
        ],
        reenteredPassword: [
          {
            required: true,
            message: '请再次输入密码',
            trigger: ['input', 'blur'],
          },
          {
            validator: validatePasswordSame,
            message: '两次密码输入不一致',
            trigger: ['blur', 'password-input'],
          },
        ],
      }}
    >
      <NFormItem label="新密码" required path="password">
        <NInput
          {...autosizeableProps}
          value={resetPassword.password}
          onInput={(e) => void (resetPassword.password = e)}
          type="password"
        />
      </NFormItem>
      <NFormItem label="重复密码" required path="reenteredPassword">
        <NInput
          {...autosizeableProps}
          value={resetPassword.reenteredPassword}
          onInput={(e) => void (resetPassword.reenteredPassword = e)}
          type="password"
        />
      </NFormItem>
      <div class="w-full text-right">
        <NButton onClick={reset} type="primary" round>
          保存
        </NButton>
      </div>
    </NForm>
  )
})
