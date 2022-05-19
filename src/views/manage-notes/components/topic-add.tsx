import { HeaderActionButton } from 'components/button/rounded-button'
import { PlusIcon } from 'components/icons'
import { TopicModel } from 'models/topic'
import { NForm, NModal } from 'naive-ui'

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
    return () => (
      <>
        <HeaderActionButton
          icon={<PlusIcon />}
          onClick={handleAddTopic}
          variant="success"
        ></HeaderActionButton>

        <NModal
          title={'新建话题'}
          show={show.value}
          closable
          onClose={handleClose}
        >
          <NForm></NForm>
        </NModal>
      </>
    )
  },
})
