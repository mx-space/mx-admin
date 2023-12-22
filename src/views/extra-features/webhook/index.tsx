import {
  NButton,
  NButtonGroup,
  NList,
  NListItem,
  NThing,
  useDialog,
} from 'naive-ui'
import useSWRV from 'swrv'
import type { WebhookModel } from '~/models/wehbook'
import type { PropType } from 'vue'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { PlusIcon } from '~/components/icons'
import { ContentLayout } from '~/layouts/content'
import { RESTManager } from '~/utils'

export default defineComponent({
  setup() {
    const { data } = useSWRV('webhook.list', async () => {
      return RESTManager.api.webhook.get<WebhookModel[]>()
    })

    const dialog = useDialog()
    const presetCreateModal = () => {
      dialog.create({
        title: 'Create Webhook',
        content: () => <EditWebhookForm />,
      })
    }
    return () => (
      <ContentLayout
        actionsElement={
          <HeaderActionButton
            name="Add Webhook"
            icon={<PlusIcon />}
            onClick={presetCreateModal}
          />
        }
      >
        <NList hoverable clickable>
          {data.value?.map((item) => {
            return (
              <NListItem key={item.id}>
                <NThing
                  title={item.payloadUrl}
                  description={item.events.join(',')}
                >
                  {{
                    suffix() {
                      return (
                        <NButtonGroup>
                          <NButton>编辑</NButton>
                          <NButton>删除</NButton>
                        </NButtonGroup>
                      )
                    },
                  }}
                </NThing>
              </NListItem>
            )
          })}
        </NList>
      </ContentLayout>
    )
  },
})

export const EditWebhookForm = defineComponent({
  props: {
    formData: {
      type: Object as PropType<WebhookModel>,
      required: false,
    },
  },
  setup(props) {
    const isEdit = props.formData !== undefined
    return () => (
      <div class={'w-[800px] max-w-[80vw]'}>
        <NButton>提交</NButton>
      </div>
    )
  },
})
