import { HeaderActionButton } from 'components/button/rounded-button'
import { PlusIcon } from 'components/icons'
import { TopicModel } from 'models/topic'
import {
  FormInst,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NModal,
} from 'naive-ui'

export const TopicAddIcon = defineComponent({
  setup() {
    const show = ref(false)
    const topic = reactive<Partial<TopicModel>>({})
    const handleAddTopic = () => {
      show.value = true
    }
    const handleClose = () => {
      show.value = false
    }

    const handleSubmit = () => {
      formRef?.value?.validate((err) => {
        if (err?.length) {
          return
        }
      })
    }
    const formRef = ref<FormInst>()
    return () => (
      <>
        <HeaderActionButton
          icon={<PlusIcon />}
          onClick={handleAddTopic}
          variant="success"
        ></HeaderActionButton>

        <NModal show={show.value}>
          <NCard
            title={'新建话题'}
            closable
            onClose={handleClose}
            class="modal-card sm"
          >
            <NForm labelPlacement="top" ref={formRef} model={topic}>
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
