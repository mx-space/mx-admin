import { isString } from 'es-toolkit/compat'
import {
  FileTextIcon,
  SlidersHorizontal as SlidersHIcon,
  Send as TelegramPlaneIcon,
} from 'lucide-vue-next'
import { NInputNumber, useMessage } from 'naive-ui'
import {
  computed,
  defineComponent,
  onMounted,
  reactive,
  ref,
  toRaw,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PageModel } from '~/models/page'
import type { WriteBaseType } from '~/shared/types/base'

import { HeaderActionButton } from '~/components/button/rounded-button'
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
import { useServerDraft } from '~/hooks/use-server-draft'
import { DraftRefType } from '~/models/draft'
import { pagesApi, type CreatePageData } from '~/api/pages'
import { useParsePayloadIntoData } from '~/hooks/use-parse-payload'
import { useLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'

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
  const id = computed(() => route.query.id as string | undefined)
  const draftIdFromRoute = computed(
    () => route.query.draftId as string | undefined,
  )

  const loading = computed(() => !!(id.value && typeof data.id === 'undefined'))

  const router = useRouter()

  // 服务端草稿 hook
  const serverDraft = useServerDraft(DraftRefType.Page, {
    refId: id.value,
    draftId: draftIdFromRoute.value,
    interval: 10000,
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
  })

  const draftInitialized = ref(false)

  onMounted(async () => {
    const $id = id.value
    const $draftId = draftIdFromRoute.value

    // 场景1：通过 draftId 加载草稿
    if ($draftId) {
      const draft = await serverDraft.loadDraftById($draftId)
      if (draft) {
        data.title = draft.title
        data.text = draft.text
        data.images = draft.images || []
        data.meta = draft.meta
        if (draft.typeSpecificData) {
          const specific = draft.typeSpecificData
          data.slug = specific.slug || ''
          data.subtitle = specific.subtitle || ''
          data.order = specific.order ?? 0
        }
        serverDraft.syncMemory()
        serverDraft.startAutoSave()
        draftInitialized.value = true
        return
      }
    }

    // 场景2：编辑已发布页面
    if ($id && typeof $id == 'string') {
      const payload = (await pagesApi.getById($id)) as any

      const pageData = payload.data
      parsePayloadIntoReactiveData(pageData as PageModel)

      // 检查是否有关联的草稿
      const relatedDraft = await serverDraft.loadDraftByRef(
        DraftRefType.Page,
        $id,
      )
      if (relatedDraft) {
        window.dialog.info({
          title: '检测到未保存的草稿',
          content: `上次保存时间: ${new Date(relatedDraft.updated).toLocaleString()}`,
          negativeText: '使用已发布版本',
          positiveText: '恢复草稿',
          onNegativeClick() {
            serverDraft.syncMemory()
            serverDraft.startAutoSave()
          },
          onPositiveClick() {
            data.title = relatedDraft.title
            data.text = relatedDraft.text
            data.images = relatedDraft.images || []
            data.meta = relatedDraft.meta
            if (relatedDraft.typeSpecificData) {
              const specific = relatedDraft.typeSpecificData
              data.slug = specific.slug || data.slug
              data.subtitle = specific.subtitle || data.subtitle
              data.order = specific.order ?? data.order
            }
            serverDraft.syncMemory()
            serverDraft.startAutoSave()
          },
        })
      } else {
        serverDraft.syncMemory()
        serverDraft.startAutoSave()
      }

      draftInitialized.value = true
      return
    }

    // 场景3：新建入口
    const pendingDrafts = await serverDraft.getNewDrafts(DraftRefType.Page)
    if (pendingDrafts.length > 0) {
      window.dialog.info({
        title: '发现未完成的草稿',
        content: `你有 ${pendingDrafts.length} 个未完成的页面草稿，是否继续编辑？`,
        negativeText: '创建新草稿',
        positiveText: '继续编辑',
        async onNegativeClick() {
          const newDraft = await serverDraft.createDraft()
          if (newDraft) {
            router.replace({ query: { draftId: newDraft.id } })
          }
          serverDraft.startAutoSave()
        },
        onPositiveClick() {
          const firstDraft = pendingDrafts[0]
          router.replace({ query: { draftId: firstDraft.id } })
        },
      })
    } else {
      const newDraft = await serverDraft.createDraft()
      if (newDraft) {
        router.replace({ query: { draftId: newDraft.id } })
      }
      serverDraft.startAutoSave()
    }

    draftInitialized.value = true
  })

  const drawerShow = ref(false)

  const message = useMessage()

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
      await pagesApi.update($id, parseDataToPayload())
      message.success('修改成功')
    } else {
      // create
      await pagesApi.create(parseDataToPayload() as CreatePageData)
      message.success('发布成功')
    }

    router.push({ name: RouteName.ListPage, hash: '|publish' })
    // 草稿保留作为历史记录
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

      {/* Drawer END */}
    </>
  )
})

export default PageWriteView
