import { MagnifyIcon } from 'components/icons'
import { ArticlePreview } from 'components/preview'
import { NButton, NPopover } from 'naive-ui'

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
                // @ts-ignore
                target="_blank"
                // @ts-ignore
                href={props.path}
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <MagnifyIcon />
              </NButton>
            )
          },
        }}
      </NPopover>
    )
  },
})
