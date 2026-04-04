import { marked } from 'marked'
import { codeToHtml } from 'shiki'
import { defineComponent, onMounted, ref, watch } from 'vue'
import xss from 'xss'

export const StreamdownBubble = defineComponent({
  name: 'StreamdownBubble',
  props: {
    content: { type: String, required: true },
    isStreaming: { type: Boolean, default: false },
  },
  setup(props) {
    const html = ref('')
    const containerRef = ref<HTMLElement>()

    async function render(text: string) {
      if (!text) {
        html.value = ''
        return
      }

      const isDark = document.documentElement.classList.contains('dark')
      const theme = isDark ? 'github-dark' : 'github-light'

      const renderer = new marked.Renderer()
      renderer.code = ({ text: code, lang }) => {
        return `<pre class="shiki-pending" data-lang="${lang || 'text'}" data-code="${encodeURIComponent(code)}"><code>${xss(code)}</code></pre>`
      }

      const parsed = await marked.parse(text, {
        gfm: true,
        breaks: true,
        renderer,
      })
      html.value = typeof parsed === 'string' ? parsed : ''

      setTimeout(async () => {
        if (!containerRef.value) return
        const pending = containerRef.value.querySelectorAll('pre.shiki-pending')
        for (const block of pending) {
          const lang = block.getAttribute('data-lang') || 'text'
          const code = decodeURIComponent(block.getAttribute('data-code') || '')
          try {
            block.outerHTML = await codeToHtml(code, { lang, theme })
          } catch {
            block.classList.remove('shiki-pending')
          }
        }
      }, 0)
    }

    onMounted(() => render(props.content))
    watch(() => props.content, render)

    return () => (
      <div
        ref={containerRef}
        class="text-sm leading-[1.75] [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs dark:[&_code]:bg-neutral-800 [&_li]:my-0.5 [&_ol]:my-1.5 [&_p]:my-1.5 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-neutral-50 [&_pre]:p-3 [&_pre]:text-xs dark:[&_pre]:bg-neutral-900 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:my-1.5"
        v-html={
          html.value +
          (props.isStreaming
            ? '<span class="inline-block w-0.5 h-4 ml-0.5 align-text-bottom bg-current animate-pulse"></span>'
            : '')
        }
      />
    )
  },
})
