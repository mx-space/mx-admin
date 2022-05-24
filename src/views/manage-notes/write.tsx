import { HeaderActionButton } from 'components/button/rounded-button'
import { TextBaseDrawer } from 'components/drawer/text-base-drawer'
import { EditorToggleWrapper } from 'components/editor/universal/toggle'
import { SlidersHIcon, TelegramPlaneIcon } from 'components/icons'
import { MaterialInput } from 'components/input/material-input'
import { GetLocationButton } from 'components/location/get-location-button'
import { SearchLocationButton } from 'components/location/search-button'
import { ParseContentButton } from 'components/special-button/parse-content'
import { WEB_URL } from 'constants/env'
import { MOOD_SET, WEATHER_SET } from 'constants/note'
import { add } from 'date-fns/esm'
import { useAutoSave, useAutoSaveInEditor } from 'hooks/use-auto-save'
import { useParsePayloadIntoData } from 'hooks/use-parse-payload'
import { ContentLayout } from 'layouts/content'
import { isString } from 'lodash-es'
import type { Coordinate, NoteModel, NoteMusicRecord } from 'models/note'
import type { TopicModel } from 'models/topic'
import {
  NButton,
  NButtonGroup,
  NDatePicker,
  NDynamicTags,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NSwitch,
  useMessage,
} from 'naive-ui'
import { RouteName } from 'router/name'
import type { WriteBaseType } from 'shared/types/base'
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
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { PaginateResult } from '@mx-space/api-client'
import { Icon } from '@vicons/utils'

type NoteReactiveType = {
  hide: boolean
  mood: string
  weather: string
  password: string | null
  secret: Date | null
  hasMemory: boolean
  music: NoteMusicRecord[]
  location: null | string
  coordinates: null | Coordinate
  topicId: string | null | undefined
} & WriteBaseType

const useNoteTopic = () => {
  const topics = ref([] as TopicModel[])

  const fetchTopic = async () => {
    const { data, pagination } = await RESTManager.api.topics.get<
      PaginateResult<TopicModel>
    >({
      params: {
        // TODO
        size: 50,
      },
    })

    topics.value = data
  }

  return {
    topics,
    fetchTopic,
  }
}

const NoteWriteView = defineComponent(() => {
  const route = useRoute()

  const defaultTitle = ref('写点什么呢')
  const id = computed(() => route.query.id)

  onBeforeMount(() => {
    if (id.value) {
      return
    }
    const currentTime = new Date()
    defaultTitle.value = `记录 ${currentTime.getFullYear()} 年第 ${getDayOfYear(
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
    location: '',
    coordinates: null,
    allowComment: true,

    id: undefined,
    topicId: undefined,
    images: [],
    meta: undefined,
  })

  const parsePayloadIntoReactiveData = (payload: NoteModel) =>
    useParsePayloadIntoData(data)(payload)
  const data = reactive<NoteReactiveType>(resetReactive())
  const nid = ref<number>()

  const loading = computed(() => !!(id.value && typeof data.id === 'undefined'))

  const autoSaveHook = useAutoSave(`note-${id.value || 'new'}`, 3000, () => ({
    text: data.text,
    title: data.title,
  }))

  const autoSaveInEditor = useAutoSaveInEditor(data, autoSaveHook)

  const disposer = watch(
    () => loading.value,
    (loading) => {
      if (loading) {
        return
      }

      autoSaveInEditor.enable()
      requestAnimationFrame(() => {
        disposer()
      })
    },
    { immediate: true },
  )

  onMounted(async () => {
    const $id = id.value
    if ($id && typeof $id == 'string') {
      const payload = (await RESTManager.api.notes($id).get({
        params: {
          single: true,
        },
      })) as any

      const data = payload.data

      if (data.topic) {
        topics.value.push(data.topic)
      }

      nid.value = data.nid
      data.secret = data.secret ? new Date(data.secret) : null

      const created = new Date((data as any).created)
      defaultTitle.value = `记录 ${created.getFullYear()} 年第 ${getDayOfYear(
        created,
      )} 天`

      parsePayloadIntoReactiveData(data as NoteModel)
    }
  })

  const drawerShow = ref(false)

  const message = useMessage()
  const router = useRouter()

  const enablePassword = computed(() => typeof data.password === 'string')

  const handleSubmit = async () => {
    const parseDataToPayload = (): { [key in keyof NoteModel]?: any } => {
      return {
        ...toRaw(data),
        title:
          data.title && data.title.trim()
            ? data.title.trim()
            : defaultTitle.value,
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

    await router.push({ name: RouteName.ViewNote, hash: '|publish' })
    autoSaveInEditor.clearSaved()
  }
  const { fetchTopic, topics } = useNoteTopic()

  return () => (
    <ContentLayout
      title={'树洞'}
      actionsElement={
        <>
          <ParseContentButton
            data={data}
            onHandleYamlParsedMeta={(meta) => {
              const { title, mood, weather, ...rest } = meta
              data.title = title ?? data.title
              data.mood = mood ?? data.mood
              data.weather = weather ?? data.weather

              data.meta = { ...rest }
            }}
          />

          <HeaderActionButton
            icon={<TelegramPlaneIcon />}
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
              <SlidersHIcon />
            </Icon>
          </button>
        </>
      }
    >
      <MaterialInput
        class="mt-3 relative z-10"
        label={defaultTitle.value}
        value={data.title}
        onChange={(e) => {
          data.title = e
        }}
      ></MaterialInput>

      <div class={'text-gray-500 py-3'}>
        <label>{`${WEB_URL}/notes/${nid.value ?? ''}`}</label>
      </div>

      <EditorToggleWrapper
        loading={loading.value}
        onChange={(v) => {
          data.text = v
        }}
        text={data.text}
      />

      {/* Drawer  */}
      <TextBaseDrawer
        data={data}
        show={drawerShow.value}
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
      >
        <NFormItem label="心情" required>
          <NSelect
            value={data.mood}
            filterable
            tag
            options={MOOD_SET.map((i) => ({ label: i, value: i }))}
            onUpdateValue={(e) => void (data.mood = e)}
          ></NSelect>
        </NFormItem>
        <NFormItem label="天气" required>
          <NSelect
            value={data.weather}
            filterable
            tag
            options={WEATHER_SET.map((i) => ({ label: i, value: i }))}
            onUpdateValue={(e) => void (data.weather = e)}
          ></NSelect>
        </NFormItem>

        <NFormItem label="专栏">
          <NSelect
            options={topics.value.map((topic) => ({
              label: topic.name,
              value: topic.id!,
              key: topic.id,
            }))}
            value={data.topicId}
            onUpdateValue={(value) => {
              data.topicId = value
            }}
            onFocus={() => {
              fetchTopic()
            }}
          ></NSelect>
        </NFormItem>

        <NFormItem label="获取当前地址" labelPlacement="left">
          <NSpace vertical>
            <NButtonGroup>
              <GetLocationButton
                onChange={(amap, coordinates) => {
                  data.location = amap.formattedAddress
                  data.coordinates = {
                    longitude: coordinates[0],
                    latitude: coordinates[1],
                  }
                }}
              />
              <SearchLocationButton
                placeholder={data.location}
                onChange={(locationName, coo) => {
                  data.location = locationName
                  data.coordinates = coo
                }}
              />

              <NButton
                round
                disabled={!data.location}
                onClick={() => {
                  data.location = ''
                  data.coordinates = null
                }}
              >
                清楚
              </NButton>
            </NButtonGroup>

            <NSpace vertical>
              <span>{data.location}</span>
              {data.coordinates && (
                <span>
                  {data.coordinates.longitude}, {data.coordinates.latitude}
                </span>
              )}
            </NSpace>
          </NSpace>
        </NFormItem>

        <NFormItem label="设定密码?" labelAlign="right" labelPlacement="left">
          <NSwitch
            value={enablePassword.value}
            onUpdateValue={(e) => {
              if (e) {
                data.password = ''
              } else {
                data.password = null
              }
            }}
          />
        </NFormItem>
        {enablePassword.value && (
          <NFormItem label="输入密码">
            <NInput
              disabled={!enablePassword.value}
              placeholder=""
              type="password"
              value={data.password}
              inputProps={{
                name: 'note-password',
                autocapitalize: 'off',
                autocomplete: 'new-password',
              }}
              onInput={(e) => void (data.password = e)}
            ></NInput>
          </NFormItem>
        )}
        <NFormItem
          label="多久之后公开"
          labelAlign="right"
          labelPlacement="left"
        >
          <NDatePicker
            type="datetime"
            isDateDisabled={(ts: number) => +new Date(ts) - +new Date() < 0}
            placeholder="选择时间"
            // @ts-expect-error
            value={data.secret}
            onUpdateValue={(e) => {
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

        <NFormItem label="隐藏" labelAlign="right" labelPlacement="left">
          <NSwitch
            value={data.hide}
            onUpdateValue={(e) => void (data.hide = e)}
          ></NSwitch>
        </NFormItem>

        <NFormItem
          label="标记为存在回忆项"
          labelAlign="right"
          labelPlacement="left"
        >
          <NSwitch
            value={data.hasMemory}
            onUpdateValue={(e) => void (data.hasMemory = e)}
          ></NSwitch>
        </NFormItem>

        <NFormItem label="音乐 (网易云 ID)">
          <NDynamicTags
            value={data.music.map((i) => i.id)}
            onUpdateValue={(e) => {
              data.music = e.map((id) => ({ type: 'netease', id }))
            }}
          ></NDynamicTags>
        </NFormItem>
      </TextBaseDrawer>

      {/* Drawer END */}
    </ContentLayout>
  )
})

export default NoteWriteView
