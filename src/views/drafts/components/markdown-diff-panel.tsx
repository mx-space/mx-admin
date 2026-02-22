import { defineComponent } from 'vue'

import { DiffPreview } from '~/components/draft/diff-preview'

export const MarkdownDiffPanel = defineComponent({
  name: 'MarkdownDiffPanel',
  props: {
    oldText: { type: String, required: true },
    newText: { type: String, required: true },
    oldVersion: { type: Number, required: true },
    newVersion: { type: Number, required: true },
  },
  setup(props) {
    return () => (
      <DiffPreview
        oldFile={{
          name: `v${props.oldVersion}.md`,
          contents: props.oldText,
        }}
        newFile={{
          name: `v${props.newVersion}.md`,
          contents: props.newText,
        }}
      />
    )
  },
})
