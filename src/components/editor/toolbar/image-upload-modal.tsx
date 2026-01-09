import { NButton, NInput, NModal, NSpace, useMessage } from 'naive-ui'
import { defineComponent, ref, watch } from 'vue'
import type { PropType } from 'vue'

import { RESTManager } from '~/utils'

export interface ImageUploadResult {
  alt: string
  url: string
}

export const ImageUploadModal = defineComponent({
  name: 'ImageUploadModal',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onConfirm: {
      type: Function as PropType<(result: ImageUploadResult) => void>,
      required: true,
    },
  },
  setup(props) {
    const message = useMessage()
    const alt = ref('')
    const url = ref('')
    const uploading = ref(false)
    const uploadedFileName = ref('')
    const uploadedFileStorage = ref<'local' | 's3'>('local')
    const isUrlLocked = ref(false)

    const resetState = () => {
      alt.value = ''
      url.value = ''
      uploading.value = false
      uploadedFileName.value = ''
      uploadedFileStorage.value = 'local'
      isUrlLocked.value = false
    }

    watch(
      () => props.show,
      (newShow, oldShow) => {
        if (!newShow && oldShow) {
          if (uploadedFileName.value && url.value) {
            deleteUploadedFile(
              uploadedFileName.value,
              uploadedFileStorage.value,
            )
          }
          resetState()
        }
      },
    )

    const deleteUploadedFile = async (
      filename: string,
      storage: 'local' | 's3',
    ) => {
      try {
        const type = 'photo'
        await RESTManager.api.objects(type, filename).delete({
          params: {
            storage,
            url: storage === 's3' ? url.value : undefined,
          },
        })
      } catch (error) {
        console.error('Failed to delete uploaded file:', error)
      }
    }

    const handleUpload = async () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) {
          return
        }

        if (!file.type.startsWith('image/')) {
          message.error('请选择图片文件')
          return
        }

        let maxSizeMB = 10
        try {
          const config = await RESTManager.api
            .options('imageBedOptions')
            .get<any>()
          if (config?.data?.maxSizeMB) {
            maxSizeMB = config.data.maxSizeMB
          }
        } catch (_error) {
          console.warn('Failed to fetch image bed config, using default 10MB')
        }

        const maxSize = maxSizeMB * 1024 * 1024
        if (file.size > maxSize) {
          const sizeMB = (file.size / 1024 / 1024).toFixed(2)
          message.error(`图片大小 ${sizeMB}MB 超过限制 ${maxSizeMB}MB`)
          return
        }

        uploading.value = true

        try {
          const formData = new FormData()
          formData.append('file', file)

          const response = await RESTManager.api.objects.upload.post<{
            url: string
            name: string
            storage: 'local' | 's3'
          }>({
            params: {
              type: 'photo',
            },
            data: formData,
          })

          url.value = response.url
          uploadedFileName.value = response.name
          uploadedFileStorage.value = response.storage
          isUrlLocked.value = true

          message.success(
            `上传成功！存储位置: ${response.storage === 's3' ? 'S3' : '本地'}`,
          )
        } catch (error: any) {
          message.error(`上传失败: ${error.message || '未知错误'}`)
        } finally {
          uploading.value = false
        }
      }

      input.click()
    }

    const handleConfirm = () => {
      if (!url.value.trim()) {
        message.error('请输入图片链接或上传图片')
        return
      }

      props.onConfirm({
        alt: alt.value.trim() || '图片',
        url: url.value.trim(),
      })

      uploadedFileName.value = ''
      resetState()
    }

    const handleCancel = () => {
      props.onClose()
    }

    return () => (
      <NModal
        show={props.show}
        onUpdateShow={(show) => {
          if (!show) {
            props.onClose()
          }
        }}
        preset="card"
        title="插入图片"
        style={{ width: '500px' }}
      >
        {{
          default: () => (
            <NSpace vertical size="large">
              <div>
                <div class="mb-2 text-sm font-medium">图片描述（Alt）</div>
                <NInput
                  value={alt.value}
                  onUpdateValue={(val) => (alt.value = val)}
                  placeholder="请输入图片描述"
                  clearable
                />
              </div>

              <div>
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-sm font-medium">图片链接</span>
                  <NButton
                    size="small"
                    type="primary"
                    loading={uploading.value}
                    onClick={handleUpload}
                    disabled={isUrlLocked.value}
                  >
                    {uploading.value ? '上传中...' : '上传图片'}
                  </NButton>
                </div>
                <NInput
                  value={url.value}
                  onUpdateValue={(val) => (url.value = val)}
                  placeholder="https://example.com/image.jpg"
                  clearable
                  disabled={isUrlLocked.value}
                />
              </div>
            </NSpace>
          ),
          footer: () => (
            <div class="flex justify-end gap-2">
              <NButton onClick={handleCancel}>取消</NButton>
              <NButton
                type="primary"
                onClick={handleConfirm}
                disabled={!url.value.trim()}
              >
                插入
              </NButton>
            </div>
          ),
        }}
      </NModal>
    )
  },
})
