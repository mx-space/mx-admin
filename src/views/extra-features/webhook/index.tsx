import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { cloneDeep } from 'es-toolkit/compat'
import { Plus as PlusIcon } from 'lucide-vue-next'
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
  NPopconfirm,
  NSpace,
  NSwitch,
  NTag,
  NThing,
  useDialog,
} from 'naive-ui'
import type { PaginateResult } from '@mx-space/api-client'
import type { WebhookEventModel, WebhookModel } from '~/models/wehbook'
import type { PropType } from 'vue'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { JSONHighlight } from '~/components/json-highlight'
import { queryKeys } from '~/hooks/queries/keys'
import { useLayout } from '~/layouts/content'
import { EventScope } from '~/models/wehbook'
import { webhooksApi } from '~/api/webhooks'

export default defineComponent({
  setup() {
    const queryClient = useQueryClient()
    const { data, refetch } = useQuery({
      queryKey: queryKeys.webhooks.list(),
      queryFn: () => webhooksApi.getList(),
    })

    const dialog = useDialog()
    const presetEditableModal = (formData?: WebhookModel) => {
      dialog.create({
        title: 'Create Webhook',
        content: () => (
          <EditWebhookForm
            formData={formData}
            onSubmit={() => {
              refetch()
            }}
          />
        ),
        class: '!w-[800px] !max-w-[80vw]',
      })
    }

    const handleShowDetail = (hookId: string) => {
      dialog.create({
        title: 'Webhook Dispatches',
        content: () => <WebHookDispatches hookId={hookId} />,
        class: '!w-[600px] !max-w-[80vw]',
      })
    }

    const { setActions } = useLayout()
    setActions(
      <HeaderActionButton
        name="Add Webhook"
        icon={<PlusIcon />}
        onClick={() => presetEditableModal()}
      />,
    )

    return () => (
      <NList hoverable clickable>
        {data.value?.data.map((item) => {
          return (
            <div
              role="button"
              tabindex={0}
              onClick={() => {
                handleShowDetail(item.id)
              }}
            >
              <NListItem key={item.id}>
                {{
                  default() {
                    return (
                      <NThing title={item.payloadUrl}>
                        {{
                          description() {
                            return (
                              <div class={'space-x-2'}>
                                {item.events.map((event) => {
                                  return (
                                    <NTag size="small" type="primary" round>
                                      {event}
                                    </NTag>
                                  )
                                })}
                              </div>
                            )
                          },
                          avatar() {
                            return (
                              <div
                                class={[
                                  'h-2 w-2 rounded-full',
                                  item.enabled
                                    ? 'bg-green-500'
                                    : 'bg-neutral-500',
                                ]}
                              />
                            )
                          },
                        }}
                      </NThing>
                    )
                  },
                  suffix() {
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <NButtonGroup>
                          <NButton
                            round
                            onClick={() => {
                              presetEditableModal(item)
                            }}
                          >
                            编辑
                          </NButton>
                          <NPopconfirm
                            positiveText={'取消'}
                            negativeText="删除"
                            onNegativeClick={async () => {
                              await webhooksApi.delete(item.id)
                              refetch()
                            }}
                          >
                            {{
                              trigger: () => (
                                <NButton round type="error" ghost>
                                  移除
                                </NButton>
                              ),

                              default: () => (
                                <span class="max-w-48">确定要删除 ?</span>
                              ),
                            }}
                          </NPopconfirm>
                        </NButtonGroup>
                      </div>
                    )
                  },
                }}
              </NListItem>
            </div>
          )
        })}
      </NList>
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
    const { data: eventsRef } = useQuery({
      queryKey: queryKeys.webhooks.events(),
      queryFn: () => webhooksApi.getEvents(),
    })

    const isEdit = props.formData !== undefined
    const reactiveFormData = ref<WebhookModel>(
      cloneDeep(props.formData) ??
        ({
          events: [],
          enabled: true,
          scope: EventScope.TO_SYSTEM,
        } as any),
    )

    const { destroyAll } = useDialog()
    const checkedEventsSet = computed(() => {
      return new Set(reactiveFormData.value.events)
    })
    const handleSubmit = async () => {
      if (!isEdit) {
        await webhooksApi.create({
          ...reactiveFormData.value,
        })
      } else {
        const data = { ...reactiveFormData.value }
        if (!data.secret) {
          Reflect.deleteProperty(data, 'secret')
        }
        await webhooksApi.update(props.formData.id, data)
      }
      destroyAll()
      props.onSubmit?.()
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
            />
          </NFormItem>

          <NFormItem required label="Secret">
            <NInput
              value={reactiveFormData.value.secret}
              type="password"
              showPasswordOn="click"
              onUpdateValue={(value) => {
                reactiveFormData.value.secret = value
              }}
            />
          </NFormItem>

          <NFormItem required label="Events">
            <NLayoutContent
              nativeScrollbar={false}
              embedded
              class={'!h-[400px] !bg-transparent'}
            >
              <NGrid cols={2} xGap={12} yGap={12}>
                <NGi>
                  <NCheckbox
                    checked={checkedEventsSet.value.has('all')}
                    onUpdateChecked={(value) => {
                      if (value) {
                        reactiveFormData.value.events = ['all']
                      } else {
                        reactiveFormData.value.events = []
                      }
                    }}
                  >
                    ALL
                  </NCheckbox>
                </NGi>
                {eventsRef.value?.data.map((item) => {
                  return (
                    <NGi>
                      <NCheckbox
                        checked={
                          checkedEventsSet.value.has(item) ||
                          checkedEventsSet.value.has('all')
                        }
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

          <NFormItem required label="Scope">
            <NSpace wrap>
              {(Object.keys(EventScope) as Array<keyof typeof EventScope>).map(
                (key) => {
                  const scope = EventScope[key]
                  const value = reactiveFormData.value.scope
                  return (
                    <NCheckbox
                      checked={
                        (value & scope) === scope || value === EventScope.ALL
                      }
                      onUpdateChecked={(value) => {
                        if (value) {
                          reactiveFormData.value.scope |= EventScope[key]
                        } else {
                          reactiveFormData.value.scope &= ~EventScope[key]
                        }
                      }}
                    >
                      {key}
                    </NCheckbox>
                  )
                },
              )}
            </NSpace>
          </NFormItem>

          <NFormItem required label="Enabled">
            <NSwitch
              onUpdateValue={(value) => {
                reactiveFormData.value.enabled = value
              }}
              value={reactiveFormData.value.enabled}
            />
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

const WebHookDispatches = defineComponent({
  props: {
    hookId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const { data } = useQuery({
      queryKey: queryKeys.webhooks.dispatches(props.hookId),
      queryFn: async (): Promise<WebhookEventModel[]> => {
        // TODO: Implement getWebhookEvents in webhooksApi
        return []
      },
    })

    const dialog = useDialog()

    const handleDetailModal = (item: WebhookEventModel) => {
      dialog.create({
        title: 'Webhook Dispatch Detail',
        class: '!w-[800px] !max-w-[80vw]',
        content: () => (
          <div class={'max-h-[80vh] overflow-auto'}>
            <div class={'flex flex-col gap-4'}>
              <NButton
                class={'absolute right-4 top-4'}
                type="primary"
                onClick={() => {
                  // TODO: Implement redispatch in webhooksApi
                  message.info('Re-dispatch not yet implemented')
                }}
              >
                Re-Dispatch
              </NButton>
              <p>
                Status: {item.status} {item.success ? '✅' : '❌'}
              </p>
              <p>Header:</p>
              <JSONHighlight
                code={reintentJsonStringify(item.headers)}
                class={'p-4'}
              />
              <p>Payload:</p>
              <JSONHighlight
                code={reintentJsonStringify(item.payload)}
                class={'p-4'}
              />
              <p>Response:</p>
              <JSONHighlight
                code={reintentJsonStringify(item.response)}
                class={'p-4'}
              />
            </div>
          </div>
        ),
      })
    }

    return () => (
      <div>
        <NList>
          {data.value?.map((item) => {
            return (
              <NListItem key={item.id}>
                <div class={'flex items-center space-x-4'}>
                  <div
                    class={[
                      'h-2 w-2 rounded-full',
                      item.success ? 'bg-green-500' : 'bg-red-500',
                    ]}
                  />
                  <div class={'w-[30px]'}>{item.status}</div>
                  <span
                    style={{
                      flex: 2,
                    }}
                  >
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                  <span
                    style={{
                      flex: 2,
                    }}
                  >
                    {item.event}
                  </span>
                  <NButton
                    onClick={() => handleDetailModal(item)}
                    quaternary
                    type="primary"
                    class={'justify-self-end'}
                    style={{
                      flex: 1,
                    }}
                  >
                    Detail
                  </NButton>
                </div>
              </NListItem>
            )
          })}
        </NList>
      </div>
    )
  },
})

const reintentJsonStringify = (obj: string) => {
  return JSON.stringify(JSON.parse(obj), null, 2)
}
