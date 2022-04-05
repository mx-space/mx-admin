import { ContentLayout } from 'layouts/content'
import { NTabPane, NTabs } from 'naive-ui'

import { EmailTab } from './tabs/email'
import { MarkdownTab } from './tabs/markdown'

export default defineComponent({
  setup() {
    const tab = ref('1')
    return () => (
      <ContentLayout>
        <NTabs
          value={tab.value}
          size="medium"
          onUpdateValue={(tabvalue) => {
            tab.value = tabvalue
          }}
        >
          <NTabPane name="1" tab="评论邮件模板">
            <EmailTab />
          </NTabPane>
          <NTabPane name="2" tab="预览 Markdown 模板">
            <MarkdownTab />
          </NTabPane>
        </NTabs>
      </ContentLayout>
    )
  },
})
