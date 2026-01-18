import { computed, onUnmounted, ref } from 'vue'
import { throttle } from 'es-toolkit/compat'

import type {
  DraftModel,
  DraftRefType,
  TypeSpecificData,
} from '~/models/draft'
import { draftsApi } from '~/api'

export interface DraftData {
  title: string
  text: string
  images?: any[]
  meta?: Record<string, any>
  typeSpecificData: TypeSpecificData
}

export const useServerDraft = (
  refType: DraftRefType,
  options: {
    /** 关联的已发布内容 ID（编辑模式） */
    refId?: string
    /** 当前草稿 ID（从 URL 获取） */
    draftId?: string
    /** 自动保存间隔（毫秒） */
    interval?: number
    /** 获取当前数据的函数 */
    getData: () => DraftData
  },
) => {
  const { refId, interval = 10000, getData } = options

  const draftId = ref<string | undefined>(options.draftId)
  const lastSavedVersion = ref(0)
  const isSaving = ref(false)
  const lastSavedTime = ref<Date | null>(null)
  const hasUnsavedChanges = ref(false)

  let memoPreviousData: DraftData | null = null
  let autoSaveTimer: ReturnType<typeof setInterval> | null = null

  // 检查数据是否有变化
  const hasChanges = (current: DraftData): boolean => {
    if (!memoPreviousData) return true
    return (
      current.title !== memoPreviousData.title ||
      current.text !== memoPreviousData.text ||
      JSON.stringify(current.typeSpecificData) !==
        JSON.stringify(memoPreviousData.typeSpecificData)
    )
  }

  // 保存草稿到服务端（带节流）
  const doSave = async () => {
    const data = getData()

    if (!data.text && !data.title) return
    if (!hasChanges(data)) {
      hasUnsavedChanges.value = false
      return
    }

    isSaving.value = true
    try {
      let response: DraftModel

      if (draftId.value) {
        // 更新现有草稿
        response = await draftsApi.update(draftId.value, {
          title: data.title,
          text: data.text,
          images: data.images,
          meta: data.meta,
          typeSpecificData: data.typeSpecificData,
        })
      } else {
        // 创建新草稿
        response = await draftsApi.create({
          refType,
          refId,
          title: data.title,
          text: data.text,
          images: data.images,
          meta: data.meta,
          typeSpecificData: data.typeSpecificData,
        })
        draftId.value = response.id
      }

      memoPreviousData = { ...data }
      lastSavedVersion.value = response.version
      lastSavedTime.value = new Date()
      hasUnsavedChanges.value = false

      console.log('[Draft] Saved to server, version:', response.version)
    } catch (error) {
      console.error('[Draft] Save failed:', error)
    } finally {
      isSaving.value = false
    }
  }

  const saveDraft = throttle(doSave, 1000)

  // 加载指定 ID 的草稿
  const loadDraftById = async (id: string): Promise<DraftModel | null> => {
    try {
      const draft = await draftsApi.getById(id)
      if (draft?.id) {
        draftId.value = draft.id
        lastSavedVersion.value = draft.version
        lastSavedTime.value = new Date(draft.updated)
        memoPreviousData = {
          title: draft.title,
          text: draft.text,
          images: draft.images,
          meta: draft.meta,
          typeSpecificData: draft.typeSpecificData || {},
        }
      }
      return draft
    } catch {
      return null
    }
  }

  // 按关联内容加载草稿
  const loadDraftByRef = async (
    type: DraftRefType,
    id: string,
  ): Promise<DraftModel | null> => {
    try {
      const draft = await draftsApi.getByRef(type, id)
      if (draft?.id) {
        draftId.value = draft.id
        lastSavedVersion.value = draft.version
        lastSavedTime.value = new Date(draft.updated)
        memoPreviousData = {
          title: draft.title,
          text: draft.text,
          images: draft.images,
          meta: draft.meta,
          typeSpecificData: draft.typeSpecificData || {},
        }
      }
      return draft
    } catch {
      return null
    }
  }

  // 获取新建草稿列表（无关联的草稿）
  const getNewDrafts = async (type: DraftRefType): Promise<DraftModel[]> => {
    try {
      return await draftsApi.getNewDrafts(type)
    } catch {
      return []
    }
  }

  // 创建新草稿
  const createDraft = async (): Promise<DraftModel | null> => {
    try {
      const response = await draftsApi.create({
        refType,
        refId,
        title: '',
        text: '',
        typeSpecificData: {},
      })
      draftId.value = response.id
      lastSavedVersion.value = response.version
      lastSavedTime.value = new Date(response.updated || response.created)
      return response
    } catch {
      return null
    }
  }

  // 删除草稿
  const deleteDraft = async () => {
    if (!draftId.value) return

    try {
      await draftsApi.delete(draftId.value)
      draftId.value = undefined
      lastSavedVersion.value = 0
      lastSavedTime.value = null
      memoPreviousData = null
    } catch (error) {
      console.error('[Draft] Delete failed:', error)
    }
  }

  // 开始自动保存
  const startAutoSave = () => {
    stopAutoSave()
    autoSaveTimer = setInterval(() => {
      const data = getData()
      if (hasChanges(data)) {
        hasUnsavedChanges.value = true
        saveDraft()
      }
    }, interval)
  }

  // 停止自动保存
  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // 立即保存（不节流）
  const saveImmediately = async () => {
    await doSave()
  }

  // 更新记忆数据（用于初始化后同步）
  const syncMemory = () => {
    memoPreviousData = getData()
  }

  // 组件卸载时停止自动保存
  onUnmounted(() => {
    stopAutoSave()
  })

  return {
    draftId: computed(() => draftId.value),
    isSaving: computed(() => isSaving.value),
    lastSavedTime: computed(() => lastSavedTime.value),
    lastSavedVersion: computed(() => lastSavedVersion.value),
    hasUnsavedChanges: computed(() => hasUnsavedChanges.value),

    saveDraft,
    saveImmediately,
    loadDraftById,
    loadDraftByRef,
    getNewDrafts,
    createDraft,
    deleteDraft,
    startAutoSave,
    stopAutoSave,
    syncMemory,
  }
}
