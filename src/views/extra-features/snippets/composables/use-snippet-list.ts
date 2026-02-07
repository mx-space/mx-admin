import { computed, onMounted, ref } from 'vue'
import type { SnippetGroup } from '~/api'
import type { SnippetModel } from '../../../../models/snippet'

import { snippetsApi } from '~/api'

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

      const existingState = new Map(
        groupsWithSnippets.value.map((g) => [
          g.reference,
          { expanded: g.expanded, snippets: g.snippets },
        ]),
      )

      groupsWithSnippets.value = data.data.map((group) => {
        const prev = existingState.get(group.reference)
        return {
          ...group,
          snippets: prev?.snippets ?? [],
          expanded: prev?.expanded ?? false,
          loading: false,
        }
      })
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
      group.snippets = res
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

    const group = groupsWithSnippets.value.find(
      (g) => g.reference === snippet.reference,
    )
    if (group) {
      group.snippets = group.snippets.filter((s) => s.id !== snippet.id)
      group.count = Math.max(0, group.count - 1)
    }

    return isBuiltFunction ? 'reset' : 'delete'
  }

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
