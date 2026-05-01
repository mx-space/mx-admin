/**
 * Markdown Render Component
 * 使用 marked 渲染 markdown，shiki 高亮代码块
 */
import { marked } from 'marked'
import { codeToHtml } from 'shiki'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import xss from 'xss'

const isDarkMode = () =>
  document.documentElement.classList.contains('dark') ||
  window.matchMedia('(prefers-color-scheme: dark)').matches

export const MarkdownRender = defineComponent({
  name: 'MarkdownRender',
  props: {
    text: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const renderedHtml = ref('')
    const containerRef = ref<HTMLElement>()

    const renderMarkdown = async (text: string) => {
      if (!text) {
        renderedHtml.value = ''
        return
      }

      const isDark = isDarkMode()
      const theme = isDark ? 'github-dark' : 'github-light'

      const renderer = new marked.Renderer()

      renderer.code = ({ text: code, lang }) => {
        return `<pre class="shiki-pending" data-lang="${lang || 'text'}" data-code="${encodeURIComponent(code)}"><code>${xss(code)}</code></pre>`
      }

      const html = await marked.parse(text, {
        gfm: true,
        breaks: true,
        renderer,
      })

      renderedHtml.value = typeof html === 'string' ? html : ''

      setTimeout(async () => {
        if (!containerRef.value) return

        const pendingBlocks =
          containerRef.value.querySelectorAll('pre.shiki-pending')
        for (const block of pendingBlocks) {
          const lang = block.getAttribute('data-lang') || 'text'
          const code = decodeURIComponent(block.getAttribute('data-code') || '')

          try {
            const highlighted = await codeToHtml(code, {
              lang,
              theme,
            })
            block.outerHTML = highlighted
          } catch {
            block.classList.remove('shiki-pending')
          }
        }
      }, 0)
    }

    onMounted(() => {
      renderMarkdown(props.text)
    })

    watch(
      () => props.text,
      (text) => {
        renderMarkdown(text)
      },
    )

    const containerClass = computed(() =>
      [
        'prose prose-neutral prose-sm dark:prose-invert max-w-none',
        '[&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm [&_pre]:overflow-x-auto',
        '[&_pre]:bg-neutral-50 [&_pre]:dark:bg-neutral-900',
        '[&_code]:text-sm [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5',
        '[&_code]:bg-neutral-100 [&_code]:dark:bg-neutral-800',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
        '[&_a]:text-blue-600 [&_a]:dark:text-blue-400',
        '[&_img]:rounded-lg [&_img]:max-w-full',
        props.class,
      ]
        .filter(Boolean)
        .join(' '),
    )

    return () => (
      <div
        ref={containerRef}
        class={containerClass.value}
        v-html={renderedHtml.value}
      />
    )
  },
})
