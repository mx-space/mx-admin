import { ImportType } from './types/markdown'

export const importTypeOptions = [
  { label: '博文', value: ImportType.Post },
  { label: '日记', value: ImportType.Note },
]

export const exportOptions = [
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
