import { HeaderActionButton } from 'components/button/rounded-button'
import { CommentIcon, SendIcon } from 'components/icons'
import { SentenceType, fetchHitokoto } from 'external/api/hitokoto'
import { useParsePayloadIntoData } from 'hooks/use-parse-payload'
import { ContentLayout } from 'layouts/content'
import { isString, transform } from 'lodash-es'
import type { SayModel } from 'models/say'
import { NForm, NFormItem, NInput, useDialog } from 'naive-ui'
import { RouteName } from 'router/name'
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

    onBeforeMount(() => {
      fetchHitokoto([
        SentenceType.原创,
        SentenceType.哲学,
        SentenceType.文学,
        SentenceType.诗词,
      ]).then((data) => {
        placeholder.value = {
          source: data.from,
          text: data.hitokoto,
          author: data.from_who || data.creator,
        }
      })
    })
    const dialog = useDialog()
    const handlePostHitokoto = async () => {
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
            ...transform(
              toRaw(data),
              (res, v, k) => (
                (res[k] =
                  typeof v == 'undefined'
                    ? null
                    : typeof v == 'string' && v.length == 0
                    ? ''
                    : v),
                res
              ),
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
        await RESTManager.api.says($id).put({
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
                icon={<SendIcon></SendIcon>}
              ></HeaderActionButton>
            ) : (
              <>
                <HeaderActionButton
                  name="发布一言"
                  variant={'info'}
                  onClick={handlePostHitokoto}
                  icon={<CommentIcon></CommentIcon>}
                ></HeaderActionButton>
                <HeaderActionButton
                  name="发布自己说的"
                  variant={'primary'}
                  onClick={handleSubmit}
                  icon={<SendIcon></SendIcon>}
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
              onInput={(e) => void (data.text = e)}
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
              onInput={(e) => void (data.author = e)}
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
              onInput={(e) => void (data.source = e)}
            ></NInput>
          </NFormItem>
        </NForm>
      </ContentLayout>
    )
  },
})

export default EditSay
