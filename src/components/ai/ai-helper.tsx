import { NButton, NIcon, NTooltip } from 'naive-ui'

import { OpenAIIcon } from '~/components/icons'
import { RESTManager } from '~/utils'

enum AiQueryType {
  TitleSlug = 'title-slug',
  Title = 'title',
}

export const AiHelperButton = defineComponent({
  props: {
    reactiveData: {
      type: Object as PropType<{
        title: string
        text: string
        slug?: string
      }>,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(false)

    const callApi = async () => {
      const { title, text } = props.reactiveData

      if (!text && !title) {
        return
      }

      const hasSlug = 'slug' in props.reactiveData

      loading.value = true
      if (title && hasSlug) {
        if (!hasSlug) {
          return
        }
        const { slug } = await RESTManager.api.ai.writer.generate
          .post<{
            slug: string
          }>({
            data: {
              type: AiQueryType.Title,
              title,
            },
          })
          .finally(() => {
            loading.value = false
          })

        props.reactiveData.slug = slug
      } else if (text) {
        const aiResult = await RESTManager.api.ai.writer.generate
          .post<{
            slug: string
            title: string
          }>({
            data: {
              type: AiQueryType.TitleSlug,
              text,
            },
          })
          .finally(() => {
            loading.value = false
          })

        props.reactiveData.title = aiResult.title

        if (hasSlug) props.reactiveData.slug = aiResult.slug
      }
    }
    return () => {
      return (
        <NTooltip>
          {{
            default() {
              return 'AI 生成标题或者 Slug'
            },
            trigger() {
              return (
                <NButton
                  size="tiny"
                  disabled={
                    loading.value &&
                    (!props.reactiveData.text || !props.reactiveData.title)
                  }
                  loading={loading.value}
                  onClick={callApi}
                  text
                  class={'ml-2'}
                >
                  <NIcon>{!loading.value && <OpenAIIcon />}</NIcon>
                </NButton>
              )
            },
          }}
        </NTooltip>
      )
    }
  },
})
