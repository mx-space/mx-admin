import { Search as MagnifyIcon } from 'lucide-vue-next'
import { NButton, NPopover } from 'naive-ui'

import { Icon } from '@vicons/utils'

import { ArticlePreview } from '~/components/preview'

export const IframePreviewButton = defineComponent({
  props: {
    path: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <NPopover placement="right" class="!p-0">
        {{
          default() {
            return <ArticlePreview url={props.path} />
          },
          trigger() {
            return (
              <NButton
                text
                type="primary"
                tag="a"
                class="cursor-pointer"
                // @ts-ignore
                target="_blank"
                // @ts-ignore
                href={props.path}
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <MagnifyIcon size={12} />
              </NButton>
            )
          },
        }}
      </NPopover>
    )
  },
})
