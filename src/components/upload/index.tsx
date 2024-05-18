import { NUpload, UploadOnFinish } from 'naive-ui'
import { OnError } from 'naive-ui/es/upload/src/interface'
import type { PropType } from 'vue'

import { getToken, RESTManager } from '~/utils'

export const UploadWrapper = defineComponent({
  props: {
    onFinish: {
      type: Function as PropType<UploadOnFinish>,
    },
    onError: {
      type: Function as PropType<OnError>,
    },
    type: {
      type: String,
      required: true,
    },
  },
  setup(props, { slots }) {
    return () => {
      const { onFinish, onError, type, ...rest } = props

      return (
        <NUpload
          headers={{
            authorization: getToken() || '',
          }}
          showFileList={false}
          accept="image/*"
          action={`${RESTManager.endpoint}/files/upload?type=${type}`}
          onError={
            onError ||
            ((e) => {
              message.error('上传失败')
              return e.file
            })
          }
          onFinish={onFinish}
          {...Object.fromEntries(
            Object.entries(rest).filter(([k, v]) => typeof v !== 'undefined'),
          )}
        >
          {slots.default?.()}
        </NUpload>
      )
    }
  },
})

UploadWrapper.props = [...Array.from(Object.keys(NUpload.props)), 'type']
