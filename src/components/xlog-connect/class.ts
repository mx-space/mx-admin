import { createContract } from 'crossbell.js'
import type { NoteModel } from 'models/note'
import type { PostModel } from 'models/post'
import Unidata from 'unidata.js'
import { RESTManager } from 'utils'

import { showConfetti } from '~/utils/confetti'

const unidata = new Unidata()

const IPFS_GATEWAY = 'https://ipfs.4everland.xyz/ipfs/'

const toCid = (url: string) => {
  return url
    ?.replaceAll(IPFS_GATEWAY, '')
    .replaceAll('https://gateway.ipfs.io/ipfs/', '')
    .replaceAll('https://ipfs.io/ipfs/', '')
    .replaceAll('https://cf-ipfs.com/ipfs/', '')
    .replaceAll('https://ipfs.4everland.xyz/ipfs/', '')
    .replaceAll('https://rss3.mypinata.cloud/ipfs/', '')
}

export class CrossBellConnector {
  static SITE_ID = ''
  static setSiteId(siteId: string) {
    this.SITE_ID = siteId
  }

  static createOrUpdate(data: NoteModel | PostModel) {
    // 跳过隐藏的笔记
    const passedFields = ['hide', 'password', 'secret']
    for (const field of passedFields) {
      if (field in data && data[field]) {
        message.info(`跳过隐藏笔记，命中字段：${field}`)
        return Promise.resolve()
      }
    }

    return new Promise((resolve) => {
      if (!('ethereum' in window)) {
        resolve(null)
        return
      }
      if (!this.SITE_ID) {
        resolve(null)
        return
      }

      dialog.create({
        title: `已连接到 xLog`,
        content: `已连接到 xLog (${this.SITE_ID})，此文章的更新需要同步吗？`,
        onNegativeClick() {
          resolve(null)
        },
        onPositiveClick() {
          connectToXLog()
        },
        negativeText: '不需要',
        positiveText: '嗯！',
      })

      const connectToXLog = async () => {
        const SITE_ID = this.SITE_ID

        const metamask = window.ethereum as any
        const contract = createContract(metamask)

        message.loading('准备发布到 xLog，等待钱包响应...')
        await contract.walletClient.requestAddresses()

        if (!contract.account.address) {
          console.error('no address')
          return
        }

        let postCallOnce = false
        let pageId = data.meta?.xLog?.pageId
        const slug = 'slug' in data ? data.slug : `note-${data.nid}`

        const post = async () => {
          if (postCallOnce) return Promise.resolve()
          const { text, title } = data
          postCallOnce = true

          // FIXME 如果 xLog 不存在这个 pageId，会报错 metamask rpc error
          // 如果是在 xLog 删除了这个文章，但是 mx 这边没有同步，会导致这个问题
          // 这里还是验证一下吧，只针对 note 的场景，post 还是根据记录的 pageId 来，因为 post 的 slug 不是固定的但是 note 的 nid 是固定的。
          // 如果 post 的 slug 改了，那么就在 xlog 拿不到 pageId 了，这个时候就会出问题（修改文章都是变成新增）

          if (!pageId || this.isNoteModel(data))
            pageId = await this.fetchPageId(slug)

          const articleUrl = await RESTManager.api
            .helper('url-builder')(data.id)
            .get<{
              data: string
            }>()
            .then(({ data }) => data)
            .catch(() => '')

          if (!articleUrl) {
            throw new Error('文章链接生成失败')
          }

          const contentWithFooter = `${text}

<span style="text-align: right;font-size: 0.8em; float: right">此文由 [Mix Space](https://github.com/mx-space) 同步更新至 xLog
原始链接为 <${articleUrl}></span>`

          message.loading('正在发布到 xLog...')

          const input = {
            siteId: SITE_ID,
            content: contentWithFooter,
            title,
            isPost: true,
            slug,
            published: true,
            applications: ['xlog'],
            externalUrl: `https://${SITE_ID}.xlog.app/posts/${slug}`,
            pageId,
            tags:
              'tags' in data
                ? data.tags.toString()
                : this.isNoteModel(data)
                ? 'Note'
                : '',
            publishedAt: data.created,
          }

          return unidata.notes.set(
            {
              source: 'Crossbell Note',
              identity: input.siteId,
              platform: 'Crossbell',
              action: input.pageId ? 'update' : 'add',
            },
            {
              ...(input.externalUrl && { related_urls: [input.externalUrl] }),
              ...(input.pageId && { id: input.pageId }),
              ...(input.title && { title: input.title }),
              ...(input.content && {
                body: {
                  content: input.content,
                  mime_type: 'text/markdown',
                },
              }),
              ...(input.publishedAt && {
                date_published: input.publishedAt,
              }),
              // ...(input.excerpt && {
              //   summary: {
              //     content: input.excerpt,
              //     mime_type: 'text/markdown',
              //   },
              // }),
              tags: [
                input.isPost ? 'post' : 'page',
                ...(input.tags
                  ?.split(',')
                  .map((tag) => tag.trim())
                  .filter((tag) => tag) || []),
              ],
              applications: [
                'xlog',
                ...(input.applications?.filter((app) => app !== 'xlog') || []),
              ],
              ...(input.slug && {
                attributes: [
                  {
                    trait_type: 'xlog_slug',
                    value: input.slug,
                  },
                ],
              }),
            },
          )
        }

        await post()
          .then(() => {
            message.success('xLog 发布成功')
            showConfetti()
            ;(pageId ? Promise.resolve(pageId) : this.fetchPageId(slug)).then(
              (pageId) => {
                if (!pageId) {
                  message.error('无法获取 xLog pageId 任务终止')
                  return
                }

                // update meta for pageId
                this.updateModel(data, {
                  pageId,
                })

                // update meta for ipfs
                unidata.notes
                  .get({
                    source: 'Crossbell Note',
                    identity: SITE_ID,
                    platform: 'Crossbell',
                    filter: {
                      id: pageId,
                    },
                  })
                  .then((note$) => {
                    if (!note$) return
                    const { list } = note$
                    const note = list[0]
                    if (!note) return
                    const { metadata, related_urls } = note
                    const minifyMetadata = {
                      ...metadata,
                    }

                    delete minifyMetadata.raw

                    console.debug(note)
                    this.updateModel(data, {
                      pageId,
                      related_urls,
                      metadata: minifyMetadata,
                      // @copy from xlog
                      // https://github.com/Innei/xLog/blob/33a3f2306467fd067e85dbd75a7a08ab584fd3f7/src/components/site/PostMeta.tsx#L25
                      cid: toCid(related_urls?.[0] || ''),
                    })
                  })
              },
            )
            resolve(null)
          })
          .catch((err) => {
            console.error(err)
            message.error('xLog 发布失败')
            resolve(null)
          })
      }
    })
  }

  private static isNoteModel(data: NoteModel | PostModel): data is NoteModel {
    return 'nid' in data
  }

  private static async fetchPageId(slug: string) {
    if (!this.SITE_ID) return
    const { characterId, noteId } = await RESTManager.api.fn.xlog.get_page_id
      .get<{
        noteId: string
        characterId: string
      }>({
        params: {
          handle: this.SITE_ID,
          slug,
        },
      })
      .catch(() => {
        return {
          noteId: '',
          characterId: '',
        }
      })

    if (!characterId || !noteId) return
    return `${characterId}-${noteId}`
  }
  private static async updateModel(
    data: NoteModel | PostModel,

    meta: {
      pageId?: string
      cid?: string
      related_urls?: string[]
      metadata?: any
    },
  ) {
    const id = data.id
    const { cid, pageId, related_urls, metadata } = meta

    // delete undefined value in meta object

    for (const key in meta) {
      if (meta[key] === undefined) {
        delete meta[key]
      }
    }

    const patchedData = {
      meta: {
        ...data.meta,
        xLog: {
          ...data.meta?.xLog,
          pageId,
          cid,
          related_urls,
          metadata,
        },
      },
    }
    if (this.isNoteModel(data)) {
      await RESTManager.api.notes(id).patch({
        data: patchedData,
      })
    } else {
      await RESTManager.api.posts(id).patch({
        data: patchedData,
      })
    }
  }
}
