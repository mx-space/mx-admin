import { HeaderActionButton } from 'components/button/rounded-button'
import { EditorToggleWrapper } from 'components/editor/universal/toggle'
import { SendIcon } from 'components/icons'
import { FetchGithubRepoButton } from 'components/special-button/fetch-github-repo'
import type { IGithubRepo } from 'external/api/github-repo'
import { useParsePayloadIntoData } from 'hooks/use-parse-payload'
import { ContentLayout } from 'layouts/content'
import { isString, transform } from 'lodash-es'
import type { ProjectModel } from 'models/project'
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

  id: undefined | string
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

      id: undefined,
    })

    const parsePayloadIntoReactiveData = (payload: ProjectModel) =>
      useParsePayloadIntoData(project)(payload)
    const project = reactive<ProjectReactiveType>(resetReactive())
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
          if (!project.text || project.text.trim().length == 0) {
            throw '内容为空'
          }

          return {
            ...transform(
              toRaw(project),
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
            text: project.text.trim(),
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

    const handleParseFromGithub = (
      data: IGithubRepo,
      readme?: string | null,
    ) => {
      const { html_url, homepage, description } = data

      const pickImagesFromMarkdown = (text: string) => {
        const reg = /(?<=!\[.*\]\()(.+)(?=\))/g
        const images = [] as string[]
        for (const r of text.matchAll(reg)) {
          images.push(r[0])
        }
        return images
      }

      Object.assign<Partial<ProjectModel>, Partial<ProjectModel>>(project, {
        description,

        projectUrl: html_url,
        previewUrl: homepage,
        images: pickImagesFromMarkdown(readme || ''),

        name: data.name,
        text: readme || '',
      })
    }

    return () => (
      <ContentLayout
        actionsElement={
          <Fragment>
            <FetchGithubRepoButton
              onData={handleParseFromGithub}
              defaultValue={project.projectUrl}
            />
            <HeaderActionButton
              variant="primary"
              onClick={handleSubmit}
              icon={<SendIcon />}
            ></HeaderActionButton>
          </Fragment>
        }
      >
        <NForm labelWidth="7rem" labelPlacement="left" labelAlign="left">
          <NFormItem label="项目名称" required>
            <NInput
              autofocus
              placeholder=""
              value={project.name}
              onInput={(e) => void (project.name = e)}
            ></NInput>
          </NFormItem>

          <NFormItem label="文档地址">
            <NInput
              placeholder=""
              value={project.docUrl}
              onInput={(e) => void (project.docUrl = e)}
            ></NInput>
          </NFormItem>

          <NFormItem label="预览地址">
            <NInput
              placeholder=""
              value={project.previewUrl}
              onInput={(e) => void (project.previewUrl = e)}
            ></NInput>
          </NFormItem>

          <NFormItem label="项目地址">
            <NInput
              placeholder=""
              value={project.projectUrl}
              onInput={(e) => void (project.projectUrl = e)}
            ></NInput>
          </NFormItem>

          <NFormItem label="项目描述" required>
            <NInput
              placeholder=""
              value={project.description}
              onInput={(e) => void (project.description = e)}
            ></NInput>
          </NFormItem>

          <NFormItem label="项目图标">
            <NInput
              placeholder=""
              value={project.avatar}
              onInput={(e) => void (project.avatar = e)}
            ></NInput>
          </NFormItem>

          <NFormItem label="预览图片">
            <NDynamicTags
              round
              value={project.images}
              onUpdateValue={(e) => void (project.images = e)}
            ></NDynamicTags>
          </NFormItem>

          <NFormItem label="正文" required>
            <div class="w-full">
              <EditorToggleWrapper
                unSaveConfirm={false}
                class="min-h-80 w-full h-[calc(100vh-40rem)]"
                loading={!!(id.value && !project.id)}
                onChange={(v) => {
                  project.text = v
                }}
                text={project.text}
              />
            </div>
          </NFormItem>
        </NForm>
      </ContentLayout>
    )
  },
})

export default EditProjectView
