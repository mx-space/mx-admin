import {
  ArrowLeft as ArrowLeftIcon,
  CircleCheck as CheckCircleIcon,
  Plus as PlusIcon,
  Settings as SettingsIcon,
} from 'lucide-vue-next'
import { NButton, NModal, NPopover, useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import type { SnippetModel } from '../../../models/snippet'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { useMountAndUnmount } from '~/hooks/use-lifecycle'
import { useLayout } from '~/layouts/content'
import { useUIStore } from '~/stores/ui'

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
    const message = useMessage()
    const layout = useLayout()
    const uiStore = useUIStore()

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

    // Computed
    const isMobile = computed(() => uiStore.viewport.mobile)

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
        message.warning('请填写片段名称')
        return
      }
      if (!editData.value.reference?.trim()) {
        message.warning('请填写引用分组')
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
      message.success(`${action === 'reset' ? '重置' : '删除'}成功`)

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

    // Desktop Layout
    const DesktopLayout = () => (
      <div class="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {/* Master Panel - Group Tree */}
        <div class="w-[260px] flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800">
          <SnippetList
            groups={groupsWithSnippets.value}
            selectedId={selectedId.value}
            loading={listLoading.value}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onToggleGroup={toggleGroup}
            onCreate={handleCreate}
          />
        </div>

        {/* Detail Panel */}
        <div class="min-w-0 flex-1">
          {selectedId.value || isNew.value ? (
            <div class="flex h-full flex-col">
              {/* Header with Config Button */}
              <div class="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-neutral-900 dark:text-neutral-100">
                    {isNew.value ? '新建片段' : editData.value.name}
                  </span>
                  {!isNew.value && (
                    <span class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                      {editData.value.type.toUpperCase()}
                    </span>
                  )}
                </div>

                <div class="flex items-center gap-2">
                  <NPopover
                    trigger="click"
                    placement="bottom-end"
                    showArrow={false}
                  >
                    {{
                      trigger: () => (
                        <NButton size="small" quaternary>
                          <SettingsIcon class="mr-1 h-4 w-4" />
                          配置
                        </NButton>
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

              {/* Code Editor - takes remaining space */}
              <div class="min-h-0 flex-1">
                <CodeEditorForSnippet
                  language={SnippetTypeToLanguage[editData.value.type]}
                  value={editorValue.value}
                  onChange={updateEditorValue}
                  onSave={handleSave}
                />
              </div>
            </div>
          ) : (
            <SnippetEmptyState
              hasSnippets={groupsWithSnippets.value.some((g) => g.count > 0)}
              onCreate={handleCreate}
            />
          )}
        </div>
      </div>
    )

    // Mobile Layout
    const MobileLayout = () => (
      <div class="relative h-[calc(100vh-8rem)] overflow-hidden">
        {/* List View */}
        <div
          class={[
            'absolute inset-0 transition-transform duration-300',
            showDetailOnMobile.value && '-translate-x-full',
          ]}
        >
          <div class="h-full rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <SnippetList
              groups={groupsWithSnippets.value}
              selectedId={selectedId.value}
              loading={listLoading.value}
              onSelect={handleSelect}
              onDelete={handleDelete}
              onToggleGroup={toggleGroup}
              onCreate={handleCreate}
            />
          </div>
        </div>

        {/* Detail View */}
        <div
          class={[
            'absolute inset-0 transition-transform duration-300',
            showDetailOnMobile.value ? 'translate-x-0' : 'translate-x-full',
          ]}
        >
          <div class="flex h-full flex-col rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {/* Back Header */}
            <div class="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
              <div class="flex items-center">
                <NButton text onClick={handleBack} class="mr-2">
                  <ArrowLeftIcon class="h-5 w-5" />
                </NButton>
                <span class="font-medium">
                  {isNew.value ? '新建片段' : editData.value.name}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <NPopover
                  trigger="click"
                  placement="bottom-end"
                  showArrow={false}
                >
                  {{
                    trigger: () => (
                      <NButton size="small" quaternary>
                        <SettingsIcon class="h-4 w-4" />
                      </NButton>
                    ),
                    default: ConfigPopover,
                  }}
                </NPopover>

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
        {isMobile.value ? <MobileLayout /> : <DesktopLayout />}
        <CreateModal />
      </>
    )
  },
})
