import { RecentlyModel } from 'models/recently'
import { NButton, NInput, NSpace, useDialog } from 'naive-ui'
import { RESTManager } from 'utils'
import { ref } from 'vue'

export const useShorthand = () => {
  const modal = useDialog()
  const quickHandText = ref('')

  return {
    create() {
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
                        message.success('记录成功')
                        dialog.destroy()
                        resolve(res)
                      })
                      .catch((err) => {
                        reject(err)
                      })
                  }}
                >
                  记好了
                </NButton>
                <NButton
                  round
                  onClick={() => {
                    void dialog.destroy()
                    resolve(null)
                  }}
                >
                  不想记了
                </NButton>
              </NSpace>
            )
          },
        })
      })
    },
  }
}
