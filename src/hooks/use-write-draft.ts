import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DraftModel, DraftRefType } from '~/models/draft'
import type { DraftData } from './use-server-draft'

import { useServerDraft } from './use-server-draft'

export interface UseWriteDraftOptions<T> {
  /** 草稿类型 */
  refType: DraftRefType
  /** 自动保存间隔（毫秒） */
  interval?: number
  /** 获取当前数据的函数 */
  getData: () => DraftData
  /** 从草稿恢复数据到 reactive（isPartial 为 true 时保留未在草稿中的原值） */
  applyDraft: (draft: DraftModel, data: T, isPartial?: boolean) => void
  /** 加载已发布内容并应用到 data */
  loadPublished: (id: string) => Promise<void>
  /** 草稿标签（用于提示文案），如 "文章"、"手记"、"页面" */
  draftLabel?: string
  /** title 为空使用默认值时的回调 */
  onTitleFallback?: (defaultTitle: string) => void
}

export function useWriteDraft<T>(data: T, options: UseWriteDraftOptions<T>) {
  const {
    refType,
    interval = 10000,
    getData,
    applyDraft,
    loadPublished,
    draftLabel = '内容',
    onTitleFallback,
  } = options

  const route = useRoute()
  const router = useRouter()

  const id = computed(() => route.query.id as string | undefined)
  const draftIdFromRoute = computed(
    () => route.query.draftId as string | undefined,
  )

  const draftInitialized = ref(false)

  const serverDraft = useServerDraft(refType, {
    refId: id.value,
    draftId: draftIdFromRoute.value,
    interval,
    getData,
    onDraftCreated: (draftId) => {
      router.replace({ query: { draftId } })
    },
    onTitleFallback,
  })

  /** 是否为编辑模式（编辑已发布内容） */
  const isEditing = computed(() => !!(serverDraft.refId.value || id.value))

  /** 实际关联的已发布内容 ID */
  const actualRefId = computed(() => serverDraft.refId.value || id.value)

  /**
   * 初始化草稿（在 onMounted 中调用）
   * @param onBeforeLoadPublished 加载已发布内容前的回调（用于特殊处理）
   */
  const initialize = async (onBeforeLoadPublished?: () => void) => {
    const $id = id.value
    const $draftId = draftIdFromRoute.value

    // 场景1：通过 draftId 加载草稿
    if ($draftId) {
      const draft = await serverDraft.loadDraftById($draftId)
      if (draft) {
        applyDraft(draft, data, false)
        serverDraft.syncMemory()
        serverDraft.startAutoSave()
        draftInitialized.value = true
        return
      }
    }

    // 场景2：编辑已发布内容
    if ($id && typeof $id === 'string') {
      onBeforeLoadPublished?.()
      await loadPublished($id)

      // 检查是否有关联的草稿
      const relatedDraft = await serverDraft.loadDraftByRef(refType, $id)
      if (relatedDraft) {
        window.dialog.info({
          title: '检测到未保存的草稿',
          content: `上次保存时间: ${new Date(relatedDraft.updated).toLocaleString()}`,
          negativeText: '使用已发布版本',
          positiveText: '恢复草稿',
          onNegativeClick() {
            serverDraft.syncMemory()
            serverDraft.startAutoSave()
          },
          onPositiveClick() {
            applyDraft(relatedDraft, data, true)
            serverDraft.syncMemory()
            serverDraft.startAutoSave()
          },
        })
      } else {
        serverDraft.syncMemory()
        serverDraft.startAutoSave()
      }

      draftInitialized.value = true
      return
    }

    // 场景3：新建入口
    const pendingDrafts = await serverDraft.getNewDrafts(refType)
    if (pendingDrafts.length > 0) {
      window.dialog.info({
        title: '发现未完成的草稿',
        content: `你有 ${pendingDrafts.length} 个未完成的${draftLabel}草稿，是否继续编辑？`,
        negativeText: '创建新草稿',
        positiveText: '继续编辑',
        onNegativeClick() {
          serverDraft.startAutoSave()
        },
        onPositiveClick() {
          const firstDraft = pendingDrafts[0]
          router.replace({ query: { draftId: firstDraft.id } })
        },
      })
    } else {
      serverDraft.startAutoSave()
    }

    draftInitialized.value = true
  }

  return {
    /** 路由中的 id 参数 */
    id,
    /** 路由中的 draftId 参数 */
    draftIdFromRoute,
    /** 草稿是否已初始化 */
    draftInitialized,
    /** 服务端草稿 hook 实例 */
    serverDraft,
    /** 是否为编辑模式 */
    isEditing,
    /** 实际关联的已发布内容 ID（用于提交时判断是更新还是创建） */
    actualRefId,
    /** 初始化函数（在 onMounted 中调用） */
    initialize,
  }
}
