import SlidersH from '@vicons/fa/es/SlidersH'
import TelegramPlane from '@vicons/fa/es/TelegramPlane'
import { Icon } from '@vicons/utils'
import { HeaderActionButton } from 'components/button/rounded-button'
import { EditorToggleWrapper } from 'components/editor'
import { MaterialInput } from 'components/input/material-input'
import { UnderlineInput } from 'components/input/underline-input'
import { ParseContentButton } from 'components/logic/parse-button'
import { BASE_URL } from 'constants/env'
import { useParsePayloadIntoData } from 'hooks/use-parse-payload'
import { ContentLayout } from 'layouts/content'
import { isString } from 'lodash-es'
import { PageModel } from 'models/page'
import {
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInputNumber,
  useMessage,
} from 'naive-ui'
import { RouteName } from 'router/name'
import { RESTManager } from 'utils/rest'
import { computed, defineComponent, onMounted, reactive, ref, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
type PageReactiveType = {
  title: string
  text: string
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
  })

  const parsePayloadIntoReactiveData = (payload: PageModel) =>
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
      } catch (e) {
        message.error(e as any)

        throw e
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
      actionsElement={
        <>
          <ParseContentButton data={data} />

          <HeaderActionButton
            icon={<TelegramPlane />}
            onClick={handleSubmit}
          ></HeaderActionButton>
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
        label={'与你有个好心情~'}
        value={data.title}
        onChange={(e) => {
          data.title = e
        }}
      ></MaterialInput>

      <div class={'text-gray-500 py-3'}>
        <label>{`${BASE_URL}/`}</label>
        <UnderlineInput
          value={data.slug}
          onChange={(e) => void (data.slug = e)}
        ></UnderlineInput>
      </div>

      <EditorToggleWrapper
        loading={!!(id.value && !data.title)}
        onChange={(v) => {
          data.text = v
        }}
        text={data.text}
      />

      {/* Drawer  */}

      <NDrawer
        show={drawerShow.value}
        width={450}
        style={{ maxWidth: '90vw' }}
        placement="right"
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
      >
        <NDrawerContent title="文章设定">
          <NForm>
            <NFormItem label="页面顺序">
              <NInputNumber
                placeholder=""
                value={data.order}
                onChange={(e) => void (data.order = e ?? 0)}
              ></NInputNumber>
            </NFormItem>
          </NForm>
        </NDrawerContent>
      </NDrawer>
      {/* Drawer END */}
    </ContentLayout>
  )
})

export default PageWriteView
