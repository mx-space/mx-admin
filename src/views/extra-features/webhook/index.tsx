import {
  NButton,
  NButtonGroup,
  NCheckbox,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NLayoutContent,
  NList,
  NListItem,
  NSwitch,
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

const LIST_SWRV_KEY = 'webhook.list'

export default defineComponent({
  setup() {
    const { data, mutate } = useSWRV(LIST_SWRV_KEY, async () => {
      return RESTManager.api.webhooks.get<{ data: WebhookModel[] }>()
    })

    const dialog = useDialog()
    const presetCreateModal = () => {
      dialog.create({
        title: 'Create Webhook',
        content: () => (
          <EditWebhookForm
            onSubmit={() => {
              mutate()
            }}
          />
        ),
        class: '!w-[800px] !max-w-[80vw]',
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
          {data.value?.data.map((item) => {
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

    onSubmit: {
      type: Function as PropType<() => void>,
      required: false,
    },
  },
  setup(props) {
    const { data: eventsRef } = useSWRV('webhook.events', async () => {
      return RESTManager.api.webhooks.events.get<{ data: string[] }>()
    })

    const isEdit = props.formData !== undefined
    const reactiveFormData = ref<WebhookModel>(
      props.formData ??
        ({
          events: [],
          enabled: true,
        } as any),
    )

    const { destroyAll } = useDialog()
    const checkedEventsSet = computed(() => {
      return new Set(reactiveFormData.value.events)
    })
    const handleSubmit = async () => {
      if (!isEdit) {
        await RESTManager.api.webhooks.post({
          data: {
            ...reactiveFormData.value,
          },
        })
        destroyAll()
        props.onSubmit?.()
      }
    }
    return () => (
      <div class={'mt-5'}>
        <NForm>
          <NFormItem required label="Payload URL">
            <NInput
              value={reactiveFormData.value.payloadUrl}
              onUpdateValue={(value) => {
                reactiveFormData.value.payloadUrl = value
              }}
            ></NInput>
          </NFormItem>

          <NFormItem required label="Secret">
            <NInput
              value={reactiveFormData.value.secret}
              type="password"
              showPasswordOn="click"
              onUpdateValue={(value) => {
                reactiveFormData.value.secret = value
              }}
            ></NInput>
          </NFormItem>

          <NFormItem required label="Events">
            <NLayoutContent
              nativeScrollbar={false}
              embedded
              class={'!h-[400px] !bg-transparent'}
            >
              <NGrid cols={2} xGap={12} yGap={12}>
                {eventsRef.value?.data.map((item) => {
                  return (
                    <NGi>
                      <NCheckbox
                        checked={checkedEventsSet.value.has(item)}
                        onUpdateChecked={(value) => {
                          if (value) {
                            reactiveFormData.value.events.push(item)
                          } else {
                            reactiveFormData.value.events =
                              reactiveFormData.value.events.filter(
                                (i) => i !== item,
                              )
                          }
                        }}
                      >
                        {item}
                      </NCheckbox>
                    </NGi>
                  )
                })}
              </NGrid>
            </NLayoutContent>
          </NFormItem>

          <NFormItem required label="Enabled">
            <NSwitch
              onUpdateValue={(value) => {
                reactiveFormData.value.enabled = value
              }}
              value={reactiveFormData.value.enabled}
            ></NSwitch>
          </NFormItem>
          <div class={'flex justify-end'}>
            <NButton onClick={handleSubmit} type="primary" round>
              提交
            </NButton>
          </div>
        </NForm>
      </div>
    )
  },
})
