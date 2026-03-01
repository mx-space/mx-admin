import { BugIcon } from 'lucide-vue-next'
import { NDrawer, NDrawerContent } from 'naive-ui'
import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'

import { HeaderActionButton } from '~/components/button/header-action-button'
import { useAsyncLoadMonaco } from '~/components/monaco-editor'

export const LexicalDebugButton = defineComponent({
  props: {
    content: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const show = ref(false)

    return () => (
      <>
        <HeaderActionButton
          icon={<BugIcon />}
          variant="info"
          name="Lexical Debug"
          onClick={() => (show.value = true)}
        />

        <LexicalDebugDrawer
          show={show.value}
          onUpdateShow={(s) => (show.value = s)}
          content={props.content}
        />
      </>
    )
  },
})

const LexicalDebugDrawerContent = defineComponent({
  props: {
    content: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const htmlRef = ref<HTMLElement>()
    const formatted = computed(() => {
      try {
        return JSON.stringify(JSON.parse(props.content), null, 2)
      } catch {
        return props.content || '{}'
      }
    })

    const editor = useAsyncLoadMonaco(htmlRef, formatted, () => {}, {
      language: 'json',
      readOnly: true,
      unSaveConfirm: false,
    })

    return () => (
      <div ref={htmlRef} class="h-full min-h-[calc(100vh-100px)]">
        <editor.Snip />
      </div>
    )
  },
})

const LexicalDebugDrawer = defineComponent({
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    onUpdateShow: {
      type: Function as PropType<(s: boolean) => void>,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <NDrawer
        show={props.show}
        width={600}
        class="max-w-[90vw]"
        placement="right"
        onUpdateShow={props.onUpdateShow}
      >
        <NDrawerContent
          title="Lexical State"
          closable
          nativeScrollbar={false}
          class="h-full min-h-full"
        >
          {props.show && <LexicalDebugDrawerContent content={props.content} />}
        </NDrawerContent>
      </NDrawer>
    )
  },
})
