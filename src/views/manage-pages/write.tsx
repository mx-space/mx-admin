import { isString } from 'es-toolkit/compat'
import {
  FileTextIcon,
  SlidersHorizontal as SlidersHIcon,
  Send as TelegramPlaneIcon,
} from 'lucide-vue-next'
import { NInputNumber } from 'naive-ui'
import {
  computed,
  defineComponent,
  onMounted,
  reactive,
  ref,
  toRaw,
  watchEffect,
} from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { CreatePageData } from '~/api/pages'
import type { DraftModel } from '~/models/draft'
import type { PageModel } from '~/models/page'
import type { WriteBaseType } from '~/shared/types/base'

import { pagesApi } from '~/api/pages'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { DraftListModal } from '~/components/draft/draft-list-modal'
import { DraftRecoveryModal } from '~/components/draft/draft-recovery-modal'
import { DraftSaveIndicator } from '~/components/draft/draft-save-indicator'
import {
  FormField,
  SectionTitle,
  TextBaseDrawer,
} from '~/components/drawer/text-base-drawer'
import { WriteEditor } from '~/components/editor/write-editor'
import { SlugInput } from '~/components/editor/write-editor/slug-input'
import { ParseContentButton } from '~/components/special-button/parse-content'
import { HeaderPreviewButton } from '~/components/special-button/preview'
import { WEB_URL } from '~/constants/env'
import { useParsePayloadIntoData } from '~/hooks/use-parse-payload'
import { useS3Upload } from '~/hooks/use-s3-upload'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useWriteDraft } from '~/hooks/use-write-draft'
import { useLayout } from '~/layouts/content'
import { DraftRefType } from '~/models/draft'
import { RouteName } from '~/router/name'
import { UIStore } from '~/stores/ui'

type PageReactiveType = WriteBaseType & {
  subtitle: string
  slug: string
  order: number
}

const PageWriteView = defineComponent(() => {
  const uiStore = useStoreRef(UIStore)
  const isMobile = computed(
    () => uiStore.viewport.value.mobile || uiStore.viewport.value.pad,
  )

  const {
    setTitle,
    setHeaderClass,
    setActions,
    setContentPadding,
    setHeaderSubtitle,
  } = useLayout()

  setContentPadding(false)

  const resetReactive: () => PageReactiveType = () => ({
    text: '',
    title: '',
    order: 0,
    slug: '',
    subtitle: '',
    allowComment: true,
    id: undefined,
    images: [],
    meta: undefined,
  })

  const parsePayloadIntoReactiveData = (payload: PageModel) =>
    useParsePayloadIntoData(data)(payload)
  const data = reactive<PageReactiveType>(resetReactive())

  const router = useRouter()

  const applyDraft = (
    draft: DraftModel,
    target: PageReactiveType,
    isPartial?: boolean,
  ) => {
    target.title = draft.title
    target.text = draft.text
    target.images = draft.images || []
    target.meta = draft.meta
    if (draft.typeSpecificData) {
      const specific = draft.typeSpecificData
      target.slug = specific.slug || (isPartial ? target.slug : '')
      target.subtitle = specific.subtitle || (isPartial ? target.subtitle : '')
      target.order = specific.order ?? (isPartial ? target.order : 0)
    }
  }

  const loadPublished = async (id: string) => {
    const payload = await pagesApi.getById(id)
    parsePayloadIntoReactiveData(payload as PageModel)
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
    refType: DraftRefType.Page,
    interval: 10000,
    draftLabel: '页面',
    getData: () => ({
      title: data.title,
      text: data.text,
      images: data.images,
      meta: data.meta,
      typeSpecificData: {
        slug: data.slug,
        subtitle: data.subtitle,
        order: data.order,
      },
    }),
    applyDraft,
    loadPublished,
    onTitleFallback: (title) => {
      data.title = title
    },
  })

  const loading = computed(() => !!(id.value && typeof data.id === 'undefined'))

  onMounted(() => {
    initialize()
  })

  const drawerShow = ref(false)
  const { processLocalImages } = useS3Upload()

  const handleSubmit = async () => {
    let text = data.text
    let images = data.images
    try {
      const processed = await processLocalImages(data.text, data.images)
      text = processed.text
      images = processed.images
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '图片同步失败')
      return
    }

    const parseDataToPayload = () => {
      if (!data.title || data.title.trim().length === 0) {
        toast.error('标题为空')
        return null
      }
      if (!data.slug) {
        toast.error('路径为空')
        return null
      }
      return {
        ...toRaw(data),
        text,
        images,
        title: data.title.trim(),
        slug: data.slug.trim(),
      }
    }

    const payload = parseDataToPayload()
    if (!payload) return

    const draftId = serverDraft.draftId.value

    if (actualRefId.value) {
      if (!isString(actualRefId.value)) return
      const result = await pagesApi.update(actualRefId.value, {
        ...payload,
        draftId,
      })
      data.text = result.text
      data.images = (result as any).images || []
      serverDraft.syncMemory()
      toast.success('修改成功')
    } else {
      const result = await pagesApi.create({
        ...payload,
        draftId,
      } as CreatePageData)
      data.text = result.text
      data.images = (result as any).images || []
      serverDraft.syncMemory()
      toast.success('发布成功')
    }

    router.push({ name: RouteName.ListPage, hash: '|publish' })
  }

  setHeaderClass('pt-1')

  watchEffect(() => {
    setTitle(isEditing.value ? '修改页面' : '新建页面')

    setHeaderSubtitle(
      <DraftSaveIndicator
        isSaving={serverDraft.isSaving}
        lastSavedTime={serverDraft.lastSavedTime}
      />,
    )
  })

  setActions(
    <>
      {!isMobile.value && (
        <ParseContentButton
          data={data}
          onHandleYamlParsedMeta={(meta) => {
            const { title, slug, subtitle, ...rest } = meta
            data.title = title ?? data.title
            data.slug = slug ?? data.slug
            data.subtitle = subtitle ?? data.subtitle
            data.meta = { ...rest }
          }}
        />
      )}
      {!isMobile.value && <HeaderPreviewButton iframe data={data} />}
      <HeaderActionButton
        icon={<SlidersHIcon />}
        name="页面设置"
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
        autoFocus={isEditing.value ? 'content' : 'title'}
        title={data.title}
        onTitleChange={(v) => {
          data.title = v
        }}
        titlePlaceholder="输入标题..."
        text={data.text}
        onChange={(v) => {
          data.text = v
        }}
        saveConfirmFn={serverDraft.checkIsSynced}
        subtitleSlot={() => (
          <div class="space-y-2">
            <SlugInput
              prefix={`${WEB_URL}/`}
              value={data.slug}
              onChange={(v) => {
                data.slug = v
              }}
              placeholder="slug"
            />
            <input
              class={[
                'w-full bg-transparent outline-none',
                'text-sm text-neutral-600 dark:text-neutral-400',
                'border-none px-1 py-0.5',
                'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              ]}
              placeholder="输入副标题..."
              value={data.subtitle}
              onInput={(e) => {
                data.subtitle = (e.target as HTMLInputElement).value
              }}
            />
          </div>
        )}
      />

      <TextBaseDrawer
        title="页面设定"
        disabledItem={['date-picker']}
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
        data={data}
        show={drawerShow.value}
      >
        <SectionTitle icon={FileTextIcon}>页面选项</SectionTitle>

        <FormField
          label="页面顺序"
          description="用于控制页面在导航中的显示顺序"
        >
          <NInputNumber
            class="w-full"
            placeholder="输入排序数字"
            value={data.order}
            onUpdateValue={(e) => void (data.order = e ?? 0)}
            min={0}
          />
        </FormField>
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

export default PageWriteView
