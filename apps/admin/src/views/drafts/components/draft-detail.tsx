import { defineComponent } from 'vue'
import type { DraftModel } from '~/models/draft'
import type { PropType } from 'vue'

import { DraftDetailBase } from './draft-detail-base'
import { MarkdownDiffPanel } from './markdown-diff-panel'
import { RichDiffPanel } from './rich-diff-panel'

export const DraftDetail = defineComponent({
  name: 'DraftDetail',
  props: {
    draft: {
      type: Object as PropType<DraftModel>,
      required: true,
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    onBack: {
      type: Function as PropType<() => void>,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const isLexical = () => props.draft.contentFormat === 'lexical'

    return () => (
      <DraftDetailBase
        draft={props.draft}
        isMobile={props.isMobile}
        onBack={props.onBack}
        onDelete={props.onDelete}
        diffContent={(slotProps) =>
          isLexical() &&
          slotProps.selectedRichContent &&
          slotProps.currentRichContent ? (
            <RichDiffPanel
              oldContent={slotProps.selectedRichContent}
              newContent={slotProps.currentRichContent}
            />
          ) : (
            <MarkdownDiffPanel
              oldText={slotProps.selectedText}
              newText={slotProps.currentText}
              oldVersion={slotProps.selectedVersion}
              newVersion={slotProps.currentVersion}
            />
          )
        }
      />
    )
  },
})
