import {
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
import type { ParsedItem } from '../types/markdown'

import { exportMarkdown, importMarkdown } from '~/api/markdown'
import { Button } from '~/ui/button'
import { Checkbox } from '~/ui/checkbox'
import { cn } from '~/ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/ui/layout'
import { Scroll } from '~/ui/scroll'
import { SelectField } from '~/ui/select'
import { ParseMarkdownYAML } from '~/utils/markdown-parser'

import { exportOptions, importTypeOptions } from '../constants'
import { ExportConfig, ImportType } from '../types/markdown'
import {
  handleFileInputChange,
  readMarkdownFile,
  saveBlob,
} from '../utils/files'
import { formatDateTime, getErrorMessage } from '../utils/format'
import { ImportConfirmDialog } from './ImportConfirmDialog'
import { Metric } from './Metric'
import { SectionHeader } from './SectionHeader'

export function MarkdownRouteViewContent() {
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
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <header
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">
            <FileDown aria-hidden="true" className="size-4" />
            Markdown
          </h2>
          <span className="ml-3 text-xs text-neutral-500 dark:text-neutral-400">
            导入与导出内容
          </span>
        </div>
      </header>

      <Scroll
        className="min-h-0 flex-1"
        innerClassName="grid gap-6 p-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]"
      >
        <section className="bg-white dark:bg-neutral-950">
          <SectionHeader
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

        <section className="bg-white dark:bg-neutral-950">
          <SectionHeader
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
          <ImportConfirmDialog
            importing={importing}
            importType={importType}
            itemCount={parsedItems.length}
            onClose={() => setShowImportConfirm(false)}
            onConfirm={() => {
              void confirmImport()
            }}
          />
        ) : null}
      </Scroll>
    </section>
  )
}
