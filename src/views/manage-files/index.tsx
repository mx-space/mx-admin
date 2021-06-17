import { ContentLayout } from 'layouts/content'
import { NH2, NLayout, NLayoutContent, NText } from 'naive-ui'
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {
    return () => (
      <ContentLayout>
        <NLayout>
          <NLayoutContent>
            <NH2>文件管理暂不开放</NH2>
            <NText>这个功能八成的废了, 做不做都行</NText>
          </NLayoutContent>
        </NLayout>
      </ContentLayout>
    )
  },
})
