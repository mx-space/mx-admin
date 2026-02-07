import {
  ArrowLeft as ArrowLeftIcon,
  CircleCheck as CheckCircleIcon,
  Code as CodeIcon,
  ScrollText as LogIcon,
  Plus as PlusIcon,
  Settings as SettingsIcon,
} from 'lucide-vue-next'
import { NButton, NDrawer, NDrawerContent, NModal, NPopover } from 'naive-ui'
import { codeToHtml } from 'shiki'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { PropType } from 'vue'
import type { SnippetModel } from '../../../models/snippet'

import { useQuery } from '@tanstack/vue-query'

import { serverlessApi } from '~/api/serverless'
import { HeaderActionButton } from '~/components/button/header-action-button'
import {
  MasterDetailLayout,
  useMasterDetailLayout,
} from '~/components/layout/master-detail-layout'
import { useMountAndUnmount } from '~/hooks/use-lifecycle'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useLayout } from '~/layouts/content'
import { UIStore } from '~/stores/ui'

import { SnippetTypeToLanguage } from '../../../models/snippet'
import { CodeEditorForSnippet } from './components/code-editor'
import { FnLogDrawer } from './components/fn-log-drawer'
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

    const selectedId = ref<string | null>(null)
    const showDetailOnMobile = ref(false)
    const showCreateModal = ref(false)
    const showLogDrawer = ref(false)
    const showCompiledDrawer = ref(false)

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

    onMounted(async () => {
      if (route.query.id) {
        selectedId.value = route.query.id as string
      }
    })

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

    const handleCreate = () => {
      selectedId.value = null
      resetEditor()
      showCreateModal.value = true
    }

    const handleCreateConfirm = () => {
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
        fetchGroups()

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

    const DetailPanel = () => (
      <div class="flex h-full flex-col">
        {/* Header */}
        <div class="flex h-12 flex-shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            {isMobile.value && (
              <button
                onClick={handleBack}
                class="-ml-2 flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <ArrowLeftIcon class="size-5" />
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
            {isFunctionType.value && !isNew.value && (
              <>
                <button
                  class="flex size-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                  onClick={() => (showCompiledDrawer.value = true)}
                  title="查看编译产物"
                >
                  <CodeIcon class="size-4" />
                </button>
                <button
                  class="flex size-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                  onClick={() => (showLogDrawer.value = true)}
                  title="调用日志"
                >
                  <LogIcon class="size-4" />
                </button>
              </>
            )}

            <NPopover trigger="click" placement="bottom-end" showArrow={false}>
              {{
                trigger: () => (
                  <button class="flex size-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100">
                    <SettingsIcon class="size-4" />
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
              renderIcon={() => <CheckCircleIcon class="size-4" />}
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

        {isFunctionType.value && !isNew.value && selectedId.value && (
          <>
            <FnLogDrawer
              show={showLogDrawer.value}
              id={selectedId.value}
              onClose={() => (showLogDrawer.value = false)}
            />
            <CompiledCodeDrawer
              show={showCompiledDrawer.value}
              id={selectedId.value}
              onClose={() => (showCompiledDrawer.value = false)}
            />
          </>
        )}
      </>
    )
  },
})

const CompiledCodeDrawer = defineComponent({
  props: {
    show: { type: Boolean, required: true },
    id: { type: String, required: true },
    onClose: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const { data, isLoading } = useQuery({
      queryKey: computed(() => ['serverless', 'compiled', props.id]),
      queryFn: () => serverlessApi.getCompiledCode(props.id),
      enabled: computed(() => props.show && !!props.id),
    })

    const highlightedHtml = ref('')
    const { isDark } = useStoreRef(UIStore)

    watch(
      () => [props.show, data.value, isDark.value] as const,
      async ([show, code]) => {
        if (!show || !code) {
          highlightedHtml.value = ''
          return
        }
        try {
          highlightedHtml.value = await codeToHtml(code, {
            lang: 'javascript',
            theme: isDark.value ? 'github-dark' : 'github-light',
          })
        } catch {
          const escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
          highlightedHtml.value = `<pre class="overflow-auto whitespace-pre-wrap break-all rounded-lg bg-neutral-950 p-4 font-mono text-xs text-neutral-300">${escaped}</pre>`
        }
      },
      { immediate: true },
    )

    return () => (
      <NDrawer
        show={props.show}
        onUpdateShow={(show) => !show && props.onClose()}
        width={600}
        placement="right"
      >
        <NDrawerContent title="编译产物" closable>
          {isLoading.value ? (
            <div class="flex items-center justify-center py-24">
              <div class="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
            </div>
          ) : data.value ? (
            highlightedHtml.value ? (
              <div
                class="overflow-auto rounded-lg [&_pre]:!m-0 [&_pre]:!p-4 [&_pre]:!text-xs"
                v-html={highlightedHtml.value}
              />
            ) : (
              <pre class="overflow-auto whitespace-pre-wrap break-all rounded-lg bg-neutral-950 p-4 font-mono text-xs text-neutral-300">
                {data.value}
              </pre>
            )
          ) : (
            <p class="text-sm text-neutral-400">暂无编译产物</p>
          )}
        </NDrawerContent>
      </NDrawer>
    )
  },
})
