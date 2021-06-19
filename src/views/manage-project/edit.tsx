import { TelegramPlane } from '@vicons/fa'
import { HeaderActionButton } from 'components/button/rounded-button'
import { MonacoEditor } from 'components/editor/monaco'
import { useParsePayloadIntoData } from 'hooks/use-parse-payload'
import { ContentLayout } from 'layouts/content'
import { isString, transform } from 'lodash-es'
import { ProjectModel } from 'models/project'
import { NDynamicTags, NForm, NFormItem, NInput } from 'naive-ui'
import { RouteName } from 'router/name'
import { RESTManager } from 'utils'
import { computed, defineComponent, onMounted, reactive, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
type ProjectReactiveType = {
  name: string
  previewUrl: string
  docUrl: string
  projectUrl: string
  images: string[]
  description: string
  avatar: string
  text: string
}

const EditProjectView = defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()

    const resetReactive: () => ProjectReactiveType = () => ({
      name: '',
      previewUrl: '',
      docUrl: '',
      projectUrl: '',
      images: [],
      description: '',
      avatar: '',
      text: '',
    })

    const parsePayloadIntoReactiveData = (payload: ProjectModel) =>
      useParsePayloadIntoData(data)(payload)
    const data = reactive<ProjectReactiveType>(resetReactive())
    const id = computed(() => route.query.id)

    onMounted(async () => {
      const $id = id.value
      if ($id && typeof $id == 'string') {
        const payload = (await RESTManager.api.projects($id).get({})) as any

        const data = payload.data
        parsePayloadIntoReactiveData(data as ProjectModel)
      }
    })

    const handleSubmit = async () => {
      const parseDataToPayload = (): { [key in keyof ProjectModel]?: any } => {
        try {
          if (!data.text || data.text.trim().length == 0) {
            throw '内容为空'
          }

          return {
            ...transform(
              toRaw(data),
              (res, i, k) => (
                (res[k] =
                  typeof i == 'undefined'
                    ? null
                    : typeof i == 'string' && i.length == 0
                    ? ''
                    : i),
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
        await RESTManager.api.projects($id).put({
          data: parseDataToPayload(),
        })
        message.success('修改成功')
      } else {
        // create
        await RESTManager.api.projects.post({
          data: parseDataToPayload(),
        })
        message.success('发布成功')
      }

      router.push({ name: RouteName.ListProject })
    }

    return () => (
      <ContentLayout
        actionsElement={
          <Fragment>
            <HeaderActionButton
              variant="primary"
              onClick={handleSubmit}
              icon={<TelegramPlane></TelegramPlane>}
            ></HeaderActionButton>
          </Fragment>
        }
      >
        <NForm>
          <NFormItem
            label="项目名称"
            required
            labelPlacement="left"
            labelStyle={{ width: '6rem' }}
          >
            <NInput
              autofocus
              placeholder=""
              value={data.name}
              onInput={(e) => void (data.name = e)}
            ></NInput>
          </NFormItem>

          <NFormItem
            label="文档地址"
            labelPlacement="left"
            labelStyle={{ width: '6rem' }}
          >
            <NInput
              placeholder=""
              value={data.docUrl}
              onInput={(e) => void (data.docUrl = e)}
            ></NInput>
          </NFormItem>

          <NFormItem
            label="预览地址"
            labelPlacement="left"
            labelStyle={{ width: '6rem' }}
          >
            <NInput
              placeholder=""
              value={data.previewUrl}
              onInput={(e) => void (data.previewUrl = e)}
            ></NInput>
          </NFormItem>

          <NFormItem
            label="项目地址"
            labelPlacement="left"
            labelStyle={{ width: '6rem' }}
          >
            <NInput
              placeholder=""
              value={data.projectUrl}
              onInput={(e) => void (data.projectUrl = e)}
            ></NInput>
          </NFormItem>

          <NFormItem
            label="项目描述"
            required
            labelPlacement="left"
            labelStyle={{ width: '6rem' }}
          >
            <NInput
              placeholder=""
              value={data.description}
              onInput={(e) => void (data.description = e)}
            ></NInput>
          </NFormItem>

          <NFormItem
            label="项目图标"
            labelPlacement="left"
            labelStyle={{ width: '6rem' }}
          >
            <NInput
              placeholder=""
              value={data.avatar}
              onInput={(e) => void (data.avatar = e)}
            ></NInput>
          </NFormItem>

          <NFormItem
            label="项目图标"
            labelPlacement="left"
            labelStyle={{ width: '6rem' }}
          >
            <NDynamicTags
              value={data.images}
              onUpdateValue={(e) => void (data.images = e)}
            ></NDynamicTags>
          </NFormItem>

          <NFormItem label="正文" required>
            <MonacoEditor
              onChange={(e) => void (data.text = e)}
              text={data.text}
              class="h-40 w-full"
              unSaveConfirm={false}
            />
          </NFormItem>
        </NForm>
      </ContentLayout>
    )
  },
})

export default EditProjectView
