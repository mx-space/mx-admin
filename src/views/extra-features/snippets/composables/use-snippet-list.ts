import type { SnippetModel } from '../../../../models/snippet'
import type { SnippetGroup } from '../interfaces/snippet-group'

import { RESTManager } from '~/utils'

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
      const data = await RESTManager.api.snippets.group.get<{
        data: SnippetGroup[]
      }>({
        params: { size: 50 },
      })

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
      const res = await RESTManager.api.snippets
        .group(reference)
        .get<{ data: SnippetModel[] }>()
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

    if (isBuiltFunction) {
      await RESTManager.api.fn.reset(snippet.id).delete()
    } else {
      await RESTManager.api.snippets(snippet.id).delete()
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
