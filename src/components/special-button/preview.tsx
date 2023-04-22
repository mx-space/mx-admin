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

    const handlePreview = () => {
      const { getData } = props
      const data = getData()
      const { id } = data
      const webUrl = 'http://localhost:2323'

      const storageKey = `mx-preview-${id ?? 'new'}`

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...data,
          id: `preview-${id ?? 'new'}`,
        }),
      )
      const url = new URL('/preview', webUrl)
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
