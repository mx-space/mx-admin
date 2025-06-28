import { isString } from 'es-toolkit/compat'
import {
  NDynamicTags,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  useMessage,
} from 'naive-ui'
import { computed, defineComponent, onMounted, reactive, ref, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CategoryModel, TagModel } from '~/models/category'
import type { PostModel } from '~/models/post'
import type { WriteBaseType } from '~/shared/types/base'
import type { SelectMixedOption } from 'naive-ui/lib/select/src/interface'

import { Icon } from '@vicons/utils'

import { AiHelperButton } from '~/components/ai/ai-helper'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { TextBaseDrawer } from '~/components/drawer/text-base-drawer'
import { Editor } from '~/components/editor/universal'
import { SlidersHIcon, TelegramPlaneIcon, EyeIcon, EyeOffIcon } from '~/components/icons'
import { MaterialInput } from '~/components/input/material-input'
import { UnderlineInput } from '~/components/input/underline-input'
import { CopyTextButton } from '~/components/special-button/copy-text-button'
import { ParseContentButton } from '~/components/special-button/parse-content'
import {
  HeaderPreviewButton,
  PreviewSplitter,
} from '~/components/special-button/preview'
import { CrossBellConnectorIndirector } from '~/components/xlog-connect'
import { WEB_URL } from '~/constants/env'
import { EmitKeyMap } from '~/constants/keys'
import { useStoreRef } from '~/hooks/use-store-ref'
import { ContentLayout } from '~/layouts/content'
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

    const { CrossBellConnector } = await import(
      '~/components/xlog-connect/class'
    )

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

          <HeaderPreviewButton iframe data={data} />
          <HeaderActionButton
            icon={data.isPublished ? <EyeOffIcon /> : <EyeIcon />}
            variant={data.isPublished ? "warning" : "success"}
            onClick={async () => {
              if (!data.id) {
                message.warning('请先保存文章')
                return
              }
              
              const newStatus = !data.isPublished
              try {
                await RESTManager.api.posts(data.id)('publish').patch({
                  data: { isPublished: newStatus },
                })
                data.isPublished = newStatus
                message.success(newStatus ? '文章已发布' : '文章已设为草稿')
              } catch (_error) {
                message.error('状态切换失败')
              }
            }}
            name={data.isPublished ? '设为草稿' : '立即发布'}
          />

          <HeaderActionButton
            icon={<TelegramPlaneIcon />}
            onClick={handleSubmit}
          />
        </>
      }
      footerButtonElement={
        <>
          <button onClick={handleOpenDrawer} title="打开设置">
            <Icon>
              <SlidersHIcon />
            </Icon>
          </button>
        </>
      }
    >
      <MaterialInput
        class="relative z-10 mt-3"
        placeholder="输入标题"
        value={data.title}
        onInput={(e) => {
          data.title = e
        }}
      />

      <div class={'flex items-center py-3 text-gray-500'}>
        <label class="prefix">{`${WEB_URL}/posts/${category.value.slug}/`}</label>

        <UnderlineInput
          class="ml-2"
          value={data.slug}
          onChange={(e) => {
            data.slug = e
          }}
        />

        {(!data.title || !data.slug) && data.text.length > 0 && (
          <AiHelperButton reactiveData={data} />
        )}
        {!!data.slug && (
          <CopyTextButton
            text={`${WEB_URL}/posts/${category.value.slug}/${data.slug}`}
          />
        )}
      </div>

      <CrossBellConnectorIndirector />
      <PreviewSplitter>
        <Editor
          key={data.id}
          loading={!!(id.value && typeof data.id == 'undefined')}
          onChange={(v) => {
            data.text = v
          }}
          text={data.text}
        />
      </PreviewSplitter>

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
            options={categoryStore.selectOptions}
            value={data.category}
            onUpdateValue={(v) => {
              data.category = v
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
                      // HACK auto focus
                      if (selectRef.value) {
                        selectRef.value.$el.querySelector('input').focus()
                      }
                      const { data } = await RESTManager.api.categories.get<{
                        data: TagModel[]
                      }>({
                        params: { type: 'Tag' },
                      })
                      tagsRef.value = data.map((i) => ({
                        label: `${i.name} (${i.count})`,
                        value: i.name,
                        key: i.name,
                      }))
                      loading.value = false
                    })
                    return () => (
                      <NSelect
                        ref={selectRef}
                        filterable
                        tag
                        placeholder="输入，然后按回车创建"
                        options={tagsRef.value}
                        onCreate={(label) => {
                          const newTag = {
                            label: label,
                            value: label,
                          }
                          tagsRef.value.push(newTag)
                          data.tags.push(label)
                          nextTick(() => {
                            selectRef.value.focus()
                          })
                        }}
                        value={data.tags}
                        onUpdateValue={(v) => {
                          data.tags = v
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
            options={relatedRef.value}
            loading={isFetchingNext}
            remote
            filterable
            placeholder="搜索标题"
            onSearch={handleSearch}
            value={data.relatedIds}
            onUpdateValue={(val) => {
              data.relatedIds = val
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
            onInput={(e) => void (data.summary = e)}
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
              unchecked: () => '草稿'
            }}
          </NSwitch>
        </NFormItem>
      </TextBaseDrawer>
    </ContentLayout>
  )
})

export default PostWriteView
