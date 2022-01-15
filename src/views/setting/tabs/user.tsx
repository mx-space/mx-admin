import Avatar from 'components/avatar'
import { IpInfoPopover } from 'components/ip-info'
import { KVEditor } from 'components/kv-editor'
import { RelativeTime } from 'components/time/relative-time'
import { socialKeyMap } from 'constants/social'
import { cloneDeep, isEmpty } from 'lodash-es'
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
import { deepDiff, RESTManager } from 'utils'
import { computed, defineComponent, onMounted, ref } from 'vue'
import styles from './user.module.css'

export const TabUser = defineComponent(() => {
  const data = ref({} as UserModel)
  let origin: UserModel

  async function fetchMaster() {
    const response = (await RESTManager.api.master.get()) as UserModel
    data.value = response

    origin = { ...response }
  }

  onMounted(async () => {
    await fetchMaster()
  })
  const message = useMessage()
  const diff = computed(() => deepDiff(origin, data.value))
  const handleSave = async () => {
    const submitData = cloneDeep(unref(diff))
    // 数组合并
    if (submitData.socialIds) {
      submitData.socialIds = data.value.socialIds
    }

    await RESTManager.api.master.patch({
      data: submitData,
    })
    message.success('保存成功~')
    await fetchMaster()
  }

  return () => (
    <Fragment>
      <NGrid
        cols={'1 400:1 600:2'}
        class={styles['tab-user']}
        xGap={20}
        yGap={20}
      >
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
                type="textarea"
                resizable={false}
                value={data.value.introduce}
                onInput={(e) => {
                  data.value.introduce = e
                }}
              />
            </NFormItem>

            <NFormItem label="社交平台 ID 录入">
              <KVEditor
                options={Object.keys(socialKeyMap).map((key) => {
                  return { label: key, value: socialKeyMap[key] }
                })}
                onChange={(newValue) => {
                  data.value.socialIds = newValue
                }}
                value={data.value.socialIds || {}}
              ></KVEditor>
            </NFormItem>
          </NForm>
        </NGi>
      </NGrid>
    </Fragment>
  )
})
