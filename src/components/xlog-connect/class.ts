import type { NoteModel } from 'models/note'
import type { PostModel } from 'models/post'
import type { CrossBellInstance } from 'use-crossbell-xlog'
import { useAccountState, useConnectModal } from 'use-crossbell-xlog'

export const instanceRef = ref<CrossBellInstance>()
const SITE_ID = 'innei-4525'

export class CrossBellConnector {
  static getInstance(): CrossBellInstance | undefined {
    if (!('ethereum' in window)) return
    return instanceRef.value
  }

  static createPost(data: NoteModel | PostModel) {
    return new Promise((resolve) => {
      const instance = CrossBellConnector.getInstance()
      if (!instance) {
        resolve(null)
        return
      }
      const { state } = instance
      const { account } = state

      const post = () => {
        const { text, title } = data
        const slug = 'slug' in data ? data.slug : `note-${data.nid}`
        return instance.createOrUpdatePage({
          siteId: SITE_ID,
          content: text,
          title,
          isPost: true,
          slug,
          published: true,
          applications: ['xlog'],
          externalUrl: `https://${SITE_ID}.xlog.app/posts/${slug}`,
        })
      }
      const postHandler = () =>
        post()
          .then(() => {
            message.success('xLog 发布成功')
            resolve(null)
          })
          .catch(() => {
            message.error('xLog 发布失败')
            resolve(null)
          })
          .finally(() => {
            dispose1()
            dispose2()
          })
      let isShow = false
      const dispose1 = useAccountState.subscribe((state) => {
        if (state.wallet?.address && isShow) {
          postHandler()
        }
      })

      const dispose2 = useConnectModal.subscribe((state) => {
        if (state.isActive) isShow = true
        if (
          !state.isActive &&
          isShow &&
          !useAccountState.getState().wallet?.address
        ) {
          dispose1()
          dispose2()

          resolve(null)
        }
      })

      if (!account || !account.address) {
        instance.show()
      } else {
        postHandler()
      }
    })
  }
}
