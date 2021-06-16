import { Send16Filled, Send16Regular } from '@vicons/fluent'
import { HeaderActionButton } from 'components/button/rounded-button'
import { MonacoEditor } from 'components/editor/monaco'
import { MaterialInput } from 'components/input/material-input'
import { UnderlineInput } from 'components/input/underline-input'
import { baseUrl } from 'constants/env'
import { ContentLayout } from 'layouts/content'
import { CategoryModel } from 'models/category'
import { PostModel } from 'models/post'
import { CategoryStore } from 'stores/category'
import { useInjector } from 'utils/deps-injection'
import { RESTManager } from 'utils/rest'
import { computed, defineComponent, onMounted, reactive, ref, toRaw } from 'vue'
import { useRoute } from 'vue-router'
import { editor as Editor } from 'monaco-editor'
import { Icon } from '@vicons/utils'
import { SlidersH } from '@vicons/fa'
import { NDrawer, NDrawerContent, NForm, NFormItem, NSelect } from 'naive-ui'
type PostReactiveType = {
  title: string
  text: string
  slug: string
  categoryId: string
  copyright: boolean
  tags: string[]
  hide: boolean
}

const PostWriteView = defineComponent(() => {
  const route = useRoute()

  const categoryStore = useInjector(CategoryStore)
  onMounted(async () => {
    await categoryStore.fetch()
  })
  const currentSelectCategoryId = ref('')
  const category = computed(
    () =>
      categoryStore.get(currentSelectCategoryId.value) ||
      categoryStore.data?.value?.[0] ||
      ({} as CategoryModel),
  )

  const resetReactive: () => PostReactiveType = () => ({
    categoryId: category.value.id,
    slug: '',
    text: '',
    title: '',
    copyright: true,
    tags: [],
    hide: false,
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

  const data = reactive<PostReactiveType>(resetReactive())
  const id = computed(() => route.query.id)
  onMounted(async () => {
    const $id = id.value
    if ($id && typeof $id == 'string') {
      const payload = (await RESTManager.api.posts($id).get()) as any
      parsePayloadIntoReactiveData(payload.data as PostModel)
    }
  })

  const monacoRef = ref<Editor.IStandaloneCodeEditor>()

  const drawerShow = ref(false)

  return () => (
    <ContentLayout
      title={id.value ? '修改文章' : '撰写新文章'}
      actionsElement={
        <>
          <HeaderActionButton icon={<Send16Filled />}></HeaderActionButton>
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
        label="想想取个什么标题好呢~"
        value={data.title}
        onChange={e => {
          data.title = e
        }}
      ></MaterialInput>

      <div class={'text-gray-500 '}>
        <label class="prefix">{`${baseUrl}/${category.value.slug}/`}</label>

        <UnderlineInput
          class="ml-2"
          value={data.slug}
          onChange={e => {
            data.slug = e
          }}
        />
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

      <NDrawer show={drawerShow.value} width={450} placement="right">
        <NDrawerContent title="文章设定">
          <NForm>
            <NFormItem label="分类">
              <NSelect
                value={data.categoryId}
                onUpdateValue={e => {
                  data.categoryId = e
                }}
                options={
                  categoryStore.data.value?.map(i => ({
                    label: i.name,
                    value: i.id,
                    key: i.id,
                  })) || []
                }
              ></NSelect>
            </NFormItem>
          </NForm>
        </NDrawerContent>
      </NDrawer>
    </ContentLayout>
  )
})

export default PostWriteView
