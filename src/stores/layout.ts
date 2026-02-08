import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef, watch } from 'vue'
import type { VNode } from 'vue'

type LayoutMutationSnapshot = {
  headerActions: number
  footerActions: number
  pageTitle: number
  hideHeader: number
  headerClass: number
  headerSubtitle: number
  contentPadding: number
  contentMinFullHeight: number
  floatButtons: number
}

export const useLayoutStore = defineStore('layout', () => {
  const headerActions = shallowRef<VNode | null>(null)
  const footerActions = shallowRef<VNode | null>(null)
  const pageTitle = ref<string | null>(null)
  const hideHeader = ref(false)
  const headerClass = ref<string | null>(null)
  const headerSubtitle = shallowRef<VNode | null>(null)
  const contentPadding = ref(true)
  const contentMinFullHeight = ref(false)
  const floatButtons = shallowReactive<Map<symbol, VNode>>(new Map())
  const mutationStamps = shallowReactive<LayoutMutationSnapshot>({
    headerActions: 0,
    footerActions: 0,
    pageTitle: 0,
    hideHeader: 0,
    headerClass: 0,
    headerSubtitle: 0,
    contentPadding: 0,
    contentMinFullHeight: 0,
    floatButtons: 0,
  })

  watch(
    headerActions,
    () => {
      mutationStamps.headerActions += 1
    },
    { flush: 'sync' },
  )
  watch(
    footerActions,
    () => {
      mutationStamps.footerActions += 1
    },
    { flush: 'sync' },
  )
  watch(
    pageTitle,
    () => {
      mutationStamps.pageTitle += 1
    },
    { flush: 'sync' },
  )
  watch(
    hideHeader,
    () => {
      mutationStamps.hideHeader += 1
    },
    { flush: 'sync' },
  )
  watch(
    headerClass,
    () => {
      mutationStamps.headerClass += 1
    },
    { flush: 'sync' },
  )
  watch(
    headerSubtitle,
    () => {
      mutationStamps.headerSubtitle += 1
    },
    { flush: 'sync' },
  )
  watch(
    contentPadding,
    () => {
      mutationStamps.contentPadding += 1
    },
    { flush: 'sync' },
  )
  watch(
    contentMinFullHeight,
    () => {
      mutationStamps.contentMinFullHeight += 1
    },
    { flush: 'sync' },
  )
  watch(
    () => floatButtons.size,
    () => {
      mutationStamps.floatButtons += 1
    },
    { flush: 'sync' },
  )

  const addFloatButton = (button: VNode): symbol => {
    const key = Symbol('floatButton')
    floatButtons.set(key, button)
    return key
  }

  const removeFloatButton = (key: symbol) => {
    floatButtons.delete(key)
  }

  const reset = () => {
    headerActions.value = null
    footerActions.value = null
    pageTitle.value = null
    hideHeader.value = false
    headerClass.value = null
    headerSubtitle.value = null
    contentPadding.value = true
    contentMinFullHeight.value = false
    floatButtons.clear()
  }

  const getMutationSnapshot = (): LayoutMutationSnapshot => ({
    headerActions: mutationStamps.headerActions,
    footerActions: mutationStamps.footerActions,
    pageTitle: mutationStamps.pageTitle,
    hideHeader: mutationStamps.hideHeader,
    headerClass: mutationStamps.headerClass,
    headerSubtitle: mutationStamps.headerSubtitle,
    contentPadding: mutationStamps.contentPadding,
    contentMinFullHeight: mutationStamps.contentMinFullHeight,
    floatButtons: mutationStamps.floatButtons,
  })

  const resetIfUnchanged = (snapshot: LayoutMutationSnapshot) => {
    let didReset = false

    if (mutationStamps.headerActions === snapshot.headerActions) {
      headerActions.value = null
      didReset = true
    }
    if (mutationStamps.footerActions === snapshot.footerActions) {
      footerActions.value = null
      didReset = true
    }
    if (mutationStamps.pageTitle === snapshot.pageTitle) {
      pageTitle.value = null
      didReset = true
    }
    if (mutationStamps.hideHeader === snapshot.hideHeader) {
      hideHeader.value = false
      didReset = true
    }
    if (mutationStamps.headerClass === snapshot.headerClass) {
      headerClass.value = null
      didReset = true
    }
    if (mutationStamps.headerSubtitle === snapshot.headerSubtitle) {
      headerSubtitle.value = null
      didReset = true
    }
    if (mutationStamps.contentPadding === snapshot.contentPadding) {
      contentPadding.value = true
      didReset = true
    }
    if (mutationStamps.contentMinFullHeight === snapshot.contentMinFullHeight) {
      contentMinFullHeight.value = false
      didReset = true
    }
    if (mutationStamps.floatButtons === snapshot.floatButtons) {
      floatButtons.clear()
      didReset = true
    }

    return didReset
  }

  return {
    headerActions,
    footerActions,
    pageTitle,
    hideHeader,
    headerClass,
    headerSubtitle,
    contentPadding,
    contentMinFullHeight,
    floatButtons,
    addFloatButton,
    removeFloatButton,
    getMutationSnapshot,
    reset,
    resetIfUnchanged,
  }
})

export { useLayoutStore as LayoutStore }
