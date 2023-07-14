import { RESTManager } from 'utils'

export const CrossBellConnectorIndirector = defineComponent({
  setup() {
    const siteId = ref('')

    RESTManager.api.options.thirdPartyServiceIntegration
      .get<{
        data: { xLogSiteId: string }
      }>()
      .then(async ({ data }) => {
        const { xLogSiteId } = data
        siteId.value = xLogSiteId

        const CrossBellConnector = await import('./class').then(
          (mo) => mo.CrossBellConnector,
        )

        CrossBellConnector.setSiteId(xLogSiteId)
      })

    return () => null
  },
})
