import { ShellOutputNormal } from 'components/output-modal/normal'
import { usePortalElement } from 'hooks/use-portal-element'
import { RESTManager } from 'utils'

export const UpdatePanel = defineComponent({
  setup(_) {
    const $shellRef = ref<any>()
    const handleUpdate = () => {
      $shellRef.value.run(`${RESTManager.endpoint}/update/upgrade/dashboard`)
    }

    const portal = usePortalElement()

    onMounted(() => {
      nextTick(() => {
        handleUpdate()
      })
    })

    return () => (
      <ShellOutputNormal
        ref={$shellRef}
        onClose={() => {
          setTimeout(() => {
            portal(null)
          }, 1000)
        }}
      />
    )
  },
})
