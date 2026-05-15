import { Loader2 as LoaderIcon } from 'lucide-vue-next'
import { NButton, NInput, NSpace, useDialog } from 'naive-ui'
import { defineComponent, onBeforeUnmount, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { EnrichmentResult } from '~/models/enrichment'
import type { RecentlyModel } from '~/models/recently'
import type { PropType } from 'vue'

import { recentlyApi } from '~/api'
import { enrichmentApi } from '~/api/enrichment'
import { EnrichmentCard } from '~/components/enrichment-card'

const URL_REGEX = /https?:\/\/\S+/gi
const URL_TAIL_TRIM = /[)\].,;:!?'"`>}）。，、；：！？「」『』《》〉〕—…]+$/

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX)
  if (!matches) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (let url of matches) {
    while (URL_TAIL_TRIM.test(url)) {
      url = url.replace(URL_TAIL_TRIM, '')
    }
    if (url && !seen.has(url)) {
      seen.add(url)
      result.push(url)
    }
  }
  return result
}

function cleanErrorMessage(raw: string | null | undefined): string {
  if (!raw) return '解析失败'
  let msg = raw.replace(/https?:\/\/\S+/g, '').trim()
  if (/\(404\)|\b404\b/.test(msg)) {
    return '404 — 资源不存在，或私有内容无访问权（请检查 GitHub Token 等凭证）'
  }
  if (/\b401\b|\b403\b|unauthor|forbidden/i.test(msg)) {
    return '401/403 — 凭证缺失或权限不足'
  }
  if (/Provider disabled/i.test(msg)) {
    return '未启用对应 provider，或链接未匹配任何 provider'
  }
  if (/Token missing/i.test(msg)) {
    return '此 provider 需配置凭证（请至「第三方集成」设置）'
  }
  msg = msg.replace(/[\s—-]+$/, '').trim()
  return msg.length > 100 ? msg.slice(0, 100) + '…' : msg || '解析失败'
}

function buildPayload(text: string): { content: string } {
  return { content: text }
}

interface UrlPreviewState {
  loading: boolean
  result: EnrichmentResult | null
  error: string | null
}

const ShorthandForm = defineComponent({
  name: 'ShorthandForm',
  props: {
    initialContent: { type: String, default: '' },
    onUpdate: {
      type: Function as PropType<(text: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const text = ref(props.initialContent)
    const detectedUrls = ref<string[]>([])
    const previewStates = ref<Map<string, UrlPreviewState>>(new Map())
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let generation = 0

    const resolveUrl = (url: string, gen: number) => {
      const state: UrlPreviewState = { loading: true, result: null, error: null }
      previewStates.value = new Map(previewStates.value).set(url, state)
      enrichmentApi
        .resolve(url)
        .then((result) => {
          if (gen !== generation) return
          previewStates.value = new Map(previewStates.value).set(url, {
            loading: false,
            result,
            error: null,
          })
        })
        .catch((e: any) => {
          if (gen !== generation) return
          previewStates.value = new Map(previewStates.value).set(url, {
            loading: false,
            result: null,
            error: e?.message || '解析失败',
          })
        })
    }

    watch(
      text,
      (val) => {
        props.onUpdate(val)
        const urls = extractUrls(val)
        const prev = detectedUrls.value
        const same =
          urls.length === prev.length && urls.every((u, i) => u === prev[i])
        if (same) return

        detectedUrls.value = urls
        previewStates.value = new Map()
        if (debounceTimer) clearTimeout(debounceTimer)
        if (urls.length > 0) {
          generation++
          const gen = generation
          debounceTimer = setTimeout(() => {
            for (const url of urls) resolveUrl(url, gen)
          }, 500)
        }
      },
      { immediate: true },
    )

    onBeforeUnmount(() => {
      if (debounceTimer) clearTimeout(debounceTimer)
      generation++
    })

    return () => (
      <div class="space-y-3">
        <NInput
          type="textarea"
          value={text.value}
          onUpdateValue={(v: string | null) => (text.value = v || '')}
          placeholder="写点什么... 或粘个链接，将自动识别并预览"
          autosize={{ minRows: 4, maxRows: 12 }}
        />

        {detectedUrls.value.length > 0 && (
          <div class="space-y-2">
            {detectedUrls.value.map((url) => {
              const state = previewStates.value.get(url)
              return (
                <div key={url}>
                  <div class="mb-1.5 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>检测到链接：</span>
                    <code class="truncate rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-neutral-800">
                      {url}
                    </code>
                    {state?.loading && (
                      <LoaderIcon
                        class="size-3 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {state?.result && (
                    <EnrichmentCard enrichment={state.result} />
                  )}

                  {state?.error && !state.loading && (
                    <div class="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                      <div class="font-medium text-neutral-700 dark:text-neutral-300">
                        未识别该链接
                      </div>
                      <div class="mt-0.5">{cleanErrorMessage(state.error)}</div>
                      <div class="mt-1 text-neutral-400">
                        仍可保存，按链接处理。
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  },
})

export const useShorthand = () => {
  const modal = useDialog()
  const formText = ref('')

  const openDialog = ({
    title,
    type,
    initialContent,
    submitLabel,
    onSubmit,
  }: {
    title: string
    type: 'success' | 'info'
    initialContent: string
    submitLabel: string
    onSubmit: (
      payload: ReturnType<typeof buildPayload>,
    ) => Promise<RecentlyModel>
  }) => {
    formText.value = initialContent
    return new Promise<RecentlyModel | null>((resolve, reject) => {
      const dialog = modal.create({
        title,
        type,
        style: 'width: 600px; max-width: calc(100vw - 32px);',
        content: () => (
          <ShorthandForm
            initialContent={initialContent}
            onUpdate={(t) => (formText.value = t)}
          />
        ),
        action: () => (
          <NSpace>
            <NButton
              round
              onClick={() => {
                formText.value = ''
                void dialog.destroy()
                resolve(null)
              }}
            >
              取消
            </NButton>
            <NButton
              round
              type="primary"
              onClick={async () => {
                const text = formText.value.trim()
                if (!text) {
                  toast.error('内容不可为空')
                  return
                }
                try {
                  const res = await onSubmit(buildPayload(text))
                  formText.value = ''
                  toast.success('保存成功')
                  dialog.destroy()
                  resolve(res)
                } catch (error) {
                  reject(error)
                }
              }}
            >
              {submitLabel}
            </NButton>
          </NSpace>
        ),
      })
    })
  }

  return {
    create() {
      return openDialog({
        title: '速记',
        type: 'success',
        initialContent: '',
        submitLabel: '保存',
        onSubmit: (payload) => recentlyApi.create(payload),
      })
    },
    edit(item: RecentlyModel) {
      return openDialog({
        title: '编辑速记',
        type: 'info',
        initialContent: item.content,
        submitLabel: '保存',
        onSubmit: (payload) => recentlyApi.update(item.id, payload),
      })
    },
  }
}
