import type { SnippetModel } from '../../../../models/snippet'

import { snippetsApi, type SnippetGroup } from '~/api'

export interface GroupWithSnippets extends SnippetGroup {
  snippets: SnippetModel[]
  expanded: boolean
  loading: boolean
}

export function useSnippetList() {
  const groupsWithSnippets = ref<GroupWithSnippets[]>([])
  const loading = ref(false)

  const fetchGroups = async () => {
    loading.value = true
    try {
      const data = await snippetsApi.getGroups({ size: 50 })

      // Preserve expanded state for existing groups
      const existingExpandedState = new Map(
        groupsWithSnippets.value.map((g) => [g.reference, g.expanded]),
      )

      groupsWithSnippets.value = data.data.map((group) => ({
        ...group,
        snippets: [],
        expanded: existingExpandedState.get(group.reference) ?? false,
        loading: false,
      }))
    } finally {
      loading.value = false
    }
  }

  const fetchGroupSnippets = async (reference: string) => {
    const group = groupsWithSnippets.value.find(
      (g) => g.reference === reference,
    )
    if (!group) return

    group.loading = true
    try {
      const res = await snippetsApi.getGroupSnippets(reference)
      group.snippets = res.data
    } catch (error) {
      console.error('Failed to fetch snippets:', error)
    } finally {
      group.loading = false
    }
  }

  const toggleGroup = async (reference: string) => {
    const group = groupsWithSnippets.value.find(
      (g) => g.reference === reference,
    )
    if (!group) return

    group.expanded = !group.expanded

    // Fetch snippets if expanding and not yet loaded
    if (group.expanded && group.snippets.length === 0) {
      await fetchGroupSnippets(reference)
    }
  }

  const deleteSnippet = async (snippet: SnippetModel) => {
    const isBuiltFunction = snippet.builtIn && snippet.type === 'function'

    if (!snippet.id) {
      throw new Error('Snippet ID is required')
    }

    if (isBuiltFunction) {
      await snippetsApi.resetFunction(snippet.id)
    } else {
      await snippetsApi.delete(snippet.id)
    }

    // Remove from local list
    const group = groupsWithSnippets.value.find(
      (g) => g.reference === snippet.reference,
    )
    if (group) {
      group.snippets = group.snippets.filter((s) => s.id !== snippet.id)
      group.count = Math.max(0, group.count - 1)
    }

    return isBuiltFunction ? 'reset' : 'delete'
  }

  // Get all snippets flattened (for search)
  const allSnippets = computed(() =>
    groupsWithSnippets.value.flatMap((g) => g.snippets),
  )

  onMounted(() => {
    fetchGroups()
  })

  return {
    groupsWithSnippets,
    loading,
    allSnippets,
    fetchGroups,
    fetchGroupSnippets,
    toggleGroup,
    deleteSnippet,
  }
}
