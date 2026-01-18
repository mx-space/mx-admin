import { isString } from 'es-toolkit/compat'
import transform from 'lodash.transform'
import { Send as SendIcon } from 'lucide-vue-next'
import { NDynamicTags, NForm, NFormItem, NInput } from 'naive-ui'
import { computed, defineComponent, onMounted, reactive, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { IGithubRepo } from '~/external/api/github-repo'
import type { ProjectModel } from '~/models/project'

import { useMutation } from '@tanstack/vue-query'

import { projectsApi } from '~/api/projects'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { Editor } from '~/components/editor/universal'
import { FetchGithubRepoButton } from '~/components/special-button/fetch-github-repo'
import { useParsePayloadIntoData } from '~/hooks/use-parse-payload'
import { useLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'

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
        const data = await projectsApi.getById($id)
        parsePayloadIntoReactiveData(data as ProjectModel)
      }
    })

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
      } catch (error) {
        message.error(error as any)
        throw error
      }
    }

    // 创建项目
    const createMutation = useMutation({
      mutationFn: (data: any) => projectsApi.create(data),
      onSuccess: () => {
        message.success('发布成功')
        router.push({ name: RouteName.ListProject })
      },
    })

    // 更新项目
    const updateMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: any }) =>
        projectsApi.update(id, data),
      onSuccess: () => {
        message.success('修改成功')
        router.push({ name: RouteName.ListProject })
      },
    })

    const handleSubmit = () => {
      const payload = parseDataToPayload()
      if (id.value) {
        if (!isString(id.value)) return
        updateMutation.mutate({ id: id.value as string, data: payload })
      } else {
        createMutation.mutate(payload)
      }
    }

    const handleParseFromGithub = (
      data: IGithubRepo,
      readme?: string | null,
    ) => {
      const { html_url, homepage, description } = data

      const pickImagesFromMarkdown = (text: string) => {
        const reg = /(?<=!\[.*]\()(.+)(?=\))/g
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

    const { setActions } = useLayout()
    setActions(
      <Fragment>
        <FetchGithubRepoButton
          onData={handleParseFromGithub}
          defaultValue={project.projectUrl}
        />
        <HeaderActionButton
          variant="primary"
          onClick={handleSubmit}
          icon={<SendIcon />}
        />
      </Fragment>,
    )

    return () => (
      <NForm labelWidth="7rem" labelPlacement="left" labelAlign="left">
        <NFormItem label="项目名称" required>
          <NInput
            autofocus
            placeholder=""
            value={project.name}
            onInput={(e) => void (project.name = e)}
          />
        </NFormItem>

        <NFormItem label="文档地址">
          <NInput
            placeholder=""
            value={project.docUrl}
            onInput={(e) => void (project.docUrl = e)}
          />
        </NFormItem>

        <NFormItem label="预览地址">
          <NInput
            placeholder=""
            value={project.previewUrl}
            onInput={(e) => void (project.previewUrl = e)}
          />
        </NFormItem>

        <NFormItem label="项目地址">
          <NInput
            placeholder=""
            value={project.projectUrl}
            onInput={(e) => void (project.projectUrl = e)}
          />
        </NFormItem>

        <NFormItem label="项目描述" required>
          <NInput
            placeholder=""
            value={project.description}
            onInput={(e) => void (project.description = e)}
          />
        </NFormItem>

        <NFormItem label="项目图标">
          <NInput
            placeholder=""
            value={project.avatar}
            onInput={(e) => void (project.avatar = e)}
          />
        </NFormItem>

        <NFormItem label="预览图片">
          <NDynamicTags
            round
            value={project.images}
            onUpdateValue={(e) => void (project.images = e)}
          />
        </NFormItem>

        <NFormItem label="正文" required>
          <div class="w-full">
            <Editor
              unSaveConfirm={false}
              class="h-[calc(100vh-40rem)] min-h-80 w-full"
              loading={!!(id.value && !project.id)}
              onChange={(v) => {
                project.text = v
              }}
              text={project.text}
            />
          </div>
        </NFormItem>
      </NForm>
    )
  },
})

export default EditProjectView
