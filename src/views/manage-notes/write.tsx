import { SlidersH } from '@vicons/fa'
import { Send16Filled } from '@vicons/fluent'
import { Icon } from '@vicons/utils'
import { HeaderActionButton } from 'components/button/rounded-button'
import { MonacoEditor } from 'components/editor/monaco'
import { MaterialInput } from 'components/input/material-input'
import { ParseContentButton } from 'components/logic/parse-button'
import { baseUrl } from 'constants/env'
import { MOOD_SET, WEATHER_SET } from 'constants/note'
import { add } from 'date-fns/esm'
import { useParsePayloadIntoData } from 'hooks/use-parse-payload'
import { ContentLayout } from 'layouts/content'
import { isString } from 'lodash-es'
import { NoteModel, NoteMusicRecord } from 'models/note'
import { editor as Editor } from 'monaco-editor'
import {
  NButton,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NDynamicTags,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NSwitch,
  useMessage,
} from 'naive-ui'
import { RouteName } from 'router/constants'
import { RESTManager } from 'utils/rest'
import { getDayOfYear } from 'utils/time'
import {
  computed,
  defineComponent,
  onBeforeMount,
  onMounted,
  reactive,
  ref,
  toRaw,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
type NoteReactiveType = {
  title: string
  text: string
  hide: boolean
  mood: string
  weather: string
  password: string | null
  secret: Date | null
  hasMemory: boolean
  music: NoteMusicRecord[]
}

const NoteWriteView = defineComponent(() => {
  const route = useRoute()

  let defaultTitle: string

  onBeforeMount(() => {
    const currentTime = new Date()
    defaultTitle = `记录 ${currentTime.getFullYear()} 年第 ${getDayOfYear(
      currentTime,
    )} 天`
  })

  const resetReactive: () => NoteReactiveType = () => ({
    text: '',
    title: '',
    hide: false,
    hasMemory: false,
    mood: '',
    music: [],
    password: null,
    secret: null,
    weather: '',
  })

  const parsePayloadIntoReactiveData = (payload: NoteModel) =>
    useParsePayloadIntoData(data)(payload)
  const data = reactive<NoteReactiveType>(resetReactive())
  const id = computed(() => route.query.id)
  const nid = ref<number>()
  onMounted(async () => {
    const $id = id.value
    if ($id && typeof $id == 'string') {
      const payload = (await RESTManager.api.notes($id).get({
        params: {
          single: true,
        },
      })) as any

      const data = payload.data
      nid.value = data.nid
      data.secret = data.secret ? new Date(data.secret) : null
      parsePayloadIntoReactiveData(data as NoteModel)
    }
  })

  const monacoRef = ref<Editor.IStandaloneCodeEditor>()

  const drawerShow = ref(false)

  const message = useMessage()
  const router = useRouter()

  const handleSubmit = async () => {
    const parseDataToPayload = (): { [key in keyof NoteModel]?: any } => {
      return {
        ...toRaw(data),
        title:
          data.title && data.title.trim() ? data.title.trim() : defaultTitle,
        password:
          data.password && data.password.length > 0 ? data.password : null,
        secret: data.secret
          ? (() => {
              const date = new Date(data.secret)
              if (+date - +new Date() <= 0) {
                return null
              } else {
                return date
              }
            })()
          : null,
        music: data.music,
      }
    }
    if (id.value) {
      // update
      if (!isString(id.value)) {
        return
      }
      const $id = id.value as string
      await RESTManager.api.notes($id).put({
        data: parseDataToPayload(),
      })
      message.success('修改成功')
    } else {
      // create
      await RESTManager.api.notes.post({
        data: parseDataToPayload(),
      })
      message.success('发布成功')
    }

    router.push({ name: RouteName.ViewNote, hash: '|publish' })
  }

  return () => (
    <ContentLayout
      title={'树洞'}
      actionsElement={
        <>
          <ParseContentButton data={data} />

          <HeaderActionButton
            icon={<Send16Filled />}
            onClick={handleSubmit}
          ></HeaderActionButton>
        </>
      }
      footerButtonElement={
        <>
          <button
            onClick={() => {
              drawerShow.value = true
            }}
          >
            <Icon>
              <SlidersH />
            </Icon>
          </button>
        </>
      }
    >
      <MaterialInput
        class="mt-3 relative z-10"
        label={defaultTitle}
        value={data.title}
        onChange={e => {
          data.title = e
        }}
      ></MaterialInput>

      <div class={'text-gray-500 py-3'}>
        <label>{`${baseUrl}/notes/${nid.value ?? ''}`}</label>
      </div>

      <MonacoEditor
        onChange={v => {
          data.text = v
        }}
        text={data.text}
        // @ts-expect-error
        innerRef={monacoRef}
      />

      {/* Drawer  */}

      <NDrawer
        show={drawerShow.value}
        width={450}
        placement="right"
        onUpdateShow={s => {
          drawerShow.value = s
        }}
      >
        <NDrawerContent title="文章设定">
          <NForm>
            <NFormItem label="心情" required>
              <NSelect
                value={data.mood}
                filterable
                tag
                options={MOOD_SET.map(i => ({ label: i, value: i }))}
                onUpdateValue={e => (data.mood = e)}
              ></NSelect>
            </NFormItem>
            <NFormItem label="天气" required>
              <NSelect
                value={data.weather}
                filterable
                tag
                options={WEATHER_SET.map(i => ({ label: i, value: i }))}
                onUpdateValue={e => (data.weather = e)}
              ></NSelect>
            </NFormItem>
            <NFormItem label="设定密码?">
              <NInput
                placeholder=""
                type="password"
                value={data.password}
                onInput={e => (data.password = e)}
              ></NInput>
            </NFormItem>
            <NFormItem
              label="多久之后公开"
              labelWidth={'50%'}
              labelAlign="right"
              labelPlacement="left"
            >
              <NDatePicker
                type="datetime"
                isDateDisabled={(ts: number) => +new Date(ts) - +new Date() < 0}
                placeholder="选择时间"
                // @ts-expect-error
                value={data.secret}
                onUpdateValue={e => {
                  data.secret = e ? new Date(e) : null
                }}
              >
                {{
                  footer: () => {
                    const date = new Date()
                    return (
                      <NSpace>
                        <NButton
                          round
                          type="default"
                          size="small"
                          onClick={() => {
                            data.secret = add(date, { days: 1 })
                          }}
                        >
                          一天后
                        </NButton>
                        <NButton
                          round
                          type="default"
                          size="small"
                          onClick={() => {
                            data.secret = add(date, { weeks: 1 })
                          }}
                        >
                          一周后
                        </NButton>
                        <NButton
                          round
                          type="default"
                          size="small"
                          onClick={() => {
                            data.secret = add(date, { days: 14 })
                          }}
                        >
                          半个月后
                        </NButton>
                        <NButton
                          round
                          type="default"
                          size="small"
                          onClick={() => {
                            data.secret = add(date, { months: 1 })
                          }}
                        >
                          一个月后
                        </NButton>
                      </NSpace>
                    )
                  },
                }}
              </NDatePicker>
            </NFormItem>

            <NFormItem
              label="隐藏"
              labelWidth={'50%'}
              labelAlign="right"
              labelPlacement="left"
            >
              <NSwitch
                value={data.hide}
                onUpdateValue={e => (data.hide = e)}
              ></NSwitch>
            </NFormItem>

            <NFormItem
              label="是否存在回忆, 日后需要重温?"
              labelAlign="right"
              labelPlacement="left"
              labelWidth={'50%'}
            >
              <NSwitch
                value={data.hasMemory}
                onUpdateValue={e => (data.hasMemory = e)}
              ></NSwitch>
            </NFormItem>

            <NFormItem label="音乐 (网易云 ID)">
              <NDynamicTags
                value={data.music.map(i => i.id)}
                onUpdateValue={e => {
                  data.music = e.map(id => ({ type: 'netease', id }))
                }}
              ></NDynamicTags>
            </NFormItem>
          </NForm>
        </NDrawerContent>
      </NDrawer>
      {/* Drawer END */}
    </ContentLayout>
  )
})

export default NoteWriteView
