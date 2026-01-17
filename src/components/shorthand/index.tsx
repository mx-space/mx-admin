import { NButton, NInput, NSpace, useDialog } from 'naive-ui'
import { ref } from 'vue'
import type { RecentlyModel } from '~/models/recently'

import { RESTManager } from '~/utils'

export const useShorthand = () => {
  const modal = useDialog()
  const quickHandText = ref('')

  return {
    create() {
      quickHandText.value = ''
      return new Promise<RecentlyModel | null>((resolve, reject) => {
        const dialog = modal.create({
          title: '速记',
          type: 'success',

          content() {
            return (
              <NInput
                resizable={false}
                type="textarea"
                onUpdateValue={(e) => {
                  quickHandText.value = e
                }}
                value={quickHandText.value}
                class="h-[300px] max-h-[80vh]"
              />
            )
          },
          action() {
            return (
              <NSpace>
                <NButton
                  round
                  type="primary"
                  onClick={() => {
                    RESTManager.api.recently
                      .post<RecentlyModel>({
                        data: {
                          content: quickHandText.value,
                        },
                      })
                      .then((res) => {
                        quickHandText.value = ''
                        message.success('保存成功')
                        dialog.destroy()
                        resolve(res)
                      })
                      .catch((error) => {
                        reject(error)
                      })
                  }}
                >
                  保存
                </NButton>
                <NButton
                  round
                  onClick={() => {
                    quickHandText.value = ''
                    void dialog.destroy()
                    resolve(null)
                  }}
                >
                  取消
                </NButton>
              </NSpace>
            )
          },
        })
      })
    },

    edit(item: RecentlyModel) {
      quickHandText.value = item.content
      return new Promise<RecentlyModel | null>((resolve, reject) => {
        const dialog = modal.create({
          title: '编辑速记',
          type: 'info',

          content() {
            return (
              <NInput
                resizable={false}
                type="textarea"
                onUpdateValue={(e) => {
                  quickHandText.value = e
                }}
                value={quickHandText.value}
                class="h-[300px] max-h-[80vh]"
              />
            )
          },
          action() {
            return (
              <NSpace>
                <NButton
                  round
                  type="primary"
                  onClick={() => {
                    RESTManager.api
                      .recently(item.id)
                      .put<RecentlyModel>({
                        data: {
                          content: quickHandText.value,
                        },
                      })
                      .then((res) => {
                        quickHandText.value = ''
                        message.success('修改成功')
                        dialog.destroy()
                        resolve(res)
                      })
                      .catch((error) => {
                        reject(error)
                      })
                  }}
                >
                  保存
                </NButton>
                <NButton
                  round
                  onClick={() => {
                    quickHandText.value = ''
                    void dialog.destroy()
                    resolve(null)
                  }}
                >
                  取消
                </NButton>
              </NSpace>
            )
          },
        })
      })
    },
  }
}
