import { JSONHighlight } from 'components/json-highlight'
import { isObject, isUndefined } from 'lodash-es'
import {
  NButton,
  NCollapse,
  NCollapseItem,
  NDivider,
  NDrawer,
  NDrawerContent,
  NDynamicInput,
  NForm,
  NFormItem,
  NModal,
  NSwitch,
} from 'naive-ui'
import { JSONParseReturnOriginal } from 'utils/json'
import type { PropType } from 'vue'

import { ImageDetailSection } from './components/image-detail-section'
import { JSONEditor } from './components/json-editor'

export const TextBaseDrawer = defineComponent({
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    onUpdateShow: {
      type: Function as PropType<(s: boolean) => void>,
      required: true,
    },
    data: {
      type: Object as PropType<any>,
      required: true,
    },

    labelWidth: {
      type: Number,
      required: false,
    },
  },
  setup(props, { slots }) {
    const showJSONEditorModal = ref(false)
    const handleEdit = () => {
      showJSONEditorModal.value = true
    }

    const keyValuePairs = ref([] as { key: string; value: string }[])

    let inUpdatedKeyValue = false

    watch(
      () => keyValuePairs.value,
      () => {
        inUpdatedKeyValue = true
        props.data.meta = keyValuePairs.value.reduce((acc, { key, value }) => {
          return isUndefined(value) || value === ''
            ? acc
            : { ...acc, [key]: JSONParseReturnOriginal(value) }
        }, {})
      },
    )

    watch(
      () => props.data.meta,
      () => {
        if (inUpdatedKeyValue) {
          inUpdatedKeyValue = false
          return
        }

        if (props.data.meta && isObject(props.data.meta)) {
          keyValuePairs.value = Object.entries(props.data.meta).reduce(
            (acc, [key, value]): any => {
              return [
                ...acc,
                {
                  key,
                  value: JSON.stringify(value),
                },
              ]
            },
            [],
          )
        }
      },
      {
        flush: 'post',
        deep: true,
      },
    )
    return () => (
      <NDrawer
        show={props.show}
        width={450}
        class="max-w-[90vw]"
        placement="right"
        onUpdateShow={props.onUpdateShow}
      >
        <NDrawerContent title="????????????">
          <NForm
            labelAlign="right"
            labelPlacement="left"
            labelWidth={props.labelWidth ?? 120}
          >
            {slots.default?.()}
            <NFormItem label="????????????">
              <NSwitch
                value={props.data.allowComment}
                onUpdateValue={(e) => void (props.data.allowComment = e)}
              />
            </NFormItem>

            <NDivider />

            <NFormItem label="????????????" labelAlign="left"></NFormItem>
            <NFormItem>
              <ImageDetailSection
                text={props.data.text}
                images={props.data.images}
                onChange={(images) => {
                  props.data.images = images
                }}
              />
            </NFormItem>
            <NDivider />
            <NFormItem label="????????????" labelAlign="left">
              <div class="flex-grow text-right">
                <NButton onClick={handleEdit} round>
                  ??????
                </NButton>
              </div>
            </NFormItem>
            <NDynamicInput
              preset="pair"
              value={keyValuePairs.value}
              keyPlaceholder="???????????????"
              valuePlaceholder="???????????????"
              onUpdateValue={(value: any[]) => {
                keyValuePairs.value = value
              }}
            ></NDynamicInput>

            {props.data.meta && (
              <NCollapse accordion class="mt-4">
                <NCollapseItem title="??????">
                  <JSONHighlight
                    class="max-w-full overflow-auto"
                    code={JSON.stringify(props.data.meta, null, 2)}
                  />
                </NCollapseItem>
              </NCollapse>
            )}
          </NForm>
        </NDrawerContent>

        <NModal
          show={showJSONEditorModal.value}
          onUpdateShow={(e) => {
            showJSONEditorModal.value = e
          }}
          zIndex={2222}
          preset="card"
          closable
          closeOnEsc={false}
          title="??????????????????"
          onClose={() => {
            showJSONEditorModal.value = false
          }}
          class="w-[unset]"
        >
          <JSONEditor
            value={
              props.data.meta ? JSON.stringify(props.data.meta, null, 2) : ''
            }
            onFinish={(jsonString) => {
              try {
                inUpdatedKeyValue = false
                const parsed = JSON.parse(jsonString)

                // console.log(parsed)

                props.data.meta = parsed

                showJSONEditorModal.value = false
              } catch (er: any) {
                message.error(er.message)
              }
            }}
          />
        </NModal>
      </NDrawer>
    )
  },
})
