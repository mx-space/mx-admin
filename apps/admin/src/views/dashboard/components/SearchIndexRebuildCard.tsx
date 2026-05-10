import { Loader2 as LoaderIcon, Search as SearchIcon } from 'lucide-vue-next'
import { NButton, NPopconfirm } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import { toast } from 'vue-sonner'

import { Icon } from '@vicons/utils'

import { searchIndexApi } from '~/api/search-index'

export const SearchIndexRebuildCard = defineComponent({
  name: 'SearchIndexRebuildCard',
  setup() {
    const incrementalLoading = ref(false)
    const forceLoading = ref(false)

    const formatStats = (r: {
      total: number
      created: number
      updated: number
      deleted: number
      skipped: number
    }) =>
      `共 ${r.total}：新建 ${r.created} · 更新 ${r.updated} · 删除 ${r.deleted} · 跳过 ${r.skipped}`

    const runRebuild = async (force: boolean) => {
      const loadingRef = force ? forceLoading : incrementalLoading
      loadingRef.value = true
      const tip = toast.info(force ? '清空并重建索引中…' : '增量重建中…', {
        duration: 10e8,
        closeButton: true,
      })
      try {
        const result = await searchIndexApi.rebuildAll(force)
        toast.dismiss(tip)
        toast.success(formatStats(result))
      } catch (e: any) {
        toast.dismiss(tip)
        toast.error(e?.message || '重建失败')
      } finally {
        loadingRef.value = false
      }
    }

    return () => (
      <div class="rounded-md p-3">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="text-sm text-neutral-500">搜索索引</div>
            <div class="mt-1 text-xl font-semibold tabular-nums">BM25</div>
            <p class="mt-1 line-clamp-2 text-xs text-neutral-400 dark:text-neutral-500">
              按需重建 BM25 全文索引；force 选项清空后全量重建。
            </p>
          </div>
          <Icon class="mt-1 shrink-0 text-xl text-neutral-400">
            <SearchIcon />
          </Icon>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <NButton
            size="small"
            secondary
            loading={incrementalLoading.value}
            disabled={forceLoading.value}
            onClick={() => runRebuild(false)}
          >
            {{
              icon: incrementalLoading.value
                ? () => <LoaderIcon class="size-3 animate-spin" />
                : undefined,
              default: () => '增量重建',
            }}
          </NButton>
          <NPopconfirm
            positiveText="确认重建"
            negativeText="取消"
            onPositiveClick={() => runRebuild(true)}
          >
            {{
              trigger: () => (
                <NButton
                  size="small"
                  type="warning"
                  secondary
                  loading={forceLoading.value}
                  disabled={incrementalLoading.value}
                >
                  强制全量重建
                </NButton>
              ),
              default: () => (
                <div class="max-w-[20rem] text-xs leading-relaxed">
                  将清空全部索引行后重新构建，期间搜索结果可能短暂为空，确定继续？
                </div>
              ),
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})
