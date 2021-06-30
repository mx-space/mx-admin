import { VditorEditor } from 'components/editor/vditor'
import { defineComponent } from 'vue'

export default defineComponent(() => {
  return () => (
    <VditorEditor
      class="h-[360px]"
      onChange={(e) => {
        console.log(e)
      }}
      text={'123'}
    />
  )
})
