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
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { Checkbox } from '~/ui/primitives/checkbox'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { cn } from '~/utils/cn'
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
  const { t } = useI18n()
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
      toast.success(t('markdown.import.parseSuccess', { count: parsed.length }))
    } catch (error) {
      setParsedItems([])
      const raw =
        error instanceof Error
          ? error.message
          : t('markdown.import.parseFailed')
      const message = raw.startsWith('markdown.fileType.error:')
        ? t('markdown.fileType.error', {
            type: raw.slice('markdown.fileType.error:'.length),
          })
        : getErrorMessage(error, t('markdown.import.parseFailed'))
      toast.error(message)
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
      toast.success(
        t('markdown.import.importSuccess', { count: parsedItems.length }),
      )
      clearImport()
    } catch (error) {
      toast.error(getErrorMessage(error, t('markdown.import.importFailed')))
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
      toast.success(t('markdown.export.success'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('markdown.export.failed')))
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
            {t('markdown.subtitle')}
          </span>
        </div>
      </header>

      <Scroll
        className="min-h-0 flex-1"
        innerClassName="grid gap-6 p-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]"
      >
        <section className="bg-white dark:bg-neutral-950">
          <SectionHeader
            description={t('markdown.import.description')}
            icon={<FileUp aria-hidden="true" className="size-5" />}
            title={t('markdown.import.title')}
          />

          <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <label
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                htmlFor="markdown-import-type"
              >
                {t('markdown.import.toLabel')}
              </label>
              <SelectField
                className="w-40"
                id="markdown-import-type"
                onValueChange={setImportType}
                options={importTypeOptions.map((opt) => ({
                  label: t(opt.labelKey),
                  value: opt.value,
                }))}
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
                {t('markdown.import.dropTitle')}
              </p>
              <p className="text-xs text-neutral-500">
                {t('markdown.import.dropHint')}
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
                {t('markdown.import.parsing')}
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
                      {t('markdown.import.parsedCount', {
                        count: parsedItems.length,
                      })}
                    </span>
                  </div>
                  <Button onClick={clearImport} type="button" variant="subtle">
                    {t('markdown.import.clear')}
                  </Button>
                </div>

                <div className="overflow-hidden rounded border border-neutral-200 dark:border-neutral-800">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                      <tr>
                        <th className="px-3 py-2 font-medium">
                          {t('markdown.import.table.filename')}
                        </th>
                        <th className="px-3 py-2 font-medium">
                          {t('markdown.import.table.title')}
                        </th>
                        <th className="px-3 py-2 font-medium">
                          {t('markdown.import.table.slug')}
                        </th>
                        <th className="px-3 py-2 font-medium">
                          {t('markdown.import.table.date')}
                        </th>
                        <th className="w-16 px-3 py-2 font-medium">
                          {t('markdown.import.table.actions')}
                        </th>
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
                              aria-label={t('markdown.import.removeAria', {
                                filename: item.filename,
                              })}
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
                  <Metric
                    label={t('markdown.import.metric.files')}
                    value={parsedItems.length}
                  />
                  <Metric
                    label={t('markdown.import.metric.chars')}
                    value={totalBodyLength}
                  />
                  <Metric
                    label={t('markdown.import.metric.selected')}
                    value={files.length}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex justify-end border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <Button
                disabled={!hasParsedData || importing}
                onClick={() => {
                  if (!hasParsedData) {
                    toast.warning(t('markdown.import.parseFirst'))
                    return
                  }
                  setShowImportConfirm(true)
                }}
                type="button"
              >
                <FileText aria-hidden="true" className="size-4" />
                {t('markdown.import.submit', {
                  label: hasParsedData
                    ? t('markdown.import.submitCount', {
                        count: parsedItems.length,
                      })
                    : t('markdown.import.submitNoData'),
                })}
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-950">
          <SectionHeader
            description={t('markdown.export.description')}
            icon={<FileDown aria-hidden="true" className="size-5" />}
            title={t('markdown.export.title')}
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
                      {t(option.labelKey)}
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500">
                      {t(option.descriptionKey)}
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
                {t('markdown.export.submit')}
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
