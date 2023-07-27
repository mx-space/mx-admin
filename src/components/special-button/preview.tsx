import { debounce } from 'lodash-es'

import { EmitKeyMap } from '~/constants/keys'
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

    let isInPreview = false
    let previewWindowOrigin = ''
    let previewWindow = null as null | Window

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

      let url: URL
      if (import.meta.env.DEV) {
        url = new URL('/preview', 'http://localhost:2323')
      } else {
        url = new URL('/preview', webUrl)
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
      url.searchParams.set('origin', location.origin)

      const finalUrl = url.toString()

      const forkWindow = window.open(finalUrl)
      if (!forkWindow) {
        message.error('打开预览失败')
        return
      }

      previewKey = storageKey
      isInPreview = true
      previewWindowOrigin = url.origin
      previewWindow = forkWindow
    }

    onMounted(() => {
      const handler = (e: MessageEvent<any>): void => {
        if (!isInPreview) return
        if (e.origin !== previewWindowOrigin) return
        // console.log('ready', e.origin)
        if (!previewWindow) return
        const data = props.getData()
        previewWindow.postMessage(
          JSON.stringify({
            type: 'preview',
            data: {
              ...data,
              id: `preview-${data.id ?? 'new'}`,
            },
          }),
          previewWindowOrigin,
        )
      }
      window.addEventListener('message', handler)

      onBeforeUnmount(() => {
        window.removeEventListener('message', handler)
      })
    })

    onMounted(() => {
      const handler = debounce(() => {
        if (!isInPreview) return
        if (!previewWindowOrigin) return
        if (!previewWindow) return

        const data = props.getData()

        previewWindow.postMessage(
          JSON.stringify({
            type: 'preview',
            data: {
              ...data,
              id: `preview-${data.id ?? 'new'}`,
            },
          }),
          previewWindowOrigin,
        )
      }, 100)
      window.addEventListener(EmitKeyMap.EditDataUpdate, handler)

      onBeforeUnmount(() => {
        window.removeEventListener(EmitKeyMap.EditDataUpdate, handler)
      })
    })

    return () => (
      <HeaderActionButton
        icon={<MagnifyingGlass />}
        onClick={handlePreview}
      ></HeaderActionButton>
    )
  },
})
