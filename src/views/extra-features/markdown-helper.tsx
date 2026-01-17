import { debounce } from 'es-toolkit/compat'
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileDown,
  FileText,
  FileUp,
  Trash2,
  Upload,
} from 'lucide-vue-next'
import {
  NButton,
  NCard,
  NDataTable,
  NModal,
  NSelect,
  NSpin,
  NSwitch,
  NTag,
  NUpload,
  useMessage,
} from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import type { ParsedModel } from '~/utils/markdown-parser'
import type { DataTableColumns, UploadFileInfo } from 'naive-ui'

import { responseBlobToFile, RESTManager } from '~/utils'
import { ParseMarkdownYAML } from '~/utils/markdown-parser'

enum ImportType {
  Post = 'post',
  Note = 'note',
}

const types = [
  {
    value: ImportType.Post,
    label: '博文',
  },
  {
    label: '日记',
    value: ImportType.Note,
  },
]

interface ParsedItem extends ParsedModel {
  filename: string
}

export default defineComponent({
  name: 'MarkdownHelper',
  setup() {
    const importType = ref(ImportType.Post)
    const fileList = ref<UploadFileInfo[]>([])
    const parsedList = ref<ParsedItem[]>([])
    const parsing = ref(false)
    const importing = ref(false)
    const exporting = ref(false)
    const showImportConfirm = ref(false)

    const message = useMessage()

    // Computed
    const hasFiles = computed(() => fileList.value.length > 0)
    const hasParsedData = computed(() => parsedList.value.length > 0)

    // Parse markdown files
    function parseMarkdown(strList: string[]) {
      const parser = new ParseMarkdownYAML(strList)
      return parser.start().map((i, index) => {
        const filename = fileList.value[index].file?.name ?? ''
        const title = filename.replace(/\.md$/, '')
        if (i.meta) {
          i.meta.slug = i.meta.slug ?? title
        } else {
          i.meta = {
            title,
            slug: title,
          } as any
        }

        if (!i.meta?.date) {
          i.meta!.date = new Date().toISOString()
        }
        return i
      })
    }

    async function handleParse(e?: MouseEvent) {
      e?.preventDefault()
      e?.stopPropagation()

      if (!hasFiles.value) {
        message.warning('请先选择文件')
        return
      }

      parsing.value = true
      const strList: string[] = []

      try {
        for (const _file of fileList.value) {
          const res = await new Promise<string>((resolve, reject) => {
            const file = _file.file as File | null
            if (!file) {
              reject(new Error('文件不存在'))
              return
            }

            const ext = file.name.split('.').pop()
            if (
              (file.type && file.type !== 'text/markdown') ||
              !['md', 'markdown'].includes(ext!)
            ) {
              reject(
                new Error(
                  `只能解析 Markdown 文件，当前文件类型：${file.type || ext}`,
                ),
              )
              return
            }

            const reader = new FileReader()
            reader.addEventListener('load', (e) => {
              resolve((e.target?.result as string) || '')
            })
            reader.addEventListener('error', () => {
              reject(new Error('文件读取失败'))
            })
            reader.readAsText(file)
          })
          strList.push(res)
        }

        const parsed = parseMarkdown(strList)
        parsedList.value = parsed.map((v, index) => ({
          ...v,
          filename: fileList.value[index].file?.name ?? '',
        }))
        message.success(`成功解析 ${parsed.length} 个文件`)
      } catch (e: any) {
        message.error(e.message || '解析失败')
        console.error(e)
      } finally {
        parsing.value = false
      }
    }

    // Import data with confirmation
    function handleImportClick(e: MouseEvent) {
      e.stopPropagation()
      e.preventDefault()

      if (!hasParsedData.value) {
        message.warning('请先解析文件')
        return
      }
      showImportConfirm.value = true
    }

    async function handleImportConfirm() {
      importing.value = true
      try {
        await RESTManager.api.markdown.import.post({
          data: {
            type: importType.value,
            data: parsedList.value,
          },
        })
        message.success(`成功导入 ${parsedList.value.length} 条数据`)
        fileList.value = []
        parsedList.value = []
      } catch (e: any) {
        message.error(e.message || '导入失败')
      } finally {
        importing.value = false
        showImportConfirm.value = false
      }
    }

    // Export config
    const exportConfig = reactive({
      includeYAMLHeader: true,
      titleBigTitle: false,
      filenameSlug: false,
      withMetaJson: true,
    })

    async function handleExportMarkdown() {
      exporting.value = true
      try {
        const { includeYAMLHeader, filenameSlug, withMetaJson, titleBigTitle } =
          exportConfig
        const data = await RESTManager.api.markdown.export.get({
          params: {
            slug: filenameSlug,
            yaml: includeYAMLHeader,
            show_title: titleBigTitle,
            with_meta_json: withMetaJson,
          },
          responseType: 'blob',
        })
        responseBlobToFile(data, 'markdown.zip')
        message.success('导出成功')
      } catch (e: any) {
        message.error(e.message || '导出失败')
      } finally {
        exporting.value = false
      }
    }

    // Clear parsed data when files change
    const debouncedParse = debounce((files: UploadFileInfo[]) => {
      fileList.value = files
    }, 250)

    watch(fileList, (n) => {
      if (n.length === 0) {
        parsedList.value = []
      } else {
        handleParse()
      }
    })

    // Remove parsed item when file is removed
    function handleFileRemove(e: { file: UploadFileInfo }) {
      const name = e.file.name
      const index = parsedList.value.findIndex((i) => i.filename === name)
      if (index !== -1) {
        parsedList.value.splice(index, 1)
      }
    }

    // Table columns for parsed preview
    const previewColumns: DataTableColumns<ParsedItem> = [
      {
        title: '文件名',
        key: 'filename',
        width: 200,
        ellipsis: { tooltip: true },
      },
      {
        title: '标题',
        key: 'meta.title',
        ellipsis: { tooltip: true },
        render: (row) => row.meta?.title || '—',
      },
      {
        title: 'Slug',
        key: 'meta.slug',
        width: 150,
        ellipsis: { tooltip: true },
        render: (row) => row.meta?.slug || '—',
      },
      {
        title: '日期',
        key: 'meta.date',
        width: 180,
        render: (row) => {
          if (!row.meta?.date) return '—'
          return new Intl.DateTimeFormat('zh-CN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(row.meta.date))
        },
      },
      {
        title: '操作',
        key: 'actions',
        width: 80,
        render: (row) => (
          <NButton
            size="small"
            quaternary
            type="error"
            aria-label={`删除 ${row.filename}`}
            onClick={() => {
              const index = parsedList.value.findIndex(
                (i) => i.filename === row.filename,
              )
              if (index !== -1) {
                parsedList.value.splice(index, 1)
                const fileIndex = fileList.value.findIndex(
                  (f) => f.file?.name === row.filename,
                )
                if (fileIndex !== -1) {
                  fileList.value.splice(fileIndex, 1)
                }
              }
            }}
          >
            <Trash2 class="h-4 w-4" />
          </NButton>
        ),
      },
    ]

    // Switch options for export
    const exportOptions = [
      {
        id: 'includeYAMLHeader',
        label: '包含 YAML 头部',
        description: '在文件开头添加 Front Matter 元数据',
      },
      {
        id: 'titleBigTitle',
        label: '首行显示标题',
        description: '在正文第一行添加 # 标题',
      },
      {
        id: 'filenameSlug',
        label: '使用 Slug 作为文件名',
        description: '用 slug 而非标题命名文件',
      },
      {
        id: 'withMetaJson',
        label: '导出元数据 JSON',
        description: '附带完整的元数据 JSON 文件',
      },
    ] as const

    return () => (
      <div class="space-y-6">
        {/* Import Section */}
        <NCard
          title="从 Markdown 导入"
          class="overflow-hidden"
          headerExtra={() => (
            <div class="flex items-center gap-2">
              <FileUp class="h-5 w-5 text-neutral-400" />
            </div>
          )}
        >
          <div class="space-y-4">
            {/* Import Type Select */}
            <div class="flex items-center gap-4">
              <label
                id="import-type-label"
                class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                导入到
              </label>
              <NSelect
                options={types}
                value={importType.value}
                onUpdateValue={(e) => (importType.value = e)}
                class="w-32"
                aria-labelledby="import-type-label"
              />
            </div>

            {/* Upload Area */}
            <NUpload
              multiple
              accept=".md,.markdown"
              onChange={(e) => debouncedParse(e.fileList)}
              onRemove={handleFileRemove}
              showFileList={!hasParsedData.value}
            >
              <div class="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20">
                <Upload class="mb-3 h-10 w-10 text-neutral-400" />
                <p class="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  点击或拖拽上传 Markdown 文件
                </p>
                <p class="text-xs text-neutral-500">
                  支持 .md、.markdown 格式，可多选
                </p>
              </div>
            </NUpload>

            {/* Parsed Preview Table */}
            {hasParsedData.value && (
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <CheckCircle class="h-4 w-4 text-green-500" />
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      已解析 {parsedList.value.length} 个文件
                    </span>
                  </div>
                  <NButton
                    size="small"
                    quaternary
                    onClick={() => {
                      fileList.value = []
                      parsedList.value = []
                    }}
                  >
                    清空
                  </NButton>
                </div>

                <NDataTable
                  columns={previewColumns}
                  data={parsedList.value}
                  bordered
                  size="small"
                  maxHeight={300}
                  scrollX={700}
                />
              </div>
            )}

            {/* Parsing indicator */}
            {parsing.value && (
              <div class="flex items-center justify-center py-4">
                <NSpin size="small" />
                <span class="ml-2 text-sm text-neutral-500">解析中…</span>
              </div>
            )}

            {/* Actions */}
            <div class="flex justify-end gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <NButton
                onClick={handleImportClick}
                type="primary"
                disabled={!hasParsedData.value || importing.value}
                loading={importing.value}
                renderIcon={() => <FileText class="h-4 w-4" />}
              >
                导入{' '}
                {hasParsedData.value
                  ? `${parsedList.value.length} 条数据`
                  : '数据'}
              </NButton>
            </div>
          </div>
        </NCard>

        {/* Export Section */}
        <NCard
          title="导出为 Markdown"
          class="overflow-hidden"
          headerExtra={() => (
            <div class="flex items-center gap-2">
              <FileDown class="h-5 w-5 text-neutral-400" />
            </div>
          )}
        >
          <div class="space-y-4">
            <p class="text-sm text-neutral-500">
              导出所有博文和日记为 Markdown 文件（Hexo YAML 格式）
            </p>

            {/* Export Options */}
            <div class="grid gap-3 sm:grid-cols-2">
              {exportOptions.map((option) => (
                <label
                  key={option.id}
                  class="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <NSwitch
                    value={exportConfig[option.id]}
                    onUpdateValue={(e) => (exportConfig[option.id] = e)}
                    aria-describedby={`${option.id}-desc`}
                  />
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {option.label}
                    </div>
                    <div
                      id={`${option.id}-desc`}
                      class="text-xs text-neutral-500"
                    >
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Export Action */}
            <div class="flex justify-end border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <NButton
                type="primary"
                onClick={handleExportMarkdown}
                loading={exporting.value}
                disabled={exporting.value}
                renderIcon={() => <Download class="h-4 w-4" />}
              >
                导出 Markdown 压缩包
              </NButton>
            </div>
          </div>
        </NCard>

        {/* Import Confirmation Modal */}
        <NModal
          show={showImportConfirm.value}
          onUpdateShow={(v) => (showImportConfirm.value = v)}
          preset="card"
          title="确认导入"
          style={{ width: '400px', maxWidth: '90vw' }}
        >
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <AlertCircle class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
              <div>
                <p class="text-sm text-neutral-700 dark:text-neutral-300">
                  即将导入 <strong>{parsedList.value.length}</strong> 条数据到
                  <NTag size="small" class="mx-1">
                    {importType.value === ImportType.Post ? '博文' : '日记'}
                  </NTag>
                </p>
                <p class="mt-1 text-xs text-neutral-500">
                  此操作会创建新的内容，请确认数据无误
                </p>
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <NButton onClick={() => (showImportConfirm.value = false)}>
                取消
              </NButton>
              <NButton
                type="primary"
                onClick={handleImportConfirm}
                loading={importing.value}
              >
                确认导入
              </NButton>
            </div>
          </div>
        </NModal>
      </div>
    )
  },
})
