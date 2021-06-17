import { TelegramPlane } from '@vicons/fa'
import { Comment12Filled } from '@vicons/fluent'
import { HeaderActionButton } from 'components/button/rounded-button'
import { useParsePayloadIntoData } from 'hooks/use-parse-payload'
import { ContentLayout } from 'layouts/content'
import { isString, omitBy } from 'lodash-es'
import { SayModel } from 'models/say'
import { NForm, NFormItem, NInput, useDialog } from 'naive-ui'
import { RouteName } from 'router/constants'
import { RESTManager } from 'utils'
import {
  computed,
  defineComponent,
  onBeforeMount,
  onMounted,
  reactive,
  ref,
  toRaw,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
type SayReactiveType = {
  text: string
  source: string
  author: string
}

const EditSay = defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()

    const resetReactive: () => SayReactiveType = () => ({
      text: '',
      author: '',
      source: '',
    })

    const placeholder = ref({} as SayModel)

    async function getHitokoto() {
      const json = await fetch('https://v1.hitokoto.cn/')
      const data = (await (json.json() as unknown)) as {
        id: number
        hitokoto: string
        type: string
        from: string
        from_who: string
        creator: string
        creator_uid: number
        reviewer: number
        uuid: string
        created_at: string
      }

      placeholder.value = {
        source: data.from,
        text: data.hitokoto,
        author: data.from_who || data.creator,
      }
    }

    onBeforeMount(() => {
      getHitokoto()
    })
    const dialog = useDialog()
    const handlePostHikotoko = async () => {
      const send = async () => {
        await RESTManager.api.says.post({
          data: placeholder.value,
        })
        message.success('发布成功')
        router.push({ name: RouteName.ListSay })
      }
      if (data.text || data.author || data.source) {
        dialog.create({
          title: '警告',
          content: '发布一言会覆盖现有的内容, 要继续吗',
          type: 'warning',
          negativeText: '取消',
          positiveText: '确定',

          onPositiveClick() {
            send()
          },
        })
      } else {
        send()
      }
    }

    const parsePayloadIntoReactiveData = (payload: SayModel) =>
      useParsePayloadIntoData(data)(payload)
    const data = reactive<SayReactiveType>(resetReactive())
    const id = computed(() => route.query.id)

    onMounted(async () => {
      const $id = id.value
      if ($id && typeof $id == 'string') {
        const payload = (await RESTManager.api.says($id).get({})) as any

        const data = payload.data
        parsePayloadIntoReactiveData(data as SayModel)
      }
    })

    const handleSubmit = async () => {
      const parseDataToPayload = (): { [key in keyof SayModel]?: any } => {
        try {
          if (!data.text || data.text.trim().length == 0) {
            throw '内容为空'
          }

          return {
            ...omitBy(
              toRaw(data),
              i => typeof i == 'undefined' || i.length == 0,
            ),
            text: data.text.trim(),
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
        await RESTManager.api.says.post({
          data: parseDataToPayload(),
        })
        message.success('发布成功')
      }

      router.push({ name: RouteName.ListSay })
    }

    return () => (
      <ContentLayout
        actionsElement={
          <Fragment>
            {isString(id) ? (
              <HeaderActionButton
                name="更新"
                variant="info"
                onClick={handleSubmit}
                icon={<TelegramPlane></TelegramPlane>}
              ></HeaderActionButton>
            ) : (
              <>
                <HeaderActionButton
                  name="发布一言"
                  variant={'info'}
                  onClick={handlePostHikotoko}
                  icon={<Comment12Filled></Comment12Filled>}
                ></HeaderActionButton>
                <HeaderActionButton
                  name="发布自己说的"
                  variant={'primary'}
                  onClick={handleSubmit}
                  icon={<TelegramPlane></TelegramPlane>}
                ></HeaderActionButton>
              </>
            )}
          </Fragment>
        }
      >
        <NForm>
          <NFormItem
            label="内容"
            required
            labelPlacement="left"
            labelStyle={{ width: '4rem' }}
          >
            <NInput
              type="textarea"
              autofocus
              autosize={{ minRows: 6, maxRows: 8 }}
              placeholder={placeholder.value.text}
              value={data.text}
              onInput={e => (data.text = e)}
            ></NInput>
          </NFormItem>
          <NFormItem
            label="作者"
            labelPlacement="left"
            labelStyle={{ width: '4rem' }}
          >
            <NInput
              placeholder={placeholder.value.author}
              value={data.author}
              onInput={e => (data.author = e)}
            ></NInput>
          </NFormItem>
          <NFormItem
            label="来源"
            labelPlacement="left"
            labelStyle={{ width: '4rem' }}
          >
            <NInput
              placeholder={placeholder.value.source}
              value={data.source}
              onInput={e => (data.source = e)}
            ></NInput>
          </NFormItem>
        </NForm>
      </ContentLayout>
    )
  },
})

export default EditSay
