import { App } from 'use-crossbell-xlog'
import { RESTManager } from 'utils'
import { createReactWrapper } from 'vue-react-wrapper'

import { CrossBellConnector, instanceRef } from './class'

export const CrossBellConnectorIndirector = defineComponent({
  setup() {
    const siteId = ref('')

    RESTManager.api.options.thirdPartyServiceIntegration
      .get<{
        data: { xLogSiteId: string }
      }>()
      .then(({ data }) => {
        const { xLogSiteId } = data
        siteId.value = xLogSiteId

        CrossBellConnector.setSiteId(xLogSiteId)
      })

    const VueApp = createReactWrapper(App)

    const reactRef = () => instanceRef

    onUnmounted(() => {
      instanceRef.value = undefined
    })

    return () => (siteId.value ? <VueApp reactRef={reactRef} /> : null)
  },
})
