import { HeaderActionButton } from 'components/button/rounded-button'
import { TextBaseDrawer } from 'components/drawer/text-base-drawer'
import { EditorToggleWrapper } from 'components/editor/universal/toggle'
import { OpenAI, SlidersHIcon, TelegramPlaneIcon } from 'components/icons'
import { MaterialInput } from 'components/input/material-input'
import { UnderlineInput } from 'components/input/underline-input'
import { ParseContentButton } from 'components/special-button/parse-content'
import { CrossBellConnectorIndirector } from 'components/xlog-connect'
import { WEB_URL } from 'constants/env'
import { useStoreRef } from 'hooks/use-store-ref'
import { ContentLayout } from 'layouts/content'
import { isString } from 'lodash-es'
import type { CategoryModel, TagModel } from 'models/category'
import type { PostModel } from 'models/post'
import {
  NButton,
  NDynamicTags,
  NFormItem,
  NInput,
  NInputNumber,
  NPopover,
  NSelect,
  NSwitch,
  useDialog,
  useMessage,
} from 'naive-ui'
import type { SelectMixedOption } from 'naive-ui/lib/select/src/interface'
import { RouteName } from 'router/name'
import type { WriteBaseType } from 'shared/types/base'
import { CategoryStore } from 'stores/category'
import { RESTManager } from 'utils/rest'
import { computed, defineComponent, onMounted, reactive, ref, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Icon } from '@vicons/utils'

import { HeaderPreviewButton } from '~/components/special-button/preview'

import { AISummaryDialog } from './components/ask-ai'
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
}

const PostWriteView = defineComponent(() => {
  const route = useRoute()

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
  })

  const parsePayloadIntoReactiveData = (payload: PostModel) => {
    const raw = toRaw(data)
    const keys = Object.keys(raw)
    for (const k in payload) {
      if (keys.includes(k)) {
        data[k] = payload[k]
      }
    }
  }

  const postListState = useMemoPostList()

  const data = reactive<PostReactiveType>(resetReactive())
  const id = computed(() => route.query.id)

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

    const { CrossBellConnector } = await import('components/xlog-connect/class')

    if (id.value) {
      // update
      if (!isString(id.value)) {
        return
      }
      const $id = id.value as string
      const response = await RESTManager.api.posts($id).put<PostModel>({
        data: payload,
      })
      message.success('修改成功')
      await CrossBellConnector.createOrUpdate(response)
    } else {
      // create
      const response = await RESTManager.api.posts.post<PostModel>({
        data: payload,
      })
      message.success('发布成功')
      await CrossBellConnector.createOrUpdate(response)
    }

    router.push({ name: RouteName.ViewPost, hash: '|publish' })
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
  const dialog = useDialog()
  const handleAskAI = () => {
    const $dialog = dialog.create({
      title: 'OpenAI article summary',
      content: () => (
        <AISummaryDialog
          article={data.text}
          onSuccess={(summary) => {
            data.summary = summary
            $dialog.destroy()
          }}
        />
      ),
    })
  }

  return () => (
    <ContentLayout
      title={id.value ? '修改文章' : '撰写新文章'}
      headerClass="pt-1"
      actionsElement={
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

          <HeaderPreviewButton getData={() => ({ ...data })} />
          <HeaderActionButton
            icon={<TelegramPlaneIcon />}
            onClick={handleSubmit}
          ></HeaderActionButton>
        </>
      }
      footerButtonElement={
        <>
          <button onClick={handleOpenDrawer}>
            <Icon>
              <SlidersHIcon />
            </Icon>
          </button>
        </>
      }
    >
      <MaterialInput
        class="mt-3 relative z-10"
        label="想想取个什么标题好呢~"
        value={data.title}
        onChange={(e) => {
          data.title = e
        }}
      ></MaterialInput>

      <div class={'text-gray-500 py-3'}>
        <label class="prefix">{`${WEB_URL}/${category.value.slug}/`}</label>

        <UnderlineInput
          class="ml-2"
          value={data.slug}
          onChange={(e) => {
            data.slug = e
          }}
        />
      </div>

      <CrossBellConnectorIndirector />
      <EditorToggleWrapper
        loading={!!(id.value && typeof data.id == 'undefined')}
        onChange={(v) => {
          data.text = v
        }}
        text={data.text}
      />

      {/* Drawer  */}
      <TextBaseDrawer
        show={drawerShow.value}
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
        data={data}
      >
        <NFormItem label="分类" required path="category">
          <NSelect
            placeholder="请选择"
            value={category.value.id}
            onUpdateValue={(e) => {
              data.categoryId = e
            }}
            options={
              categoryStore.data.value?.map((i) => ({
                label: i.name,
                value: i.id,
                key: i.id,
              })) || []
            }
          ></NSelect>
        </NFormItem>

        <NFormItem label="标签">
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
                    const tags = ref([] as SelectMixedOption[])
                    const loading = ref(false)
                    const value = ref('')
                    const selectRef = ref()
                    onMounted(async () => {
                      loading.value = true
                      // HACK auto focus
                      if (selectRef.value) {
                        selectRef.value.$el.querySelector('input').focus()
                      }
                      const { data } = await RESTManager.api.categories.get<{
                        data: TagModel[]
                      }>({
                        params: { type: 'Tag' },
                      })
                      tags.value = data.map((i) => ({
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
                        options={tags.value}
                        onUpdateValue={(e) => {
                          void (value.value = e)
                          submit(e)
                        }}
                      ></NSelect>
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
            filterable
            clearable
            loading={postListState.loading.value}
            multiple
            onClear={() => {
              postListState.refresh()
            }}
            value={data.relatedId}
            onUpdateValue={(values) => {
              data.relatedId = values
            }}
            resetMenuOnOptionsChange={false}
            options={postListState.datalist.value.map((item) => ({
              label: item.title,
              value: item.id,
              key: item.id,
              disabled: item.id == data.id,
            }))}
            onScroll={handleFetchNext}
          ></NSelect>
        </NFormItem>

        <NFormItem label="摘要">
          <NInput
            type="textarea"
            autosize={{
              minRows: 2,
              maxRows: 4,
            }}
            placeholder="文章摘要"
            value={data.summary}
            onInput={(e) => void (data.summary = e)}
          >
            {{
              suffix() {
                return (
                  <NPopover>
                    {{
                      trigger() {
                        return (
                          <NButton text onClick={handleAskAI}>
                            <OpenAI />
                          </NButton>
                        )
                      },
                      default() {
                        return 'Ask AI'
                      },
                    }}
                  </NPopover>
                )
              },
            }}
          </NInput>
        </NFormItem>

        <NFormItem label="版权注明" labelAlign="right" labelPlacement="left">
          <NSwitch
            value={data.copyright}
            onUpdateValue={(e) => void (data.copyright = e)}
          ></NSwitch>
        </NFormItem>

        <NFormItem label="置顶" labelAlign="right" labelPlacement="left">
          <NSwitch
            value={!!data.pin}
            onUpdateValue={(e) => {
              data.pin = e

              if (!e) {
                data.pinOrder = 1
              }
            }}
          ></NSwitch>
        </NFormItem>

        <NFormItem label="置顶顺序" labelAlign="right" labelPlacement="left">
          <NInputNumber
            disabled={!data.pin}
            value={data.pinOrder}
            onUpdateValue={(e) => void (data.pinOrder = e || 1)}
          ></NInputNumber>
        </NFormItem>
      </TextBaseDrawer>
    </ContentLayout>
  )
})

export default PostWriteView
