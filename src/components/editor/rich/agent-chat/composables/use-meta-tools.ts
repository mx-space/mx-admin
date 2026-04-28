import type {
  AgentToolConfig,
  AgentToolResult,
  ChatMessage,
} from '@haklex/rich-agent-core'

export interface MetaFieldDescriptor {
  description: string
  type?: 'string' | 'number' | 'boolean' | 'string[]' | 'object'
  enum?: readonly string[]
  example?: unknown
}

export type MetaFieldsSchema = Record<string, MetaFieldDescriptor>

export interface BuildMetaToolsOptions {
  schema: MetaFieldsSchema
  getFields: () => Record<string, unknown>
  setFields: (updates: Record<string, unknown>) => void | Promise<void>
}

const READ_TOOL = 'read_document_meta'
const UPDATE_TOOL = 'update_document_meta'

function jsonContent(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function toError(error: string, message: string): AgentToolResult {
  return { ok: false, error: { error, message } as any }
}

export function buildMetaTools({
  schema,
  getFields,
  setFields,
}: BuildMetaToolsOptions): AgentToolConfig[] {
  const allowedKeys = Object.keys(schema)

  return [
    {
      name: READ_TOOL,
      description:
        '读取当前文档除正文以外的元数据字段（标题、slug、标签、分类等）。可指定 keys 过滤；省略 keys 时返回全部字段。',
      parameters: {
        type: 'object',
        properties: {
          keys: {
            type: 'array',
            items: { type: 'string', enum: allowedKeys },
            description: `要读取的字段 key 数组。允许：${allowedKeys.join(', ')}。不传或空数组表示返回全部字段。`,
          },
        },
        additionalProperties: false,
      },
      execute: async (params: unknown): Promise<AgentToolResult> => {
        const all = getFields()
        const requested = (() => {
          const k = (params as any)?.keys
          if (Array.isArray(k) && k.length > 0) return k as string[]
          return Object.keys(all)
        })()
        const data: Record<string, unknown> = {}
        const unknownKeys: string[] = []
        for (const k of requested) {
          if (k in all) data[k] = all[k]
          else unknownKeys.push(k)
        }
        return {
          ok: true,
          content: jsonContent({
            fields: data,
            ...(unknownKeys.length > 0 ? { unknownKeys } : {}),
          }),
        }
      },
      describeCall: (params: unknown) => {
        const keys = (params as any)?.keys
        return Array.isArray(keys) && keys.length > 0
          ? `${READ_TOOL}(${keys.join(', ')})`
          : `${READ_TOOL}(*)`
      },
    },
    {
      name: UPDATE_TOOL,
      description:
        '更新当前文档的元数据字段。以 key-value 对象传入，仅传需要修改的字段；未列出的字段保持不变。',
      parameters: {
        type: 'object',
        properties: {
          updates: {
            type: 'object',
            description: `要写入的字段 key-value 映射。允许字段：${allowedKeys.join(', ')}。`,
            additionalProperties: true,
          },
        },
        required: ['updates'],
        additionalProperties: false,
      },
      execute: async (params: unknown): Promise<AgentToolResult> => {
        const updates = (params as any)?.updates
        if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
          return toError('invalid_params', 'updates 必须为对象')
        }

        const accepted: Record<string, unknown> = {}
        const ignored: string[] = []
        for (const [k, v] of Object.entries(updates)) {
          if (k in schema) accepted[k] = v
          else ignored.push(k)
        }

        if (Object.keys(accepted).length === 0) {
          return toError(
            'no_writable_field',
            `无可写字段。允许：${allowedKeys.join(', ')}；已忽略：${ignored.join(', ') || '(空)'}`,
          )
        }

        try {
          await setFields(accepted)
        } catch (err) {
          return toError(
            'apply_failed',
            err instanceof Error ? err.message : String(err),
          )
        }

        return {
          ok: true,
          content: jsonContent({
            applied: accepted,
            ...(ignored.length > 0 ? { ignored } : {}),
          }),
        }
      },
      describeCall: (params: unknown) => {
        const updates = (params as any)?.updates ?? {}
        return `${UPDATE_TOOL}(${Object.keys(updates).join(', ') || '(空)'})`
      },
    },
  ]
}

export function buildMetaSystemMessages(
  schema: MetaFieldsSchema,
): ChatMessage[] {
  const keys = Object.keys(schema)
  if (keys.length === 0) return []

  const lines = keys.map((key) => {
    const desc = schema[key]
    const type = desc.type ? ` <${desc.type}>` : ''
    const enums = desc.enum?.length
      ? `（可选值：${desc.enum.join(' / ')}）`
      : ''
    const example =
      desc.example !== undefined ? `（示例：${jsonContent(desc.example)}）` : ''
    return `- \`${key}\`${type}: ${desc.description}${enums}${example}`
  })

  const content = [
    '当前文档除正文外还包含以下表单元数据字段，可通过工具读写：',
    ...lines,
    '',
    '工具调用规则：',
    `- \`${READ_TOOL}\`：读取字段。可传 keys 过滤，省略则返回全部。`,
    `- \`${UPDATE_TOOL}\`：以 \`{ updates: { key: value } }\` 形式写入；未列出的字段保持不变。`,
    '- 不确定当前值时，先读后写。',
    '- 仅在用户明确要求或正文修改自然涉及（如生成 slug/摘要）时才修改字段；不要主动改动 tags、分类等。',
  ].join('\n')

  return [{ role: 'system', content }]
}
