import { add } from 'date-fns'
import { isString } from 'es-toolkit/compat'
import {
  BookmarkIcon,
  MapPinIcon,
  SlidersHorizontal as SlidersHIcon,
  Send as TelegramPlaneIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NDatePicker,
  NInput,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui'
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
import type { Coordinate, NoteModel } from '~/models/note'
import type { TopicModel } from '~/models/topic'
import type { WriteBaseType } from '~/shared/types/base'

import { AiHelperButton } from '~/components/ai/ai-helper'
import { HeaderActionButton } from '~/components/button/rounded-button'
import {
  FieldGroup,
  FormField,
  SectionTitle,
  SwitchRow,
  TextBaseDrawer,
} from '~/components/drawer/text-base-drawer'
import { WriteEditor } from '~/components/editor/write-editor'
import { GetLocationButton } from '~/components/location/get-location-button'
import { SearchLocationButton } from '~/components/location/search-button'
import { ParseContentButton } from '~/components/special-button/parse-content'
import { HeaderPreviewButton } from '~/components/special-button/preview'
import { WEB_URL } from '~/constants/env'
import { MOOD_SET, WEATHER_SET } from '~/constants/note'
import { useAutoSave, useAutoSaveInEditor } from '~/hooks/use-auto-save'
import { useParsePayloadIntoData } from '~/hooks/use-parse-payload'
import { useLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'
import { RESTManager } from '~/utils/rest'
import { getDayOfYear } from '~/utils/time'

type NoteReactiveType = {
  mood: string
  weather: string
  password: string | null
  publicAt: Date | null
  bookmark: boolean
  isPublished: boolean

  location: null | string
  coordinates: null | Coordinate
  topicId: string | null | undefined
} & WriteBaseType

const useNoteTopic = () => {
  const topics = ref([] as TopicModel[])

  const fetchTopic = async () => {
    const { data } = await RESTManager.api.topics.get<
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

  const defaultTitle = ref('新建日记')
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
    bookmark: false,
    mood: '',

    password: null,
    publicAt: null,
    weather: '',
    location: '',
    coordinates: null,
    allowComment: true,
    isPublished: true,

    id: undefined,
    nid: undefined,
    topicId: undefined,
    images: [],
    meta: undefined,
    created: undefined,
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
        publicAt: data.publicAt
          ? (() => {
              const date = new Date(data.publicAt)
              if (+date - Date.now() <= 0) {
                return null
              } else {
                return date
              }
            })()
          : null,
      }
    }

    if (id.value) {
      // update
      if (!isString(id.value)) {
        return
      }
      const $id = id.value as string
      await RESTManager.api.notes($id).put<NoteModel>({
        data: parseDataToPayload(),
      })
      message.success('修改成功')
    } else {
      const data = parseDataToPayload()
      // create
      await RESTManager.api.notes.post<NoteModel>({
        data,
      })
      message.success('发布成功')
    }

    await router.push({ name: RouteName.ViewNote, hash: '|publish' })
    autoSaveInEditor.clearSaved()
  }
  const { fetchTopic, topics } = useNoteTopic()

  const { setTitle, setHeaderClass, setActions, setContentPadding } =
    useLayout()

  // 启用沉浸式编辑模式
  setContentPadding(false)
  setTitle('撰写日记')
  setHeaderClass('pt-1')
  setActions(
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

      <HeaderPreviewButton data={data} iframe />

      <HeaderActionButton
        icon={<SlidersHIcon />}
        name="日记设置"
        onClick={() => {
          drawerShow.value = true
        }}
      />

      <HeaderActionButton
        icon={<TelegramPlaneIcon />}
        name="发布"
        variant="primary"
        onClick={handleSubmit}
      />
    </>,
  )

  return () => (
    <>
      <WriteEditor
        key={data.id}
        loading={loading.value}
        title={data.title}
        onTitleChange={(v) => {
          data.title = v
        }}
        titlePlaceholder={defaultTitle.value}
        text={data.text}
        onChange={(v) => {
          data.text = v
        }}
        subtitleSlot={() => (
          <div class="flex items-center gap-2 text-sm text-neutral-500">
            <span>{`${WEB_URL}/notes/${nid.value ?? ''}`}</span>
            {/* AI Helper 按钮 */}
            {data.text.length > 0 && <AiHelperButton reactiveData={data} />}
          </div>
        )}
      />

      {/* Drawer  */}
      <TextBaseDrawer
        title="日记设定"
        data={data}
        show={drawerShow.value}
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
      >
        {/* 日记信息 */}
        <SectionTitle icon={BookmarkIcon}>日记信息</SectionTitle>

        <div class="grid grid-cols-2 gap-3">
          <FormField label="心情" required>
            <NSelect
              clearable
              value={data.mood}
              filterable
              tag
              options={MOOD_SET.map((i) => ({ label: i, value: i }))}
              onUpdateValue={(e) => void (data.mood = e)}
              placeholder="选择心情"
            />
          </FormField>
          <FormField label="天气" required>
            <NSelect
              clearable
              value={data.weather}
              filterable
              tag
              options={WEATHER_SET.map((i) => ({ label: i, value: i }))}
              onUpdateValue={(e) => void (data.weather = e)}
              placeholder="选择天气"
            />
          </FormField>
        </div>

        <FormField label="专栏">
          <NSelect
            clearable
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
            placeholder="选择专栏"
          />
        </FormField>

        {/* 位置信息 */}
        <SectionTitle icon={MapPinIcon}>位置信息</SectionTitle>

        <div class="mb-4 flex items-center gap-2">
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
            size="small"
            disabled={!data.location}
            onClick={() => {
              data.location = ''
              data.coordinates = null
            }}
          >
            清除
          </NButton>
        </div>

        {(data.location || data.coordinates) && (
          <FieldGroup>
            {data.location && (
              <div class="text-sm text-neutral-600 dark:text-neutral-300">
                {data.location}
              </div>
            )}
            {data.coordinates && (
              <div class="mt-1 text-xs text-neutral-400">
                {data.coordinates.longitude.toFixed(6)},{' '}
                {data.coordinates.latitude.toFixed(6)}
              </div>
            )}
          </FieldGroup>
        )}

        {/* 隐私与发布 */}
        <SectionTitle>隐私与发布</SectionTitle>

        <SwitchRow
          label="设定密码"
          description="启用后需要输入密码才能查看"
          modelValue={enablePassword.value}
          onUpdate={(e) => {
            if (e) {
              data.password = ''
            } else {
              data.password = null
            }
          }}
        />

        {enablePassword.value && (
          <div class="mb-4 ml-4 border-l-2 border-neutral-200 pl-4 dark:border-neutral-700">
            <FormField label="输入密码">
              <NInput
                placeholder="设置访问密码"
                type="password"
                value={data.password}
                inputProps={{
                  name: 'note-password',
                  autocapitalize: 'off',
                  autocomplete: 'new-password',
                }}
                onInput={(e) => void (data.password = e)}
              />
            </FormField>
          </div>
        )}

        <FormField label="公开时间" description="设置后将在指定时间自动公开">
          <NDatePicker
            class="w-full"
            type="datetime"
            isDateDisabled={(ts: number) => +new Date(ts) - Date.now() < 0}
            placeholder="选择时间"
            clearable
            value={data.publicAt ? +new Date(data.publicAt) : undefined}
            onUpdateValue={(e) => {
              data.publicAt = e ? new Date(e) : null
            }}
          >
            {{
              footer: () => {
                const date = new Date()
                return (
                  <NSpace size="small">
                    <NButton
                      size="tiny"
                      onClick={() => {
                        data.publicAt = add(date, { days: 1 })
                      }}
                    >
                      一天后
                    </NButton>
                    <NButton
                      size="tiny"
                      onClick={() => {
                        data.publicAt = add(date, { weeks: 1 })
                      }}
                    >
                      一周后
                    </NButton>
                    <NButton
                      size="tiny"
                      onClick={() => {
                        data.publicAt = add(date, { days: 14 })
                      }}
                    >
                      半个月后
                    </NButton>
                    <NButton
                      size="tiny"
                      onClick={() => {
                        data.publicAt = add(date, { months: 1 })
                      }}
                    >
                      一个月后
                    </NButton>
                  </NSpace>
                )
              },
            }}
          </NDatePicker>
        </FormField>

        <SwitchRow
          label="标记为回忆项"
          description="在回忆列表中高亮显示"
          modelValue={data.bookmark}
          onUpdate={(e) => void (data.bookmark = e)}
        />

        <SwitchRow
          label="发布状态"
          modelValue={data.isPublished}
          onUpdate={(e) => void (data.isPublished = e)}
          checkedText="已发布"
          uncheckedText="草稿"
        />
      </TextBaseDrawer>

      {/* Drawer END */}
    </>
  )
})

export default NoteWriteView
