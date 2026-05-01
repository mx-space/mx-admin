import { NUpload } from 'naive-ui'
import { defineComponent } from 'vue'
import { toast } from 'vue-sonner'
import type { UploadOnFinish } from 'naive-ui'
import type { OnError } from 'naive-ui/es/upload/src/interface'
import type { PropType } from 'vue'

import { API_URL } from '~/constants/env'

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
          withCredentials
          showFileList={false}
          accept="image/*"
          action={`${API_URL}/files/upload?type=${type}`}
          onError={
            onError ||
            ((e) => {
              toast.error('上传失败')
              return e.file
            })
          }
          onFinish={onFinish}
          {...Object.fromEntries(
            Object.entries(rest).filter(([_k, v]) => typeof v !== 'undefined'),
          )}
        >
          {slots.default?.()}
        </NUpload>
      )
    }
  },
})

UploadWrapper.props = [...Array.from(Object.keys(NUpload.props)), 'type']
