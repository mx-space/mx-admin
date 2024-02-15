import { NPopover } from 'naive-ui'

export const UrlComponent = defineComponent({
  props: {
    url: String,
    errorMessage: String,
    status: [String, Number],
  },
  setup(props) {
    return () => (
      <div class="flex items-center space-x-2">
        <a target="_blank" href={props.url} rel="noreferrer">
          {props.url}
        </a>

        {typeof props.status !== 'undefined' &&
          (props.errorMessage ? (
            <NPopover>
              {{
                trigger() {
                  return <div class="h-2 w-2 rounded-full bg-red-400"></div>
                },
                default() {
                  return props.errorMessage
                },
              }}
            </NPopover>
          ) : (
            <div class="h-2 w-2 rounded-full bg-green-300"></div>
          ))}
      </div>
    )
  },
})
