import { CircleCheck as CheckCircleOutlinedIcon } from 'lucide-vue-next'
import { NGi } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import { toast } from 'vue-sonner'

import { useLocalStorage } from '@vueuse/core'

import { debugApi } from '~/api'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { FunctionCodeEditor } from '~/components/monaco-editor'
import { useLayout } from '~/layouts/content'
import { TwoColGridLayout } from '~/layouts/two-col'
import { defaultServerlessFunction } from '~/models/snippet'

export default defineComponent({
  setup() {
    const value = useLocalStorage('debug-serverless', defaultServerlessFunction)
    const previewRef = ref<HTMLPreElement>()
    const errorMsg = ref('')
    const runTest = async () => {
      try {
        const res = await debugApi
          .executeFunction({
            function: value.value,
          })
          .catch((err) => {
            errorMsg.value = `Error: ${err.message || err.data?.message || 'Unknown error'}`
            toast.error(err.message || err.data?.message || 'Unknown error')
            throw err
          })

        import('monaco-editor').then((mo) => {
          mo.editor
            .colorize(JSON.stringify(res.data, null, 2), 'typescript', {
              tabSize: 2,
            })
            .then((res) => {
              previewRef.value!.innerHTML = res
            })
            .catch(() => {
              previewRef.value!.innerHTML = JSON.stringify(res, null, 2)
            })
        })
      } catch {}
    }

    const { setActions } = useLayout()
    setActions(
      <HeaderActionButton
        icon={<CheckCircleOutlinedIcon />}
        onClick={runTest}
      />,
    )

    return () => (
      <TwoColGridLayout>
        <NGi span="18">
          <div class="h-[80vh]">
            <FunctionCodeEditor value={value} onSave={runTest} />
          </div>
        </NGi>
        <NGi span="18">
          <pre
            class="max-h-[calc(100vh-10rem)] overflow-auto !bg-transparent !bg-none"
            ref={previewRef}
          >
            {errorMsg.value}
          </pre>
        </NGi>
      </TwoColGridLayout>
    )
  },
})
