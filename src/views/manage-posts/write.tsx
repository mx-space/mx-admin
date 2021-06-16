import { MaterialInput } from 'components/input/material-input'
import { ContentLayout } from 'layouts/content'
import { defineComponent } from 'vue'

const PostWriteView = defineComponent(() => {
  return () => (
    <ContentLayout>
      <MaterialInput
        class="mt-3"
        label="想想取个什么标题好呢~"
        value=""
        onChange={() => {}}
      ></MaterialInput>
    </ContentLayout>
  )
})

export default PostWriteView
