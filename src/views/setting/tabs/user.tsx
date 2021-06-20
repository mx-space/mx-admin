import Avatar from 'components/avatar'
import { IpInfoPopover } from 'components/ip-info'
import { RelativeTime } from 'components/time/relative-time'
import { omit, isEmpty } from 'lodash-es'
import { UserModel } from 'models/user'
import {
  NButton,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NText,
  useMessage,
} from 'naive-ui'
import { RESTManager, shallowDiff } from 'utils'
import { defineComponent, ref, onMounted, computed } from 'vue'
import styles from './user.module.css'

export const TabUser = defineComponent(() => {
  const data = ref({} as UserModel)
  let origin: UserModel

  async function fetchMaster() {
    const response = (await RESTManager.api.master.get()) as any
    data.value = omit(response, ['ok']) as any
    origin = { ...response }
  }

  onMounted(async () => {
    await fetchMaster()
  })
  const message = useMessage()
  const diff = computed(() => shallowDiff(origin, data.value))
  const handleSave = async () => {
    await RESTManager.api.master.patch({
      data: diff.value,
    })
    message.success('保存成功~')
    await fetchMaster()
  }
  return () => (
    <Fragment>
      <NGrid cols={2} class={styles['tab-user']} xGap={20} yGap={20}>
        <NGi>
          <NForm class="flex flex-col justify-center items-center ">
            <NFormItem>
              <div class={styles['avatar']}>
                <Avatar src={data.value.avatar} size={200}></Avatar>
              </div>
            </NFormItem>

            <NFormItem label="上次登陆时间" class="!mt-4">
              <div class="text-center w-full">
                <NText>
                  {data.value.lastLoginTime ? (
                    <RelativeTime
                      time={data.value.lastLoginTime}
                    ></RelativeTime>
                  ) : (
                    'N/A'
                  )}
                </NText>
              </div>
            </NFormItem>

            <NFormItem label="上次登陆地址">
              <div class="text-center w-full">
                {data.value.lastLoginIp ? (
                  <IpInfoPopover
                    trigger={'hover'}
                    ip={data.value.lastLoginIp}
                    triggerEl={
                      <NText class="cursor-pointer">
                        {data.value.lastLoginIp}
                      </NText>
                    }
                  ></IpInfoPopover>
                ) : (
                  'N/A'
                )}
              </div>
            </NFormItem>

            <NFormItem>
              <NButton
                round
                class="-mt-14"
                type="primary"
                onClick={handleSave}
                disabled={isEmpty(diff.value)}
              >
                保存
              </NButton>
            </NFormItem>
          </NForm>
        </NGi>

        <NGi>
          <NForm>
            <NFormItem label="主人名 (username)">
              <NInput
                value={data.value.username}
                onInput={(e) => {
                  data.value.username = e
                }}
              />
            </NFormItem>

            <NFormItem label="主人昵称 (name)">
              <NInput
                value={data.value.name}
                onInput={(e) => {
                  data.value.name = e
                }}
              />
            </NFormItem>

            <NFormItem label="主人邮箱 (mail)">
              <NInput
                value={data.value.mail}
                onInput={(e) => {
                  data.value.mail = e
                }}
              />
            </NFormItem>

            <NFormItem label="个人首页">
              <NInput
                value={data.value.url}
                onInput={(e) => {
                  data.value.url = e
                }}
              />
            </NFormItem>
            <NFormItem label="头像">
              <NInput
                value={data.value.avatar}
                onInput={(e) => {
                  data.value.avatar = e
                }}
              />
            </NFormItem>

            <NFormItem label="个人介绍">
              <NInput
                value={data.value.introduce}
                onInput={(e) => {
                  data.value.introduce = e
                }}
              />
            </NFormItem>
          </NForm>
        </NGi>
      </NGrid>
    </Fragment>
  )
})
