import { RESTManager } from '~/utils'

import { HeaderActionButton } from '../button/rounded-button'
import { MagnifyingGlass } from '../icons'

export const HeaderPreviewButton = defineComponent({
  props: {
    getData: {
      type: Function as PropType<() => any>,
      required: true,
    },
  },
  setup(props) {
    let previewKey = ''

    onBeforeUnmount(() => {
      if (previewKey) {
        localStorage.removeItem(previewKey)
      }
    })
    let webUrl = ''

    const handlePreview = async () => {
      const { getData } = props
      const data = getData()
      const { id } = data
      if (!webUrl) {
        const res = await RESTManager.api.options.url
          .get<any>()
          .then((data) => data.data)
        webUrl = res.webUrl
      }
      const url = new URL('/preview', webUrl)

      if (url.hostname !== location.hostname) {
        message.error('预览地址与当前地址不一致，无法提供预览')
      }

      const storageKey = `mx-preview-${id ?? 'new'}`

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...data,
          id: `preview-${id ?? 'new'}`,
        }),
      )

      url.searchParams.set('storageKey', storageKey)
      window.open(url.toString())

      previewKey = storageKey
    }

    return () => (
      <HeaderActionButton
        icon={<MagnifyingGlass />}
        onClick={handlePreview}
      ></HeaderActionButton>
    )
  },
})
