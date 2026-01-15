import { UserRoundCheck as MingcuteUserStarFill } from 'lucide-vue-next'
import { NList, NListItem } from 'naive-ui'
import useSWRV from 'swrv'

import { ContentLayout } from '~/layouts/content'
import { RESTManager } from '~/utils'

const GithubIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24">
    <path
      d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
      fill="#fff"
    />
  </svg>
)

type ReaderModel = {
  id: string
  provider: string
  type: string
  name: string
  email: string
  image: string
  isOwner: boolean
}

const ReaderView = defineComponent({
  setup() {
    const { data } = useSWRV('reader', () =>
      RESTManager.api.readers.get<{ data: ReaderModel[] }>(),
    )
    return () => (
      <ContentLayout>
        <NList>
          {data.value?.data.map((reader) => (
            <NListItem>
              {{
                prefix() {
                  return (
                    <span
                      class={
                        'box-content inline-block h-10 w-10 rounded-full pl-4'
                      }
                    >
                      <img
                        class={'rounded-full'}
                        src={reader.image}
                        alt={reader.name}
                      />
                    </span>
                  )
                },
                default() {
                  return (
                    <div>
                      <h1 class={'flex items-center gap-2'}>
                        <ProviderIcon provider={reader.provider} />

                        {reader.name}

                        <span class={'text-yellow-500'}>
                          {reader.isOwner && <MingcuteUserStarFill />}
                        </span>
                      </h1>
                      <p>{reader.email}</p>
                    </div>
                  )
                },
              }}
            </NListItem>
          ))}
        </NList>
      </ContentLayout>
    )
  },
})

export default ReaderView

const ProviderIcon = defineComponent({
  props: {
    provider: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => {
      switch (props.provider) {
        case 'github':
          return (
            <span class={'rounded-full bg-black'}>
              <GithubIcon />
            </span>
          )

        default:
          return (
            <img
              class="h-4 w-4"
              src={`https://authjs.dev/img/providers/${props.provider}.svg`}
            />
          )
      }
    }
  },
})
