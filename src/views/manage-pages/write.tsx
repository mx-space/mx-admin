import { isString } from 'es-toolkit/compat'
import { NFormItem, NInputNumber, useMessage } from 'naive-ui'
import { computed, defineComponent, onMounted, reactive, ref, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PageModel } from '~/models/page'
import type { WriteBaseType } from '~/shared/types/base'

import { Icon } from '@vicons/utils'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { TextBaseDrawer } from '~/components/drawer/text-base-drawer'
import { Editor } from '~/components/editor/universal'
import { SlidersHIcon, TelegramPlaneIcon } from '~/components/icons'
import { MaterialInput } from '~/components/input/material-input'
import { UnderlineInput } from '~/components/input/underline-input'
import { ParseContentButton } from '~/components/special-button/parse-content'
import {
  HeaderPreviewButton,
  PreviewSplitter,
} from '~/components/special-button/preview'
import { WEB_URL } from '~/constants/env'
import { useParsePayloadIntoData } from '~/hooks/use-parse-payload'
import { ContentLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'
import { RESTManager } from '~/utils/rest'

type PageReactiveType = WriteBaseType & {
  subtitle: string
  slug: string
  order: number
}

const PageWriteView = defineComponent(() => {
  const route = useRoute()

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
    // biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
    useParsePayloadIntoData(data)(payload)
  const data = reactive<PageReactiveType>(resetReactive())
  const id = computed(() => route.query.id)

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
  }

  return () => (
    <ContentLayout
      headerClass="pt-1"
      actionsElement={
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
            icon={<TelegramPlaneIcon />}
            onClick={handleSubmit}
          />
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
              <SlidersHIcon />
            </Icon>
          </button>
        </>
      }
    >
      <MaterialInput
        class="relative z-10 mt-3"
        label={'与你有个好心情~'}
        value={data.title}
        onChange={(e) => {
          data.title = e
        }}
      />

      <div class={'pt-3 text-gray-700 dark:text-gray-300'}>
        <UnderlineInput
          value={data.subtitle}
          onChange={(e) => void (data.subtitle = e)}
        />
      </div>
      <div class={'py-3 text-gray-500'}>
        <label>{`${WEB_URL}/`}</label>
        <UnderlineInput
          value={data.slug}
          onChange={(e) => void (data.slug = e)}
        />
      </div>
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
    </ContentLayout>
  )
})

export default PageWriteView
