import { isString } from 'es-toolkit/compat'
import {
  FolderIcon,
  SlidersHorizontal as SlidersHIcon,
  Send as TelegramPlaneIcon,
} from 'lucide-vue-next'
import { NDynamicTags, NInput, NInputNumber, NSelect } from 'naive-ui'
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watchEffect,
} from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { CategoryModel } from '~/models/category'
import type { DraftModel } from '~/models/draft'
import type { PostModel } from '~/models/post'
import type { ContentFormat, WriteBaseType } from '~/shared/types/base'
import type { SelectMixedOption } from 'naive-ui/lib/select/src/interface'

import { categoriesApi } from '~/api/categories'
import { postsApi } from '~/api/posts'
import { AiHelperButton } from '~/components/ai/ai-helper'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { DraftListModal } from '~/components/draft/draft-list-modal'
import { DraftRecoveryModal } from '~/components/draft/draft-recovery-modal'
import { DraftSaveIndicator } from '~/components/draft/draft-save-indicator'
import {
  FormField,
  SectionTitle,
  SwitchRow,
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
import { CategoryStore } from '~/stores/category'
import { UIStore } from '~/stores/ui'

import { useMemoPostList } from './hooks/use-memo-post-list'

type PostReactiveType = WriteBaseType & {
  slug: string
  categoryId: string
  copyright: boolean
  tags: string[]
  summary: string
  pinOrder: number
  pin: boolean
  relatedId: string[]
  isPublished: boolean
  contentFormat: ContentFormat
  content: string
}

const PostWriteView = defineComponent(() => {
  const {
    setTitle,
    setHeaderClass,
    setActions,
    setContentPadding,
    setHeaderSubtitle,
  } = useLayout()

  setContentPadding(false)

  const categoryStore = useStoreRef(CategoryStore)
  const uiStore = useStoreRef(UIStore)
  const isMobile = computed(
    () => uiStore.viewport.value.mobile || uiStore.viewport.value.pad,
  )
  onMounted(async () => {
    await categoryStore.fetch()
  })

  const resetReactive: () => PostReactiveType = () => ({
    categoryId: categoryStore.data?.value?.[0].id ?? '',
    slug: '',
    text: '',
    title: '',
    copyright: true,
    tags: [],
    summary: '',
    allowComment: true,
    id: undefined,
    images: [],
    meta: undefined,
    pin: false,
    pinOrder: 1,
    relatedId: [],
    created: undefined,
    isPublished: true,
    contentFormat: 'markdown' as ContentFormat,
    content: '',
  })

  const postListState = useMemoPostList()
  const data = reactive<PostReactiveType>(resetReactive())
  const parsePayloadIntoReactiveData = useParsePayloadIntoData(data)

  const router = useRouter()

  const applyDraft = (
    draft: DraftModel,
    target: PostReactiveType,
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
      target.slug = specific.slug || (isPartial ? target.slug : '')
      target.categoryId = specific.categoryId || target.categoryId
      target.copyright =
        specific.copyright ?? (isPartial ? target.copyright : true)
      target.tags = specific.tags || (isPartial ? target.tags : [])
      target.summary = specific.summary || (isPartial ? target.summary : '')
      target.pin = !!specific.pin
      target.pinOrder = specific.pinOrder || (isPartial ? target.pinOrder : 1)
      target.relatedId =
        specific.relatedId || (isPartial ? target.relatedId : [])
      target.isPublished =
        specific.isPublished ?? (isPartial ? target.isPublished : true)
    }
  }

  const loadPublished = async (id: string) => {
    const payload = await postsApi.getById(id)
    const postData = payload as any
    postData.relatedId = postData.related?.map((r: any) => r.id) || []
    postListState.append(postData.related)
    parsePayloadIntoReactiveData(postData as PostModel)
    data.contentFormat = postData.contentFormat || 'markdown'
    data.content = postData.content || ''
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
    refType: DraftRefType.Post,
    interval: 10000,
    draftLabel: '文章',
    getData: () => ({
      title: data.title,
      text: data.text,
      contentFormat: data.contentFormat,
      content: data.content,
      images: data.images,
      meta: data.meta,
      typeSpecificData: {
        slug: data.slug,
        categoryId: data.categoryId,
        copyright: data.copyright,
        tags: data.tags,
        summary: data.summary,
        pin: data.pin ? new Date().toISOString() : null,
        pinOrder: data.pinOrder,
        relatedId: data.relatedId,
        isPublished: data.isPublished,
      },
    }),
    applyDraft,
    loadPublished,
    onTitleFallback: (defaultTitle) => {
      data.title = defaultTitle
    },
  })

  const loading = computed(() => !!(id.value && typeof data.id === 'undefined'))

  const category = computed(
    () =>
      categoryStore.get(data.categoryId) ||
      categoryStore.data?.value?.[0] ||
      ({} as CategoryModel),
  )

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

    const payload = {
      ...data,
      text,
      images,
      categoryId: category.value.id,
      summary: data.summary?.trim() || null,
      pin: data.pin ? new Date().toISOString() : null,
      draftId: serverDraft.draftId.value,
      contentFormat: data.contentFormat,
      content: data.contentFormat === 'lexical' ? data.content : undefined,
    }

    if (actualRefId.value) {
      if (!isString(actualRefId.value)) return
      const result = await postsApi.update(actualRefId.value, payload)
      data.text = result.text
      data.images = result.images || []
      serverDraft.syncMemory()
      toast.success('修改成功')
    } else {
      const result = await postsApi.create(payload)
      data.id = result.id
      data.text = result.text
      data.images = result.images || []
      serverDraft.syncMemory()
      await router.replace({ query: { id: result.id } })
      toast.success('发布成功')
    }
  }

  const handleOpenDrawer = () => {
    drawerShow.value = true
    if (postListState.loading.value) {
      postListState.fetchNext()
    }
  }

  const handleFetchNext = (e: Event) => {
    const currentTarget = e.currentTarget as HTMLElement
    if (
      currentTarget.scrollTop + currentTarget.offsetHeight + 10 >=
      currentTarget.scrollHeight
    ) {
      postListState.fetchNext()
    }
  }

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown)
    postListState.refresh()
  })

  setHeaderClass('pt-1')
  watchEffect(() => {
    setTitle(isEditing.value ? '修改文章' : '撰写新文章')

    setHeaderSubtitle(
      <DraftSaveIndicator
        isSaving={serverDraft.isSaving}
        lastSavedTime={serverDraft.lastSavedTime}
      />,
    )

    setActions(
      <>
        {!isMobile.value && (
          <ParseContentButton
            data={data}
            onHandleYamlParsedMeta={(meta) => {
              const { title, slug, ...rest } = meta
              data.title = title ?? data.title
              data.slug = slug ?? data.slug
              data.meta = { ...rest }
            }}
          />
        )}
        {!isMobile.value && <HeaderPreviewButton iframe data={data} />}
        <HeaderActionButton
          icon={<SlidersHIcon />}
          name="文章设置"
          onClick={handleOpenDrawer}
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
        titlePlaceholder="输入标题..."
        text={data.text}
        onChange={(v) => {
          data.text = v
        }}
        contentFormat={data.contentFormat}
        onContentFormatChange={(v) => {
          data.contentFormat = v
        }}
        richContent={data.content ? JSON.parse(data.content) : undefined}
        onRichContentChange={(v) => {
          data.content = JSON.stringify(v)
        }}
        saveConfirmFn={serverDraft.checkIsSynced}
        variant="post"
        subtitleSlot={() => (
          <SlugInput
            prefix={`${WEB_URL}/posts/${category.value.slug}/`}
            value={data.slug}
            onChange={(v) => {
              data.slug = v
            }}
            placeholder="slug"
          >
            {(!data.title || !data.slug) && data.text.length > 0 && (
              <AiHelperButton reactiveData={data} />
            )}
          </SlugInput>
        )}
      />

      <TextBaseDrawer
        title="文章设定"
        show={drawerShow.value}
        scope="post"
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
        data={data}
      >
        <SectionTitle icon={FolderIcon}>分类与标签</SectionTitle>

        <FormField label="分类" required>
          <NSelect
            placeholder="请选择分类"
            options={
              categoryStore.data.value?.map((i) => ({
                label: i.name,
                value: i.id,
              })) || []
            }
            value={data.categoryId}
            onUpdateValue={(v) => {
              data.categoryId = v
            }}
          />
        </FormField>

        <FormField label="标签">
          <NDynamicTags
            value={data.tags}
            onUpdateValue={(e) => {
              data.tags.length = 0
              data.tags.push(...e)
            }}
          >
            {{
              input({ submit }) {
                const Component = defineComponent({
                  setup() {
                    const tagsRef = ref([] as SelectMixedOption[])
                    const loading = ref(false)
                    const value = ref('')
                    const selectRef = ref()
                    onMounted(async () => {
                      loading.value = true
                      if (selectRef.value) {
                        selectRef.value.$el.querySelector('input').focus()
                      }
                      const tagData = await categoriesApi.getList({
                        type: 'Tag',
                      })
                      tagsRef.value = tagData.map((i) => ({
                        label: `${i.name} (${i.count})`,
                        value: i.name,
                        key: i.name,
                      }))
                      loading.value = false
                    })
                    return () => (
                      <NSelect
                        ref={selectRef}
                        size={'small'}
                        value={value.value}
                        clearable
                        loading={loading.value}
                        filterable
                        tag
                        options={tagsRef.value}
                        onUpdateValue={(e) => {
                          void (value.value = e)
                          submit(e)
                        }}
                      />
                    )
                  },
                })
                return <Component />
              },
            }}
          </NDynamicTags>
        </FormField>

        <FormField label="关联阅读">
          <NSelect
            maxTagCount={3}
            multiple
            options={postListState.datalist.value.map((i) => ({
              label: i.title,
              value: i.id,
            }))}
            loading={postListState.loading.value}
            filterable
            placeholder="搜索标题"
            value={data.relatedId}
            onUpdateValue={(val) => {
              data.relatedId = val
            }}
            onScroll={handleFetchNext}
          />
        </FormField>

        <FormField label="摘要">
          <NInput
            type="textarea"
            placeholder="请输入摘要（可选）"
            value={data.summary}
            rows={3}
            autosize={{ minRows: 3 }}
            onUpdateValue={(v) => void (data.summary = v)}
          />
        </FormField>

        <SectionTitle>发布选项</SectionTitle>

        <SwitchRow
          label="版权注明"
          description="在文章底部显示版权信息"
          modelValue={data.copyright}
          onUpdate={(e) => void (data.copyright = e)}
        />

        <SwitchRow
          label="置顶"
          description="在文章列表中优先显示"
          modelValue={!!data.pin}
          onUpdate={(e) => {
            data.pin = e
            if (!e) {
              data.pinOrder = 0
            } else {
              data.pinOrder = data.pinOrder || 1
            }
          }}
        />

        {data.pin && (
          <div class="mb-4 ml-4 border-l-2 border-neutral-200 pl-4 dark:border-neutral-700">
            <FormField label="置顶顺序">
              <NInputNumber
                class="w-full"
                value={data.pinOrder}
                onUpdateValue={(e) => void (data.pinOrder = e || 1)}
                min={1}
                placeholder="数字越大越靠前"
              />
            </FormField>
          </div>
        )}

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

export default PostWriteView
