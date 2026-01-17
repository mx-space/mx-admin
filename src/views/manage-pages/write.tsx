import { isString } from 'es-toolkit/compat'
import {
  SlidersHorizontal as SlidersHIcon,
  Send as TelegramPlaneIcon,
} from 'lucide-vue-next'
import { NFormItem, NInputNumber, useMessage } from 'naive-ui'
import {
  computed,
  defineComponent,
  onMounted,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PageModel } from '~/models/page'
import type { WriteBaseType } from '~/shared/types/base'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { TextBaseDrawer } from '~/components/drawer/text-base-drawer'
import { WriteEditor } from '~/components/editor/write-editor'
import { SlugInput } from '~/components/editor/write-editor/slug-input'
import { ParseContentButton } from '~/components/special-button/parse-content'
import { HeaderPreviewButton } from '~/components/special-button/preview'
import { WEB_URL } from '~/constants/env'
import { useAutoSave, useAutoSaveInEditor } from '~/hooks/use-auto-save'
import { useParsePayloadIntoData } from '~/hooks/use-parse-payload'
import { useLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'
import { RESTManager } from '~/utils/rest'

type PageReactiveType = WriteBaseType & {
  subtitle: string
  slug: string
  order: number
}

const PageWriteView = defineComponent(() => {
  const route = useRoute()
  const { setTitle, setHeaderClass, setActions, setContentPadding } =
    useLayout()

  // 启用沉浸式编辑模式
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
  const id = computed(() => route.query.id)

  const loading = computed(() => !!(id.value && typeof data.id === 'undefined'))

  const autoSaveHook = useAutoSave(`page-${id.value || 'new'}`, 3000, () => ({
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
      const payload = (await RESTManager.api.pages($id).get({})) as any

      const data = payload.data
      parsePayloadIntoReactiveData(data as PageModel)
    }
  })

  const drawerShow = ref(false)

  const message = useMessage()
  const router = useRouter()

  const handleSubmit = async () => {
    const parseDataToPayload = (): { [key in keyof PageModel]?: any } => {
      try {
        if (!data.title || data.title.trim().length == 0) {
          throw '标题为空'
        }
        if (!data.slug) {
          throw '路径为空'
        }
        return {
          ...toRaw(data),
          title: data.title.trim(),
          slug: data.slug.trim(),
        }
      } catch (error) {
        message.error(error as any)

        throw error
      }
    }
    if (id.value) {
      // update
      if (!isString(id.value)) {
        return
      }
      const $id = id.value as string
      await RESTManager.api.pages($id).put({
        data: parseDataToPayload(),
      })
      message.success('修改成功')
    } else {
      // create
      await RESTManager.api.pages.post({
        data: parseDataToPayload(),
      })
      message.success('发布成功')
    }

    router.push({ name: RouteName.ListPage, hash: '|publish' })
    autoSaveInEditor.clearSaved()
  }

  // 设置 layout 状态
  setHeaderClass('pt-1')
  setTitle(id.value ? '修改页面' : '新建页面')
  setActions(
    <>
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

      <HeaderPreviewButton iframe data={data} />

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
          <div class="space-y-2">
            {/* Slug 输入 */}
            <SlugInput
              prefix={`${WEB_URL}/`}
              value={data.slug}
              onChange={(v) => {
                data.slug = v
              }}
              placeholder="slug"
            />
            {/* 副标题输入 */}
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

      {/* Drawer  */}
      <TextBaseDrawer
        disabledItem={['date-picker']}
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
        data={data}
        show={drawerShow.value}
      >
        <NFormItem label="页面顺序">
          <NInputNumber
            placeholder=""
            value={data.order}
            onUpdateValue={(e) => void (data.order = e ?? 0)}
          />
        </NFormItem>
      </TextBaseDrawer>

      {/* Drawer END */}
    </>
  )
})

export default PageWriteView
