import type { TopicModel } from 'models/topic'
import type { FormInst } from 'naive-ui'
import { NButton, NCard, NForm, NFormItem, NInput, NModal } from 'naive-ui'
import { RESTManager } from 'utils/rest'
import type { PropType } from 'vue'

export const TopicEditModal = defineComponent({
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    onClose: {
      type: Function,
      required: true,
    },
    id: {
      type: String,
      required: false,
    },
    onSubmit: {
      type: Function as PropType<(topic: TopicModel) => any>,
      required: false,
    },
  },
  setup(props) {
    const topic = reactive<Partial<TopicModel>>({})
    const loading = ref(false)

    watch(
      () => props.id,
      (id) => {
        if (!id) {
          Object.keys(topic).forEach((key) => {
            delete topic[key]
          })
        } else {
          loading.value = true
          RESTManager.api
            .topics(id)
            .get<TopicModel>()
            .then((data) => {
              Object.assign(topic, data)
              loading.value = false
            })
        }
      },
    )

    const handleClose = () => {
      props.onClose()
    }
    const handleSubmit = () => {
      formRef?.value?.validate(async (err) => {
        if (err?.length) {
          return
        }

        await handlePostData()
      })

      async function handlePostData() {
        let data: TopicModel
        if (props.id) {
          data = await RESTManager.api.topics(props.id).put({
            data: topic,
          })
          message.success('修改成功')
        } else {
          data = await RESTManager.api.topics.post({
            data: topic,
          })
          message.success('添加成功')
        }
        props.onSubmit?.(data)
      }
    }
    const formRef = ref<FormInst>()
    return () => (
      <>
        <NModal
          show={props.show}
          onUpdateShow={handleClose}
          closable
          onClose={handleClose}
          transformOrigin="center"
        >
          <NCard
            role="dialog"
            title={'新建话题'}
            closable
            onClose={handleClose}
            class="modal-card sm"
          >
            <NForm
              labelPlacement="top"
              ref={formRef}
              model={topic}
              disabled={loading.value}
            >
              <NFormItem
                label="名字"
                required
                rule={{
                  max: 50,
                  required: true,
                  trigger: ['blur', 'input'],
                }}
                path="name"
              >
                <NInput
                  value={topic.name}
                  onUpdateValue={(val) => {
                    topic.name = val
                  }}
                ></NInput>
              </NFormItem>

              <NFormItem
                label="id"
                required
                rule={{
                  required: true,
                  trigger: ['blur', 'input'],
                }}
                path="slug"
              >
                <NInput
                  value={topic.slug}
                  onUpdateValue={(val) => {
                    topic.slug = val
                  }}
                ></NInput>
              </NFormItem>

              <NFormItem
                label="简介"
                required
                rule={{
                  max: 100,
                  required: true,
                  trigger: ['blur', 'input'],
                }}
                path="introduce"
              >
                <NInput
                  value={topic.introduce}
                  onUpdateValue={(val) => {
                    topic.introduce = val
                  }}
                ></NInput>
              </NFormItem>

              <NFormItem label="图标">
                <NInput
                  value={topic.icon}
                  onUpdateValue={(val) => {
                    topic.icon = val
                  }}
                ></NInput>
              </NFormItem>

              <NFormItem
                label="长描述"
                rule={{
                  max: 500,
                  trigger: ['blur', 'input'],
                }}
                path="description"
              >
                <NInput
                  type="textarea"
                  autosize={{
                    maxRows: 5,
                    minRows: 2,
                  }}
                  value={topic.description}
                  onUpdateValue={(val) => {
                    topic.description = val
                  }}
                ></NInput>
              </NFormItem>

              <div class={'flex justify-end gap-2'}>
                <NButton round type="primary" onClick={handleSubmit}>
                  提交
                </NButton>
              </div>
            </NForm>
          </NCard>
        </NModal>
      </>
    )
  },
})
