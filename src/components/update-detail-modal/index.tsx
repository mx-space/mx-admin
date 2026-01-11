import { marked } from 'marked'
import { NButton, NModal, NSpin, NTag } from 'naive-ui'
import { defineComponent, ref, watchEffect } from 'vue'

import { getReleaseDetails } from '../../external/api/github-check-update'

import './markdown-styles.css'

interface ReleaseDetails {
  name: string
  body: string
  html_url: string
  published_at: string
  tag_name: string
}

export const UpdateDetailModal = defineComponent({
  props: {
    show: Boolean,
    version: String,
    repo: {
      type: String as () => 'mx-server' | 'mx-admin',
      required: true,
    },
    title: String,
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const loading = ref(false)
    const releaseDetails = ref<ReleaseDetails | null>(null)

    const fetchReleaseDetails = async () => {
      if (!props.version) return

      loading.value = true
      try {
        const details = await getReleaseDetails(props.repo, props.version)
        releaseDetails.value = details
      } catch (error) {
        console.error('获取发布详情失败:', error)
      } finally {
        loading.value = false
      }
    }

    watchEffect(() => {
      if (props.show && props.version) {
        fetchReleaseDetails()
      }
    })

    const handleClose = () => {
      emit('update:show', false)
    }

    const openGitHub = () => {
      if (releaseDetails.value?.html_url) {
        window.open(releaseDetails.value.html_url, '_blank')
      }
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString('zh-CN')
    }

    // 简单的 HTML 清理函数，移除潜在的危险标签和属性
    const sanitizeHtml = (html: string): string => {
      // 允许的标签和属性
      const _allowedTags = [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'code',
        'pre',
        'blockquote',
        'ul',
        'ol',
        'li',
        'a',
        'hr',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
      ]
      const _allowedAttributes = ['href', 'title', 'target', 'rel']

      // 移除 script 标签和 javascript: 协议
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '') // 移除事件处理器
    }

    const formatMarkdown = (markdown: string): string => {
      if (!markdown) return ''

      try {
        // 使用 marked 库进行专业的 markdown 渲染
        const result = marked.parse(markdown, {
          breaks: true, // 支持换行符转换为 <br>
          gfm: true, // 支持 GitHub Flavored Markdown
        })

        // 确保返回字符串并进行安全清理
        const htmlString =
          typeof result === 'string' ? result : markdown.replace(/\n/g, '<br>')
        return sanitizeHtml(htmlString)
      } catch (error) {
        console.error('Markdown 渲染失败:', error)
        // 降级到简单的文本显示
        return markdown.replace(/\n/g, '<br>')
      }
    }

    return () => (
      <NModal
        show={props.show}
        onUpdateShow={handleClose}
        preset="card"
        style={{ width: '600px', maxWidth: '90vw' }}
        title={props.title || '更新详情'}
        bordered={false}
        closable
      >
        <NSpin show={loading.value}>
          {releaseDetails.value ? (
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="mb-2 text-lg font-semibold">
                    {releaseDetails.value.name || releaseDetails.value.tag_name}
                  </h3>
                  <div class="flex items-center gap-2">
                    <NTag type="info">{releaseDetails.value.tag_name}</NTag>
                    <span class="text-sm text-gray-500">
                      发布于 {formatDate(releaseDetails.value.published_at)}
                    </span>
                  </div>
                </div>
                <NButton type="primary" onClick={openGitHub}>
                  在 GitHub 查看
                </NButton>
              </div>

              {releaseDetails.value.body && (
                <div class="mt-4">
                  <h4 class="mb-2 font-medium">更新内容：</h4>
                  <div
                    class="prose prose-sm markdown-content max-w-none rounded-lg bg-gray-50 p-4 leading-relaxed dark:bg-gray-800"
                    innerHTML={formatMarkdown(releaseDetails.value.body)}
                  />
                </div>
              )}
            </div>
          ) : !loading.value ? (
            <div class="py-8 text-center text-gray-500">无法获取更新详情</div>
          ) : null}
        </NSpin>
      </NModal>
    )
  },
})

export const useUpdateDetailModal = () => {
  const showModal = ref(false)
  const version = ref('')
  const repo = ref<'mx-server' | 'mx-admin'>('mx-server')
  const title = ref('')

  const openModal = (params: {
    version: string
    repo: 'mx-server' | 'mx-admin'
    title?: string
  }) => {
    version.value = params.version
    repo.value = params.repo
    title.value = params.title || '更新详情'
    showModal.value = true
  }

  const closeModal = () => {
    showModal.value = false
  }

  const Modal = () => (
    <UpdateDetailModal
      show={showModal.value}
      onUpdate:show={(val: boolean) => (showModal.value = val)}
      version={version.value}
      repo={repo.value}
      title={title.value}
    />
  )

  return {
    openModal,
    closeModal,
    Modal,
  }
}
