import { NButton, NModal, NModalProvider, NSpin, NTag } from 'naive-ui'
import { defineComponent, ref, watchEffect } from 'vue'
import { getReleaseDetails } from '../../external/api/github-check-update'

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

    const formatMarkdown = (markdown: string) => {
      if (!markdown) return ''
      
      // 简单的 markdown 转换，可以根据需要扩展
      return markdown
        .replace(/### (.*)/g, '<h3 style="margin: 16px 0 8px 0; font-weight: bold;">$1</h3>')
        .replace(/## (.*)/g, '<h2 style="margin: 20px 0 12px 0; font-weight: bold; font-size: 1.2em;">$1</h2>')
        .replace(/# (.*)/g, '<h1 style="margin: 24px 0 16px 0; font-weight: bold; font-size: 1.4em;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: rgba(175, 184, 193, 0.2); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
        .replace(/\n/g, '<br>')
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
                  <h3 class="text-lg font-semibold mb-2">
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
                  <h4 class="font-medium mb-2">更新内容：</h4>
                  <div 
                    class="prose prose-sm max-w-none p-3 bg-gray-50 rounded-md dark:bg-gray-800"
                    innerHTML={formatMarkdown(releaseDetails.value.body)}
                  />
                </div>
              )}
            </div>
          ) : !loading.value ? (
            <div class="text-center py-8 text-gray-500">
              无法获取更新详情
            </div>
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
      onUpdate:show={(val: boolean) => showModal.value = val}
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
