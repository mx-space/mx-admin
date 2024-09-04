import { NList, NListItem } from 'naive-ui'
import useSWRV from 'swrv'

import { GithubIcon, MingcuteUserStarFill } from '~/components/icons'
import { ContentLayout } from '~/layouts/content'
import { RESTManager } from '~/utils'

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
