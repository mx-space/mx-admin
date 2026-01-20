import { defineComponent, nextTick, onMounted, ref } from 'vue'

import { ShellOutputNormal } from '~/components/output-modal/normal'
import { API_URL } from '~/constants/env'
import { usePortalElement } from '~/hooks/use-portal-element'

export const UpdatePanel = defineComponent({
  setup(_) {
    const $shellRef = ref<any>()
    const handleUpdate = () => {
      $shellRef.value.run(`${API_URL}/update/upgrade/dashboard`)
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
