import { Dialog } from '@base-ui/react/dialog'
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileDown,
  FileText,
  FileUp,
  Trash2,
  Upload,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { ChangeEvent, ReactNode } from 'react'

import { ParseMarkdownYAML } from '~/app/utils/markdown-parser'

import { exportMarkdown, importMarkdown } from '../api/markdown'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../ui/cn'
import { SelectField } from '../ui/select'

enum ImportType {
  Note = 'note',
  Post = 'post',
}

interface ParsedItem {
  filename: string
  meta?: {
    categories?: string[]
    date?: string
    slug?: string
    tags?: string[]
    title?: string
    updated?: string
  }
  text: string
}

const importTypeOptions = [
  { label: '博文', value: ImportType.Post },
  { label: '日记', value: ImportType.Note },
]

const exportOptions = [
  {
    description: '在文件开头添加 Front Matter 元数据',
    id: 'includeYAMLHeader',
    label: '包含 YAML 头部',
  },
  {
    description: '在正文第一行添加 # 标题',
    id: 'titleBigTitle',
    label: '首行显示标题',
  },
  {
    description: '用 slug 而非标题命名文件',
    id: 'filenameSlug',
    label: '使用 Slug 作为文件名',
  },
  {
    description: '附带完整的元数据 JSON 文件',
    id: 'withMetaJson',
    label: '导出元数据 JSON',
  },
] as const

type ExportOptionId = (typeof exportOptions)[number]['id']
type ExportConfig = Record<ExportOptionId, boolean>

export function MarkdownPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importType, setImportType] = useState(ImportType.Post)
  const [files, setFiles] = useState<File[]>([])
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    filenameSlug: false,
    includeYAMLHeader: true,
    titleBigTitle: false,
    withMetaJson: true,
  })

  const hasParsedData = parsedItems.length > 0
  const totalBodyLength = useMemo(
    () => parsedItems.reduce((total, item) => total + item.text.length, 0),
    [parsedItems],
  )

  const handleFiles = async (nextFiles: File[]) => {
    if (nextFiles.length === 0) return

    setFiles(nextFiles)
    setParsing(true)

    try {
      const contents = await Promise.all(nextFiles.map(readMarkdownFile))
      const parser = new ParseMarkdownYAML(contents)
      const parsed = parser.start().map((item, index) => {
        const filename = nextFiles[index].name
        const title = filename.replace(/\.md(?:own)?$/i, '')
        const meta = {
          ...item.meta,
          date: item.meta?.date ?? new Date().toISOString(),
          slug: item.meta?.slug ?? title,
          title: item.meta?.title ?? title,
        }

        return {
          ...item,
          filename,
          meta,
        }
      })

      setParsedItems(parsed)
      toast.success(`成功解析 ${parsed.length} 个文件`)
    } catch (error) {
      setParsedItems([])
      toast.error(getErrorMessage(error, '解析失败'))
    } finally {
      setParsing(false)
    }
  }

  const removeParsedItem = (filename: string) => {
    setParsedItems((current) =>
      current.filter((item) => item.filename !== filename),
    )
    setFiles((current) => current.filter((file) => file.name !== filename))
  }

  const clearImport = () => {
    setFiles([])
    setParsedItems([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const confirmImport = async () => {
    setImporting(true)
    try {
      await importMarkdown({
        data: parsedItems,
        type: importType,
      })
      toast.success(`成功导入 ${parsedItems.length} 条数据`)
      clearImport()
    } catch (error) {
      toast.error(getErrorMessage(error, '导入失败'))
    } finally {
      setImporting(false)
      setShowImportConfirm(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportMarkdown({
        show_title: exportConfig.titleBigTitle,
        slug: exportConfig.filenameSlug,
        with_meta_json: exportConfig.withMetaJson,
        yaml: exportConfig.includeYAMLHeader,
      })
      saveBlob(blob, 'markdown.zip')
      toast.success('导出成功')
    } catch (error) {
      toast.error(getErrorMessage(error, '导出失败'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
      <section className="rounded border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <Header
          description="解析本地 Markdown 文件并导入为博文或日记。"
          icon={<FileUp aria-hidden="true" className="size-5" />}
          title="从 Markdown 导入"
        />

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <label
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              htmlFor="markdown-import-type"
            >
              导入到
            </label>
            <SelectField
              className="w-40"
              id="markdown-import-type"
              onValueChange={setImportType}
              options={importTypeOptions}
              value={importType}
            />
          </div>

          <div
            className={cn(
              'flex min-h-44 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center transition-colors dark:border-neutral-700 dark:bg-neutral-900/40',
              dragActive &&
                'border-blue-400 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/30',
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setDragActive(false)
              void handleFiles(Array.from(event.dataTransfer.files))
            }}
            role="button"
            tabIndex={0}
          >
            <Upload
              aria-hidden="true"
              className="mb-3 size-10 text-neutral-400"
            />
            <p className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              点击或拖拽上传 Markdown 文件
            </p>
            <p className="text-xs text-neutral-500">
              支持 .md、.markdown 格式，可多选
            </p>
            <input
              accept=".md,.markdown"
              className="hidden"
              multiple
              onChange={(event) => {
                void handleFileInputChange(event, handleFiles)
              }}
              ref={fileInputRef}
              type="file"
            />
          </div>

          {parsing ? (
            <div className="flex items-center justify-center rounded border border-neutral-200 py-4 text-sm text-neutral-500 dark:border-neutral-800">
              <span className="mr-2 size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100" />
              解析中…
            </div>
          ) : null}

          {hasParsedData ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    aria-hidden="true"
                    className="size-4 text-emerald-500"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    已解析 {parsedItems.length} 个文件
                  </span>
                </div>
                <Button onClick={clearImport} type="button" variant="subtle">
                  清空
                </Button>
              </div>

              <div className="overflow-hidden rounded border border-neutral-200 dark:border-neutral-800">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">文件名</th>
                      <th className="px-3 py-2 font-medium">标题</th>
                      <th className="px-3 py-2 font-medium">Slug</th>
                      <th className="px-3 py-2 font-medium">日期</th>
                      <th className="w-16 px-3 py-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {parsedItems.map((item) => (
                      <tr key={item.filename}>
                        <td className="max-w-48 truncate px-3 py-2">
                          {item.filename}
                        </td>
                        <td className="max-w-56 truncate px-3 py-2">
                          {item.meta?.title || '-'}
                        </td>
                        <td className="max-w-40 truncate px-3 py-2 font-mono text-xs">
                          {item.meta?.slug || '-'}
                        </td>
                        <td className="px-3 py-2 text-xs text-neutral-500">
                          {item.meta?.date
                            ? formatDateTime(item.meta.date)
                            : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            aria-label={`删除 ${item.filename}`}
                            className="h-8 px-2 text-red-600 dark:text-red-400"
                            onClick={() => removeParsedItem(item.filename)}
                            type="button"
                            variant="subtle"
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                <Metric label="文件" value={parsedItems.length} />
                <Metric label="正文字符" value={totalBodyLength} />
                <Metric label="已选文件" value={files.length} />
              </div>
            </div>
          ) : null}

          <div className="flex justify-end border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button
              disabled={!hasParsedData || importing}
              onClick={() => {
                if (!hasParsedData) {
                  toast.warning('请先解析文件')
                  return
                }
                setShowImportConfirm(true)
              }}
              type="button"
            >
              <FileText aria-hidden="true" className="size-4" />
              导入 {hasParsedData ? `${parsedItems.length} 条数据` : '数据'}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <Header
          description="导出所有博文和日记为 Hexo YAML 风格 Markdown 压缩包。"
          icon={<FileDown aria-hidden="true" className="size-5" />}
          title="导出为 Markdown"
        />

        <div className="space-y-5 p-5">
          <div className="grid gap-3">
            {exportOptions.map((option) => (
              <label
                className="flex cursor-pointer items-start gap-3 rounded border border-neutral-200 p-3 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                key={option.id}
              >
                <Checkbox
                  checked={exportConfig[option.id]}
                  className="mt-1"
                  onCheckedChange={(checked) =>
                    setExportConfig((current) => ({
                      ...current,
                      [option.id]: checked,
                    }))
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs text-neutral-500">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-end border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button
              disabled={exporting}
              onClick={() => {
                void handleExport()
              }}
              type="button"
            >
              <Download aria-hidden="true" className="size-4" />
              导出 Markdown 压缩包
            </Button>
          </div>
        </div>
      </section>

      {showImportConfirm ? (
        <Dialog.Root
          onOpenChange={(open) => {
            if (!open) setShowImportConfirm(false)
          }}
          open
        >
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
            <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white shadow-xl outline-none dark:border-neutral-800 dark:bg-neutral-950">
              <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
                <Dialog.Title className="text-sm font-semibold">
                  确认导入
                </Dialog.Title>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-amber-500"
                  />
                  <div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      即将导入{' '}
                      <strong className="tabular-nums">
                        {parsedItems.length}
                      </strong>{' '}
                      条数据到{' '}
                      <span className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs dark:border-neutral-800 dark:bg-neutral-900">
                        {importType === ImportType.Post ? '博文' : '日记'}
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                      此操作会创建新的内容，请确认数据无误。
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => setShowImportConfirm(false)}
                    type="button"
                    variant="subtle"
                  >
                    取消
                  </Button>
                  <Button
                    disabled={importing}
                    onClick={() => {
                      void confirmImport()
                    }}
                    type="button"
                  >
                    确认导入
                  </Button>
                </div>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
    </div>
  )
}

function Header(props: {
  description: string
  icon: ReactNode
  title: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
      <div>
        <h2 className="text-sm font-semibold">{props.title}</h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {props.description}
        </p>
      </div>
      <div className="text-neutral-400">{props.icon}</div>
    </div>
  )
}

function Metric(props: { label: string; value: number }) {
  return (
    <div className="rounded border border-neutral-200 px-3 py-2 dark:border-neutral-800">
      <div className="text-xs text-neutral-500">{props.label}</div>
      <div className="mt-1 text-sm font-medium tabular-nums text-neutral-950 dark:text-neutral-50">
        {props.value}
      </div>
    </div>
  )
}

async function handleFileInputChange(
  event: ChangeEvent<HTMLInputElement>,
  handleFiles: (files: File[]) => Promise<void>,
) {
  await handleFiles(Array.from(event.target.files ?? []))
}

async function readMarkdownFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (
    (file.type && file.type !== 'text/markdown') ||
    !['md', 'markdown'].includes(ext ?? '')
  ) {
    throw new Error(`只能解析 Markdown 文件，当前文件类型：${file.type || ext}`)
  }

  return file.text()
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}
