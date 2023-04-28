import { RESTManager } from 'utils'

import { CrossBellConnector } from './class'

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

    return () => null
  },
})
