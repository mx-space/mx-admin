import {
  Loader2 as LoaderIcon,
  Pencil as PencilIcon,
  RefreshCw as RefreshIcon,
  Sparkles as SparklesIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NDataTable,
  NInput,
  NPopconfirm,
  NSelect,
  NTag,
} from 'naive-ui'
import { computed, defineComponent, onMounted, ref, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import type { TranslationEntry, TranslationEntryKeyPath } from '~/api/ai'
import type { DataTableColumns } from 'naive-ui'

import { useQuery, useQueryClient } from '@tanstack/vue-query'

import { aiApi } from '~/api/ai'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { RelativeTime } from '~/components/time/relative-time'
import { queryKeys } from '~/hooks/queries/keys'
import { useLayout } from '~/hooks/use-layout'

const KEY_PATH_LABELS: Record<TranslationEntryKeyPath, string> = {
  'category.name': '分类名称',
  'topic.name': '专栏名称',
  'topic.introduce': '专栏简介',
  'note.mood': '心情',
  'note.weather': '天气',
}

const KEY_PATH_OPTIONS = Object.entries(KEY_PATH_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export default defineComponent({
  name: 'AITranslationEntriesPage',
  setup() {
    const { setActions } = useLayout()
    const queryClient = useQueryClient()

    const pageRef = ref(1)
    const sizeRef = ref(20)
    const filterKeyPath = ref<TranslationEntryKeyPath | null>(null)
    const filterLang = ref<string | null>(null)
    const generating = ref(false)
    const editingId = ref<string | null>(null)
    const editingText = ref('')

    const queryParams = computed(() => ({
      page: pageRef.value,
      size: sizeRef.value,
      ...(filterKeyPath.value ? { keyPath: filterKeyPath.value } : {}),
      ...(filterLang.value ? { lang: filterLang.value } : {}),
    }))

    const { data, isPending, refetch } = useQuery({
      queryKey: computed(() =>
        queryKeys.ai.translationEntriesList(queryParams.value),
      ),
      queryFn: () => aiApi.getTranslationEntries(queryParams.value),
    })

    const entries = computed(() => data.value?.data ?? [])
    const pagination = computed(() => data.value?.pagination)

    const handleGenerate = async () => {
      generating.value = true
      try {
        const result = await aiApi.generateTranslationEntries()
        toast.success(
          `生成完成: 新增 ${result.created}，跳过 ${result.skipped}`,
        )
        queryClient.invalidateQueries({
          queryKey: queryKeys.ai.translationEntries(),
        })
      } catch {
        toast.error('生成失败')
      } finally {
        generating.value = false
      }
    }

    const handleDelete = async (id: string) => {
      try {
        await aiApi.deleteTranslationEntry(id)
        toast.success('已删除')
        queryClient.invalidateQueries({
          queryKey: queryKeys.ai.translationEntries(),
        })
      } catch {
        toast.error('删除失败')
      }
    }

    const handleStartEdit = (row: TranslationEntry) => {
      editingId.value = row.id
      editingText.value = row.translatedText
    }

    const handleSaveEdit = async () => {
      if (!editingId.value) return
      try {
        await aiApi.updateTranslationEntry(editingId.value, {
          translatedText: editingText.value,
        })
        toast.success('已更新')
        editingId.value = null
        queryClient.invalidateQueries({
          queryKey: queryKeys.ai.translationEntries(),
        })
      } catch {
        toast.error('更新失败')
      }
    }

    const handleCancelEdit = () => {
      editingId.value = null
      editingText.value = ''
    }

    const columns: DataTableColumns<TranslationEntry> = [
      {
        title: '字段',
        key: 'keyPath',
        width: 120,
        render: (row) => (
          <NTag size="small" bordered={false}>
            {KEY_PATH_LABELS[row.keyPath] ?? row.keyPath}
          </NTag>
        ),
      },
      {
        title: '类型',
        key: 'keyType',
        width: 70,
        render: (row) => (
          <NTag
            size="small"
            type={row.keyType === 'entity' ? 'info' : 'warning'}
            bordered={false}
          >
            {row.keyType}
          </NTag>
        ),
      },
      {
        title: '语言',
        key: 'lang',
        width: 60,
      },
      {
        title: '原文',
        key: 'sourceText',
        ellipsis: { tooltip: true },
      },
      {
        title: '译文',
        key: 'translatedText',
        ellipsis: { tooltip: true },
        render: (row) => {
          if (editingId.value === row.id) {
            return (
              <div class="flex items-center gap-1">
                <NInput
                  value={editingText.value}
                  onUpdateValue={(v: string) => (editingText.value = v)}
                  size="small"
                  onKeydown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter') handleSaveEdit()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                />
                <NButton size="tiny" type="primary" onClick={handleSaveEdit}>
                  保存
                </NButton>
                <NButton size="tiny" onClick={handleCancelEdit}>
                  取消
                </NButton>
              </div>
            )
          }
          return <span>{row.translatedText}</span>
        },
      },
      {
        title: '创建时间',
        key: 'created',
        width: 130,
        render: (row) => <RelativeTime time={row.created} />,
      },
      {
        title: '',
        key: 'actions',
        width: 80,
        render: (row) => (
          <div class="flex items-center gap-1">
            <NButton
              size="tiny"
              quaternary
              onClick={() => handleStartEdit(row)}
            >
              {{ icon: () => <PencilIcon class="size-3.5" /> }}
            </NButton>
            <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
              {{
                trigger: () => (
                  <NButton size="tiny" quaternary type="error">
                    {{ icon: () => <TrashIcon class="size-3.5" /> }}
                  </NButton>
                ),
                default: () => '确认删除此条目?',
              }}
            </NPopconfirm>
          </div>
        ),
      },
    ]

    onMounted(() => {
      watchEffect(() => {
        setActions(
          <div class="flex items-center gap-2">
            <HeaderActionButton
              icon={
                generating.value ? (
                  <LoaderIcon class="animate-spin" />
                ) : (
                  <SparklesIcon />
                )
              }
              name="生成翻译"
              variant="primary"
              disabled={generating.value}
              onClick={handleGenerate}
            />
            <HeaderActionButton
              icon={<RefreshIcon />}
              name="刷新"
              onClick={() => refetch()}
            />
          </div>,
        )
      })
    })

    return () => (
      <div class="flex h-full flex-col">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <NSelect
            value={filterKeyPath.value}
            onUpdateValue={(v: TranslationEntryKeyPath | null) => {
              filterKeyPath.value = v
              pageRef.value = 1
            }}
            options={KEY_PATH_OPTIONS}
            placeholder="筛选字段"
            clearable
            style="width: 160px"
            size="small"
          />
          <NInput
            value={filterLang.value ?? ''}
            onUpdateValue={(v: string) => {
              filterLang.value = v || null
              pageRef.value = 1
            }}
            placeholder="筛选语言 (en/ja/...)"
            clearable
            style="width: 160px"
            size="small"
          />
          <span class="text-xs text-neutral-400">
            共 {pagination.value?.total ?? 0} 条
          </span>
        </div>

        <NDataTable
          columns={columns}
          data={entries.value}
          loading={isPending.value}
          bordered={false}
          size="small"
          pagination={{
            page: pageRef.value,
            pageSize: sizeRef.value,
            pageCount: pagination.value
              ? Math.ceil(pagination.value.total / pagination.value.size)
              : 1,
            onChange: (p: number) => {
              pageRef.value = p
            },
          }}
          remote
          rowKey={(row: TranslationEntry) => row.id}
        />
      </div>
    )
  },
})
