import { isString } from 'es-toolkit/compat'
import {
  FolderIcon,
  SlidersHorizontal as SlidersHIcon,
  Send as TelegramPlaneIcon,
} from 'lucide-vue-next'
import {
  NDynamicTags,
  NInput,
  NInputNumber,
  NSelect,
  useMessage,
} from 'naive-ui'
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CategoryModel } from '~/models/category'
import type { PostModel } from '~/models/post'
import type { WriteBaseType } from '~/shared/types/base'
import type { SelectMixedOption } from 'naive-ui/lib/select/src/interface'

import { categoriesApi } from '~/api/categories'
import { postsApi } from '~/api/posts'
import { AiHelperButton } from '~/components/ai/ai-helper'
import { HeaderActionButton } from '~/components/button/rounded-button'
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
import { useServerDraft } from '~/hooks/use-server-draft'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useLayout } from '~/layouts/content'
import { DraftRefType } from '~/models/draft'
import { RouteName } from '~/router/name'
import { CategoryStore } from '~/stores/category'

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
}

const PostWriteView = defineComponent(() => {
  const route = useRoute()
  const {
    setTitle,
    setHeaderClass,
    setActions,
    setContentPadding,
    setHeaderSubtitle,
  } = useLayout()

  // 启用沉浸式编辑模式（无 padding）
  setContentPadding(false)

  const categoryStore = useStoreRef(CategoryStore)
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
  })

  const postListState = useMemoPostList()

  const data = reactive<PostReactiveType>(resetReactive())

  const parsePayloadIntoReactiveData = useParsePayloadIntoData(data)
  const id = computed(() => route.query.id as string | undefined)
  const draftIdFromRoute = computed(
    () => route.query.draftId as string | undefined,
  )

  const loading = computed(() => !!(id.value && typeof data.id === 'undefined'))

  const router = useRouter()

  // 服务端草稿 hook
  const serverDraft = useServerDraft(DraftRefType.Post, {
    refId: id.value,
    draftId: draftIdFromRoute.value,
    interval: 10000, // 10秒自动保存
    getData: () => ({
      title: data.title,
      text: data.text,
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
    // 草稿首次创建后更新 URL
    onDraftCreated: (draftId) => {
      router.replace({ query: { draftId } })
    },
    // title 为空使用默认值时同步 UI
    onTitleFallback: (defaultTitle) => {
      data.title = defaultTitle
    },
  })

  const draftInitialized = ref(false)

  // const currentSelectCategoryId = ref('')
  const category = computed(
    () =>
      categoryStore.get(data.categoryId) ||
      categoryStore.data?.value?.[0] ||
      ({} as CategoryModel),
  )

  onMounted(async () => {
    const $id = id.value
    const $draftId = draftIdFromRoute.value

    // 场景1：通过 draftId 加载草稿
    if ($draftId) {
      const draft = await serverDraft.loadDraftById($draftId)
      if (draft) {
        // 恢复草稿数据
        data.title = draft.title
        data.text = draft.text
        data.images = draft.images || []
        data.meta = draft.meta
        if (draft.typeSpecificData) {
          const specific = draft.typeSpecificData
          data.slug = specific.slug || ''
          data.categoryId = specific.categoryId || data.categoryId
          data.copyright = specific.copyright ?? true
          data.tags = specific.tags || []
          data.summary = specific.summary || ''
          data.pin = !!specific.pin
          data.pinOrder = specific.pinOrder || 1
          data.relatedId = specific.relatedId || []
          data.isPublished = specific.isPublished ?? true
        }
        serverDraft.syncMemory()
        serverDraft.startAutoSave()
        draftInitialized.value = true
        return
      }
    }

    // 场景2：编辑已发布文章
    if ($id && typeof $id == 'string') {
      const payload = (await postsApi.getById($id)) as any

      // 兼容两种 API 响应格式：{ data: PostModel } 或直接 PostModel
      const postData = payload.data ?? payload

      // HACK: transform
      postData.relatedId = postData.related?.map((r: any) => r.id) || []
      postListState.append(postData.related)

      parsePayloadIntoReactiveData(postData as PostModel)

      // 检查是否有关联的草稿
      const relatedDraft = await serverDraft.loadDraftByRef(
        DraftRefType.Post,
        $id,
      )
      if (relatedDraft) {
        // 弹窗询问是否恢复草稿
        window.dialog.info({
          title: '检测到未保存的草稿',
          content: `上次保存时间: ${new Date(relatedDraft.updated).toLocaleString()}`,
          negativeText: '使用已发布版本',
          positiveText: '恢复草稿',
          onNegativeClick() {
            // 使用已发布版本，同步记忆
            serverDraft.syncMemory()
            serverDraft.startAutoSave()
          },
          onPositiveClick() {
            // 恢复草稿数据
            data.title = relatedDraft.title
            data.text = relatedDraft.text
            data.images = relatedDraft.images || []
            data.meta = relatedDraft.meta
            if (relatedDraft.typeSpecificData) {
              const specific = relatedDraft.typeSpecificData
              data.slug = specific.slug || data.slug
              data.categoryId = specific.categoryId || data.categoryId
              data.copyright = specific.copyright ?? data.copyright
              data.tags = specific.tags || data.tags
              data.summary = specific.summary || data.summary
              data.pin = !!specific.pin
              data.pinOrder = specific.pinOrder || data.pinOrder
              data.relatedId = specific.relatedId || data.relatedId
              data.isPublished = specific.isPublished ?? data.isPublished
            }
            serverDraft.syncMemory()
            serverDraft.startAutoSave()
          },
        })
      } else {
        // 没有关联草稿，直接开始自动保存
        serverDraft.syncMemory()
        serverDraft.startAutoSave()
      }

      draftInitialized.value = true
      return
    }

    // 场景3：新建入口（无参数）
    // 检查是否有未完成的新建草稿
    const pendingDrafts = await serverDraft.getNewDrafts(DraftRefType.Post)
    if (pendingDrafts.length > 0) {
      window.dialog.info({
        title: '发现未完成的草稿',
        content: `你有 ${pendingDrafts.length} 个未完成的文章草稿，是否继续编辑？`,
        negativeText: '创建新草稿',
        positiveText: '查看草稿列表',
        onNegativeClick() {
          // 开始新草稿，不立即创建，等用户输入内容后自动保存时创建
          serverDraft.startAutoSave()
        },
        onPositiveClick() {
          // 跳转到草稿管理页面（或使用第一个草稿）
          const firstDraft = pendingDrafts[0]
          router.replace({ query: { draftId: firstDraft.id } })
        },
      })
    } else {
      // 没有未完成草稿，直接启动自动保存
      // 草稿会在用户输入内容后自动创建
      serverDraft.startAutoSave()
    }

    draftInitialized.value = true
  })

  const drawerShow = ref(false)

  const message = useMessage()

  const handleSubmit = async () => {
    const payload = {
      ...data,
      categoryId: category.value.id,
      summary:
        data.summary && data.summary.trim() != '' ? data.summary.trim() : null,
      pin: data.pin ? new Date().toISOString() : null,
      // 传递草稿 ID，让后端标记该草稿为已发布
      draftId: serverDraft.draftId.value,
    }

    if (id.value) {
      // update
      if (!isString(id.value)) {
        return
      }
      const $id = id.value as string
      await postsApi.update($id, payload)
      message.success('修改成功')
    } else {
      // create
      await postsApi.create(payload)
      message.success('发布成功')
    }

    await router.push({ name: RouteName.ViewPost, hash: '|publish' })
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
    postListState.refresh()
  })

  // 设置 layout 状态
  setHeaderClass('pt-1')
  watchEffect(() => {
    setTitle(id.value ? '修改文章' : '撰写新文章')

    // 设置草稿保存状态指示器
    setHeaderSubtitle(
      <DraftSaveIndicator
        isSaving={serverDraft.isSaving}
        lastSavedTime={serverDraft.lastSavedTime}
      />,
    )

    setActions(
      <>
        <ParseContentButton
          data={data}
          onHandleYamlParsedMeta={(meta) => {
            // TODO: other meta field attach to data
            const { title, slug, ...rest } = meta
            data.title = title ?? data.title
            data.slug = slug ?? data.slug

            data.meta = { ...rest }
          }}
        />

        <HeaderPreviewButton iframe data={data} />

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
        autoFocus={id.value ? 'content' : 'title'}
        title={data.title}
        onTitleChange={(v) => {
          data.title = v
        }}
        titlePlaceholder="输入标题..."
        text={data.text}
        onChange={(v) => {
          data.text = v
        }}
        subtitleSlot={() => (
          <SlugInput
            prefix={`${WEB_URL}/posts/${category.value.slug}/`}
            value={data.slug}
            onChange={(v) => {
              data.slug = v
            }}
            placeholder="slug"
          >
            {/* AI Helper 按钮 */}
            {(!data.title || !data.slug) && data.text.length > 0 && (
              <AiHelperButton reactiveData={data} />
            )}
          </SlugInput>
        )}
      />

      {/* Drawer  */}
      <TextBaseDrawer
        title="文章设定"
        show={drawerShow.value}
        scope="post"
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
        data={data}
      >
        {/* 分类与标签 */}
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
                      const { data: tagData } = await categoriesApi.getList({
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
            autosize={{
              minRows: 3,
            }}
            onUpdateValue={(v) => void (data.summary = v)}
          />
        </FormField>

        {/* 发布选项 */}
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
    </>
  )
})

export default PostWriteView
