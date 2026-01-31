import {
  ArrowLeft as ArrowLeftIcon,
  CircleCheck as CheckCircleIcon,
  Plus as PlusIcon,
  Settings as SettingsIcon,
} from 'lucide-vue-next'
import { NButton, NModal, NPopover } from 'naive-ui'
import { defineComponent, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { SnippetModel } from '../../../models/snippet'

import { HeaderActionButton } from '~/components/button/header-action-button'
import {
  MasterDetailLayout,
  useMasterDetailLayout,
} from '~/components/layout/master-detail-layout'
import { useMountAndUnmount } from '~/hooks/use-lifecycle'
import { useLayout } from '~/layouts/content'

import { SnippetTypeToLanguage } from '../../../models/snippet'
import { CodeEditorForSnippet } from './components/code-editor'
import { ImportSnippetButton } from './components/import-snippets-button'
import { InstallDependencyButton } from './components/install-dep-button'
import { SnippetEmptyState } from './components/snippet-empty-state'
import { SnippetList } from './components/snippet-list'
import { SnippetMetaForm } from './components/snippet-meta-form'
import { UpdateDependencyButton } from './components/update-deps-button'
import { useSnippetEditor } from './composables/use-snippet-editor'
import { useSnippetList } from './composables/use-snippet-list'

export default defineComponent({
  name: 'SnippetView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const layout = useLayout()
    const { isMobile } = useMasterDetailLayout()

    // State
    const selectedId = ref<string | null>(null)
    const showDetailOnMobile = ref(false)
    const showCreateModal = ref(false)

    // Composables
    const {
      groupsWithSnippets,
      loading: listLoading,
      fetchGroups,
      toggleGroup,
      deleteSnippet,
    } = useSnippetList()

    const {
      editData,
      isNew,
      isFunctionType,
      isBuiltFunction,
      editorValue,
      fetchSnippet,
      reset: resetEditor,
      save,
      updateEditorValue,
    } = useSnippetEditor(selectedId)

    // URL sync
    watch(
      selectedId,
      (id) => {
        router.replace({
          query: {
            id: id || undefined,
          },
        })
      },
      { flush: 'post' },
    )

    // Restore from URL on mount
    onMounted(async () => {
      if (route.query.id) {
        selectedId.value = route.query.id as string
      }
    })

    // Fetch snippet when ID changes
    watch(selectedId, async (id) => {
      if (id) {
        await fetchSnippet(id)
        if (isMobile.value) {
          showDetailOnMobile.value = true
        }
      } else {
        resetEditor()
      }
    })

    // Handlers
    const handleCreate = () => {
      selectedId.value = null
      resetEditor()
      showCreateModal.value = true
    }

    const handleCreateConfirm = () => {
      // Validate required fields
      if (!editData.value.name?.trim()) {
        toast.warning('请填写片段名称')
        return
      }
      if (!editData.value.reference?.trim()) {
        toast.warning('请填写引用分组')
        return
      }

      showCreateModal.value = false
      if (isMobile.value) {
        showDetailOnMobile.value = true
      }
    }

    const handleSelect = (snippet: SnippetModel) => {
      selectedId.value = snippet.id ?? null
    }

    const handleDelete = async (snippet: SnippetModel) => {
      const action = await deleteSnippet(snippet)
      toast.success(`${action === 'reset' ? '重置' : '删除'}成功`)

      if (selectedId.value === snippet.id) {
        selectedId.value = null
        if (isMobile.value) {
          showDetailOnMobile.value = false
        }
      }
    }

    const handleSave = async () => {
      const result = await save()
      if (result) {
        // Refresh list
        fetchGroups()

        // If creating new, update selectedId
        if (isNew.value && result.id) {
          selectedId.value = result.id
        }
      }
    }

    const handleBack = () => {
      showDetailOnMobile.value = false
    }

    const handleDataUpdate = (newData: SnippetModel) => {
      Object.assign(editData.value, newData)
    }

    // Layout actions
    useMountAndUnmount(() => {
      layout.setActions(
        <>
          <HeaderActionButton onClick={handleCreate} icon={<PlusIcon />} />
          <ImportSnippetButton onFinish={fetchGroups} />
          <UpdateDependencyButton />
        </>,
      )

      return () => {
        layout.setActions(null)
      }
    })

    // Config Popover content
    const ConfigPopover = () => (
      <div class="w-[400px] max-w-[90vw]">
        <SnippetMetaForm
          data={editData.value}
          isBuiltFunction={isBuiltFunction.value}
          isFunctionType={isFunctionType.value}
          isEditing={!isNew.value}
          onUpdate:data={handleDataUpdate}
        />
      </div>
    )

    // List Panel Content
    const ListPanel = () => (
      <SnippetList
        groups={groupsWithSnippets.value}
        selectedId={selectedId.value}
        loading={listLoading.value}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onToggleGroup={toggleGroup}
        onCreate={handleCreate}
      />
    )

    // Detail Panel Content
    const DetailPanel = () => (
      <div class="flex h-full flex-col bg-white dark:bg-black">
        {/* Header */}
        <div class="flex h-12 flex-shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            {isMobile.value && (
              <button
                onClick={handleBack}
                class="-ml-2 flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <ArrowLeftIcon class="h-5 w-5" />
              </button>
            )}
            <h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {isNew.value ? '新建片段' : editData.value.name}
            </h2>
            {!isNew.value && (
              <span class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                {editData.value.type.toUpperCase()}
              </span>
            )}
          </div>

          <div class="flex items-center gap-1">
            <NPopover trigger="click" placement="bottom-end" showArrow={false}>
              {{
                trigger: () => (
                  <button class="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100">
                    <SettingsIcon class="h-4 w-4" />
                  </button>
                ),
                default: ConfigPopover,
              }}
            </NPopover>

            <InstallDependencyButton />

            <NButton
              type="primary"
              size="small"
              onClick={handleSave}
              renderIcon={() => <CheckCircleIcon class="h-4 w-4" />}
            >
              保存
            </NButton>
          </div>
        </div>

        {/* Code Editor */}
        <div class="min-h-0 flex-1">
          <CodeEditorForSnippet
            language={SnippetTypeToLanguage[editData.value.type]}
            value={editorValue.value}
            onChange={updateEditorValue}
            onSave={handleSave}
          />
        </div>
      </div>
    )

    // Create Modal
    const CreateModal = () => (
      <NModal
        show={showCreateModal.value}
        onUpdateShow={(v) => (showCreateModal.value = v)}
        preset="card"
        title="新建配置片段"
        style={{ width: '460px', maxWidth: '90vw' }}
      >
        <SnippetMetaForm
          data={editData.value}
          isBuiltFunction={false}
          isFunctionType={isFunctionType.value}
          isEditing={false}
          onUpdate:data={handleDataUpdate}
        />
        <div class="mt-4 flex justify-end gap-2">
          <NButton onClick={() => (showCreateModal.value = false)}>
            取消
          </NButton>
          <NButton type="primary" onClick={handleCreateConfirm}>
            确认创建
          </NButton>
        </div>
      </NModal>
    )

    return () => (
      <>
        <MasterDetailLayout
          showDetailOnMobile={showDetailOnMobile.value}
          defaultSize={0.25}
          min={0.2}
          max={0.35}
        >
          {{
            list: ListPanel,
            detail: () =>
              selectedId.value || isNew.value ? <DetailPanel /> : null,
            empty: () => (
              <SnippetEmptyState
                hasSnippets={groupsWithSnippets.value.some((g) => g.count > 0)}
                onCreate={handleCreate}
              />
            ),
          }}
        </MasterDetailLayout>
        <CreateModal />
      </>
    )
  },
})
