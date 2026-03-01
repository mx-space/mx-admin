import { add } from 'date-fns'
import { isString } from 'es-toolkit/compat'
import {
  BookmarkIcon,
  MapPinIcon,
  SlidersHorizontal as SlidersHIcon,
  Send as TelegramPlaneIcon,
} from 'lucide-vue-next'
import { NButton, NDatePicker, NInput, NSelect, NSpace } from 'naive-ui'
import {
  computed,
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRaw,
  watchEffect,
} from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { TopicModel } from '@mx-space/api-client'
import type { CreateNoteData } from '~/api/notes'
import type { DraftModel } from '~/models/draft'
import type { Coordinate, NoteModel } from '~/models/note'
import type { ContentFormat, WriteBaseType } from '~/shared/types/base'

import { notesApi } from '~/api/notes'
import { topicsApi } from '~/api/topics'
import { AiHelperButton } from '~/components/ai/ai-helper'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { DraftListModal } from '~/components/draft/draft-list-modal'
import { DraftRecoveryModal } from '~/components/draft/draft-recovery-modal'
import { DraftSaveIndicator } from '~/components/draft/draft-save-indicator'
import { LexicalDebugButton } from '~/components/drawer/lexical-debug-drawer'
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
import { useParsePayloadIntoData } from '~/hooks/use-parse-payload'
import { usePreferredContentFormat } from '~/hooks/use-preferred-content-format'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useWriteDraft } from '~/hooks/use-write-draft'
import { useLayout } from '~/layouts/content'
import { DraftRefType } from '~/models/draft'
import { UIStore } from '~/stores/ui'
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
  contentFormat: ContentFormat
  content: string
} & WriteBaseType

const useNoteTopic = () => {
  const topics = ref([] as TopicModel[])

  const fetchTopic = async () => {
    const { data } = await topicsApi.getList({ size: 50 })
    topics.value = data
  }

  return { topics, fetchTopic }
}

const NoteWriteView = defineComponent(() => {
  const defaultTitle = ref('新建日记')
  const router = useRouter()
  const uiStore = useStoreRef(UIStore)
  const { preferredContentFormat, setPreferredContentFormat } =
    usePreferredContentFormat()
  const isMobile = computed(
    () => uiStore.viewport.value.mobile || uiStore.viewport.value.pad,
  )

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
    contentFormat: preferredContentFormat.value,
    content: '',
  })

  const parsePayloadIntoReactiveData = (payload: NoteModel) =>
    useParsePayloadIntoData(data)(payload)
  const data = reactive<NoteReactiveType>(resetReactive())
  const nid = ref<number>()

  const applyDraft = (
    draft: DraftModel,
    target: NoteReactiveType,
    isPartial?: boolean,
  ) => {
    target.title = draft.title
    target.text = draft.text
    target.contentFormat = draft.contentFormat || 'markdown'
    target.content = draft.content || ''
    target.images = draft.images || []
    target.meta = draft.meta
    if (draft.typeSpecificData) {
      const specific = draft.typeSpecificData
      target.mood = specific.mood || (isPartial ? target.mood : '')
      target.weather = specific.weather || (isPartial ? target.weather : '')
      target.password =
        specific.password ?? (isPartial ? target.password : null)
      target.publicAt = specific.publicAt
        ? new Date(specific.publicAt)
        : isPartial
          ? target.publicAt
          : null
      target.bookmark =
        specific.bookmark ?? (isPartial ? target.bookmark : false)
      target.location = specific.location || (isPartial ? target.location : '')
      target.coordinates =
        specific.coordinates || (isPartial ? target.coordinates : null)
      target.topicId = specific.topicId ?? (isPartial ? target.topicId : null)
      target.isPublished =
        specific.isPublished ?? (isPartial ? target.isPublished : true)
    }
  }

  const loadPublished = async (id: string) => {
    const noteData = await notesApi.getById(id, { single: true })
    if (noteData.topic) {
      topics.value.push(noteData.topic)
    }
    nid.value = noteData.nid

    const created = new Date((noteData as any).created)
    defaultTitle.value = `记录 ${created.getFullYear()} 年第 ${getDayOfYear(created)} 天`

    parsePayloadIntoReactiveData(noteData as NoteModel)
    data.contentFormat = (noteData as any).contentFormat || 'markdown'
    data.content = (noteData as any).content || ''
  }

  const {
    id,
    serverDraft,
    isEditing,
    actualRefId,
    initialize,
    recoveryModal,
    listModal,
  } = useWriteDraft(data, {
    refType: DraftRefType.Note,
    interval: 10000,
    draftLabel: '手记',
    getData: () => ({
      title: data.title,
      text: data.text,
      contentFormat: data.contentFormat,
      content: data.content,
      images: data.images,
      meta: data.meta,
      typeSpecificData: {
        mood: data.mood,
        weather: data.weather,
        password: data.password,
        publicAt: data.publicAt?.toISOString() || null,
        bookmark: data.bookmark,
        location: data.location,
        coordinates: data.coordinates,
        topicId: data.topicId,
        isPublished: data.isPublished,
      },
    }),
    applyDraft,
    loadPublished,
    onTitleFallback: (title) => {
      data.title = title
    },
  })

  const loading = computed(() => !!(id.value && typeof data.id === 'undefined'))

  onBeforeMount(() => {
    if (id.value) return
    const currentTime = new Date()
    defaultTitle.value = `记录 ${currentTime.getFullYear()} 年第 ${getDayOfYear(currentTime)} 天`
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      serverDraft.saveImmediately()
    }
  }

  onMounted(() => {
    initialize()
    window.addEventListener('keydown', handleKeyDown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  const drawerShow = ref(false)
  const enablePassword = computed(() => typeof data.password === 'string')

  const handleSubmit = async () => {
    if (!data.title || data.title.trim().length === 0) {
      toast.error('标题为空')
      return
    }

    const parseDataToPayload = () => {
      return {
        ...toRaw(data),
        title: data.title?.trim() || defaultTitle.value,
        password:
          data.password && data.password.length > 0 ? data.password : null,
        publicAt: data.publicAt
          ? (() => {
              const date = new Date(data.publicAt)
              return +date - Date.now() <= 0 ? null : date
            })()
          : null,
        contentFormat: data.contentFormat,
        content: data.contentFormat === 'lexical' ? data.content : undefined,
      }
    }

    const draftId = serverDraft.draftId.value

    if (actualRefId.value) {
      if (!isString(actualRefId.value)) return
      const result = await notesApi.update(actualRefId.value, {
        ...parseDataToPayload(),
        draftId,
      })
      data.text = result.text
      data.images = (result as any).images || []
      serverDraft.syncMemory()
      toast.success('修改成功')
    } else {
      const payload = parseDataToPayload()
      const result = await notesApi.create({
        ...payload,
        draftId,
      } as CreateNoteData)
      data.id = result.id
      data.text = result.text
      data.images = (result as any).images || []
      nid.value = result.nid
      serverDraft.syncMemory()
      await router.replace({ query: { id: result.id } })
      toast.success('发布成功')
    }
  }

  const { fetchTopic, topics } = useNoteTopic()

  const {
    setTitle,
    setHeaderClass,
    setActions,
    setContentPadding,
    setHeaderSubtitle,
  } = useLayout()

  setContentPadding(false)
  setHeaderClass('pt-1')

  watchEffect(() => {
    setTitle(isEditing.value ? '修改日记' : '撰写日记')

    setHeaderSubtitle(
      <DraftSaveIndicator
        isSaving={serverDraft.isSaving}
        lastSavedTime={serverDraft.lastSavedTime}
      />,
    )

    setActions(
      <>
        {!isMobile.value &&
          (data.contentFormat === 'lexical' ? (
            <LexicalDebugButton content={data.content} />
          ) : (
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
          ))}
        {!isMobile.value && <HeaderPreviewButton data={data} iframe />}
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
  })

  return () => (
    <>
      <WriteEditor
        key={data.id}
        loading={loading.value}
        autoFocus={isEditing.value ? 'content' : 'title'}
        title={data.title}
        onTitleChange={(v) => {
          data.title = v
        }}
        titlePlaceholder={defaultTitle.value}
        text={data.text}
        onChange={(v) => {
          data.text = v
        }}
        contentFormat={data.contentFormat}
        onContentFormatChange={(v) => {
          data.contentFormat = v
          setPreferredContentFormat(v)
        }}
        richContent={data.content ? JSON.parse(data.content) : undefined}
        onRichContentChange={(v) => {
          data.content = JSON.stringify(v)
        }}
        saveConfirmFn={serverDraft.checkIsSynced}
        variant="note"
        subtitleSlot={() => (
          <div class="flex items-center gap-2 text-sm text-neutral-500">
            <span>{`${WEB_URL}/notes/${nid.value ?? ''}`}</span>
            {data.text.length > 0 && <AiHelperButton reactiveData={data} />}
          </div>
        )}
      />

      <TextBaseDrawer
        title="日记设定"
        data={data}
        show={drawerShow.value}
        scope="note"
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
      >
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
            size="tiny"
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

      {recoveryModal.draft.value && recoveryModal.publishedContent.value && (
        <DraftRecoveryModal
          show={recoveryModal.show.value}
          onClose={recoveryModal.onClose}
          draft={recoveryModal.draft.value}
          publishedContent={recoveryModal.publishedContent.value}
          onRecover={recoveryModal.onRecover}
        />
      )}

      <DraftListModal
        show={listModal.show.value}
        onClose={listModal.onClose}
        drafts={listModal.drafts.value}
        draftLabel={listModal.draftLabel}
        onSelect={listModal.onSelect}
        onCreate={listModal.onCreate}
      />
    </>
  )
})

export default NoteWriteView
