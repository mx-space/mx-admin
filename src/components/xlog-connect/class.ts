import type { NoteModel } from 'models/note'
import type { PostModel } from 'models/post'
import type { CrossBellInstance } from 'use-crossbell-xlog'
import { useAccountState, useConnectModal } from 'use-crossbell-xlog'
import { RESTManager } from 'utils'

export const instanceRef = ref<CrossBellInstance>()

export class CrossBellConnector {
  static SITE_ID = ''
  static setSiteId(siteId: string) {
    console.log('setSiteId', siteId)

    this.SITE_ID = siteId
  }
  static getInstance(): CrossBellInstance | undefined {
    if (!('ethereum' in window)) return
    return instanceRef.value
  }

  static createOrUpdate(data: NoteModel | PostModel) {
    return new Promise((resolve) => {
      if (!this.SITE_ID) {
        resolve(null)
        return
      }
      const SITE_ID = this.SITE_ID
      const instance = this.getInstance()
      if (!instance) {
        resolve(null)
        return
      }
      const { state } = instance
      const { account } = state

      message.loading('准备发布到 xLog，等待钱包相应...')
      let postCallOnce = false

      const post = () => {
        if (postCallOnce) return Promise.resolve()
        const { text, title } = data
        const slug = 'slug' in data ? data.slug : `note-${data.nid}`
        postCallOnce = true
        message.loading('正在发布到 xLog...')
        return instance.createOrUpdatePage({
          siteId: SITE_ID,
          content: text,
          title,
          isPost: true,
          slug,
          published: true,
          applications: ['xlog'],
          externalUrl: `https://${SITE_ID}.xlog.app/posts/${slug}`,
          pageId: data.meta?.xLog?.pageId,
          tags: 'tags' in data ? data.tags.toString() : undefined,
          publishedAt: data.created,
        })
      }
      const postHandler = () =>
        post()
          .then(() => {
            message.success('xLog 发布成功')
            this.updateModel(data)
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

  private static isNoteModel(data: NoteModel | PostModel): data is NoteModel {
    return 'nid' in data
  }
  private static async updateModel(data: NoteModel | PostModel) {
    if (!this.SITE_ID) return
    const { characterId, noteId } =
      await RESTManager.api.fn.xlog.get_page_id.get<{
        noteId: string
        characterId: string
      }>({
        params: {
          handle: this.SITE_ID,
          slug: this.isNoteModel(data) ? `note-${data.nid}` : data.slug,
        },
      })

    const pageId = `${characterId}-${noteId}`

    const patchedData = {
      meta: {
        ...(data.meta || {}),
        xLog: {
          pageId,
        },
      },
    }
    if (this.isNoteModel(data)) {
      await RESTManager.api.notes(data.id).patch({
        data: patchedData,
      })
    } else {
      await RESTManager.api.posts(data.id).patch({
        data: patchedData,
      })
    }
  }
}
