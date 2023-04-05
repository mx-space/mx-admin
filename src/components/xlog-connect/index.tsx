import { App } from 'use-crossbell-xlog'
import { createReactWrapper } from 'vue-react-wrapper'

import { instanceRef } from './class'

const VueApp = createReactWrapper(App)

export const CrossBellConnectorIndirector = defineComponent({
  setup() {
    const reactRef = () => instanceRef

    onUnmounted(() => {
      instanceRef.value = undefined
    })

    return () => <VueApp reactRef={reactRef} />
  },
})
