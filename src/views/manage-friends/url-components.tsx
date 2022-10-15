import { NPopover } from 'naive-ui'

export const UrlComponent = defineComponent({
  props: {
    url: String,
    errorMessage: String,
    status: [String, Number],
  },
  setup(props) {
    return () => (
      <div class="flex space-x-2 items-center">
        <a target="_blank" href={props.url} rel="noreferrer">
          {props.url}
        </a>

        {typeof props.status !== 'undefined' &&
          (props.errorMessage ? (
            <NPopover>
              {{
                trigger() {
                  return <div class="h-2 w-2 bg-red-400 rounded-full"></div>
                },
                default() {
                  return props.errorMessage
                },
              }}
            </NPopover>
          ) : (
            <div class="h-2 w-2 bg-green-300 rounded-full"></div>
          ))}
      </div>
    )
  },
})
