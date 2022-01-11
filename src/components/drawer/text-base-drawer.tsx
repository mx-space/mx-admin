import { NDrawer, NDrawerContent, NForm, NFormItem, NSwitch } from 'naive-ui'
import { PropType } from 'vue'

export const TextBaseDrawer = defineComponent({
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    onUpdateShow: {
      type: Function as PropType<(s: boolean) => void>,
      required: true,
    },
    data: {
      type: Object as PropType<any>,
      required: true,
    },
  },
  setup(props, { slots }) {
    return () => (
      <NDrawer
        show={props.show}
        width={450}
        class="max-w-[90vw]"
        placement="right"
        onUpdateShow={props.onUpdateShow}
      >
        <NDrawerContent title="文章设定">
          <NForm>
            {slots.default?.()}
            <NFormItem
              label="允许评论"
              labelWidth={100}
              labelAlign="right"
              labelPlacement="left"
            >
              <NSwitch
                value={props.data.allowComment}
                onUpdateValue={(e) => void (props.data.allowComment = e)}
              />
            </NFormItem>
          </NForm>
        </NDrawerContent>
      </NDrawer>
    )
  },
})
