import { defineComponent } from 'vue'

import { RichEditor } from '~/components/editor/rich/RichEditor'
import { ContentLayout } from '~/layouts/content'

export default defineComponent({
  setup() {
    return () => (
      <ContentLayout>
        <RichEditor class="h-full w-full" />
      </ContentLayout>
    )
  },
})
