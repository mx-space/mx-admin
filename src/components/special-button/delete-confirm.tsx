import { HeaderActionButton } from 'components/button/rounded-button'
import { DeleteIcon } from 'components/icons'
import { useDialog, useMessage } from 'naive-ui'
import { PropType } from 'vue'

/**
 * 删除之后 onDelete 提示 `删除成功`
 */
export const DeleteConfirmButton = defineComponent({
  props: {
    checkedRowKeys: {
      type: Object as PropType<string[] | Set<string>>,
    },
    onDelete: {
      type: Function as PropType<
        (checkedRowKeys?: string[] | Set<String>) => any
      >,
      required: true,
    },

    message: { type: String },

    customIcon: {
      type: Object as PropType<JSX.Element>,
    },

    showSuccessMessage: {
      type: Boolean,
      default: true,
    },

    customSuccessMessage: {
      type: String,
    },
    customButtonTip: {
      type: String,
    },
  },
  setup(props) {
    const dialog = useDialog()
    const message = useMessage()

    return () => {
      const {
        customIcon,
        checkedRowKeys,
        onDelete,
        message: content,
        customSuccessMessage,
        showSuccessMessage,
        customButtonTip,
      } = props
      const size = !checkedRowKeys
        ? 0
        : Array.isArray(checkedRowKeys)
        ? checkedRowKeys.length
        : checkedRowKeys.size
      const disabled = !checkedRowKeys ? false : size === 0
      return (
        <HeaderActionButton
          variant="error"
          disabled={disabled}
          name={customButtonTip ?? '删除多条'}
          onClick={() => {
            dialog.warning({
              title: '警告',
              content:
                content ?? `你确定要删除${size > 1 ? '多条' : '这条'}数据？`,
              positiveText: 'はい',
              negativeText: '达咩',
              onPositiveClick: async () => {
                await onDelete(checkedRowKeys)
                showSuccessMessage &&
                  message.success(customSuccessMessage ?? '删除成功')
              },
            })
          }}
          icon={customIcon ?? <DeleteIcon />}
        />
      )
    }
  },
})
