import { isString } from 'es-toolkit/compat'
import {
  SlidersHorizontal as SlidersHIcon,
  Send as TelegramPlaneIcon,
} from 'lucide-vue-next'
import {
  NDynamicTags,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  useMessage,
} from 'naive-ui'
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CategoryModel, TagModel } from '~/models/category'
import type { PostModel } from '~/models/post'
import type { WriteBaseType } from '~/shared/types/base'
import type { SelectMixedOption } from 'naive-ui/lib/select/src/interface'

import { AiHelperButton } from '~/components/ai/ai-helper'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { TextBaseDrawer } from '~/components/drawer/text-base-drawer'
import { WriteEditor } from '~/components/editor/write-editor'
import { SlugInput } from '~/components/editor/write-editor/slug-input'
import { ParseContentButton } from '~/components/special-button/parse-content'
import { HeaderPreviewButton } from '~/components/special-button/preview'
import { WEB_URL } from '~/constants/env'
import { useAutoSave, useAutoSaveInEditor } from '~/hooks/use-auto-save'
import { useParsePayloadIntoData } from '~/hooks/use-parse-payload'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'
import { CategoryStore } from '~/stores/category'
import { RESTManager } from '~/utils/rest'

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
  const { setTitle, setHeaderClass, setActions, setContentPadding } =
    useLayout()

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
  const id = computed(() => route.query.id)

  const loading = computed(() => !!(id.value && typeof data.id === 'undefined'))
  const autoSaveHook = useAutoSave(`post-${id.value || 'new'}`, 3000, () => ({
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

  // const currentSelectCategoryId = ref('')
  const category = computed(
    () =>
      categoryStore.get(data.categoryId) ||
      categoryStore.data?.value?.[0] ||
      ({} as CategoryModel),
  )

  onMounted(async () => {
    const $id = id.value
    if ($id && typeof $id == 'string') {
      const payload = (await RESTManager.api.posts($id).get()) as any

      // HACK: transform
      payload.data.relatedId = payload.data.related?.map((r: any) => r.id) || []
      postListState.append(payload.data.related)

      parsePayloadIntoReactiveData(payload.data as PostModel)
    }
  })

  const drawerShow = ref(false)

  const message = useMessage()
  const router = useRouter()

  const handleSubmit = async () => {
    const payload = {
      ...data,
      categoryId: category.value.id,
      summary:
        data.summary && data.summary.trim() != '' ? data.summary.trim() : null,
    }

    if (id.value) {
      // update
      if (!isString(id.value)) {
        return
      }
      const $id = id.value as string
      await RESTManager.api.posts($id).put<PostModel>({
        data: payload,
      })
      message.success('修改成功')
    } else {
      // create
      await RESTManager.api.posts.post<PostModel>({
        data: payload,
      })
      message.success('发布成功')
    }

    await router.push({ name: RouteName.ViewPost, hash: '|publish' })
    autoSaveInEditor.clearSaved()
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
        show={drawerShow.value}
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
        data={data}
      >
        <NFormItem label="分类" required path="categoryId">
          <NSelect
            placeholder="请选择"
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
        </NFormItem>
        <NFormItem label="标签" path="tags">
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
                      const { data: tagData } =
                        await RESTManager.api.categories.get<{
                          data: TagModel[]
                        }>({
                          params: { type: 'Tag' },
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
        </NFormItem>
        <NFormItem label="关联阅读">
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
        </NFormItem>
        <NFormItem label="摘要">
          <NInput
            type="textarea"
            placeholder="请输入摘要"
            value={data.summary}
            rows={3}
            autosize={{
              minRows: 3,
            }}
            onUpdateValue={(v) => void (data.summary = v)}
          />
        </NFormItem>
        <NFormItem label="版权注明" labelAlign="right" labelPlacement="left">
          <NSwitch
            value={data.copyright}
            onUpdateValue={(e) => void (data.copyright = e)}
          />
        </NFormItem>
        <NFormItem label="置顶" labelAlign="right" labelPlacement="left">
          <NSwitch
            value={!!data.pin}
            onUpdateValue={(e) => {
              data.pin = e
              if (!e) {
                data.pinOrder = 0
              } else {
                data.pinOrder = data.pinOrder || 1
              }
            }}
          />
        </NFormItem>
        <NFormItem label="置顶顺序" labelAlign="right" labelPlacement="left">
          <NInputNumber
            disabled={!data.pin}
            value={data.pinOrder}
            onUpdateValue={(e) => void (data.pinOrder = e || 1)}
          />
        </NFormItem>
        <NFormItem label="发布状态" labelAlign="right" labelPlacement="left">
          <NSwitch
            value={data.isPublished}
            onUpdateValue={(e) => void (data.isPublished = e)}
          >
            {{
              checked: () => '已发布',
              unchecked: () => '草稿',
            }}
          </NSwitch>
        </NFormItem>
      </TextBaseDrawer>
    </>
  )
})

export default PostWriteView
