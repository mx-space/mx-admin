import { Eye as EyeIcon, EyeOff as EyeOffIcon } from 'lucide-vue-next'
import { defineComponent } from 'vue'

import { Icon } from '@vicons/utils'

interface StatusToggleProps {
  isPublished: boolean
  onToggle?: (newStatus: boolean) => Promise<void> | void
  size?: 'small' | 'medium'
}

export const StatusToggle = defineComponent<StatusToggleProps>({
  name: 'StatusToggle',
  props: {
    isPublished: {
      type: Boolean,
      required: true,
    },
    onToggle: {
      type: Function,
      required: false,
    },
    size: {
      type: String,
      default: 'medium',
    },
  },
  setup(props) {
    const handleClick = async () => {
      if (!props.onToggle) {
        return
      }
      await props.onToggle(!props.isPublished)
    }

    return () => {
      const isSmall = props.size === 'small'
      const publishedStyles = {
        backgroundColor: '#e8f5e8', // 薄荷绿背景
        color: '#2d5a2d', // 深绿色文字
        border: '1px solid #c5e4c5', // 浅绿色边框
      }

      const draftStyles = {
        backgroundColor: '#fff0e6', // 桃子橙背景
        color: '#b8660a', // 深橙色文字
        border: '1px solid #ffd9b3', // 浅橙色边框
      }

      const currentStyles = props.isPublished ? publishedStyles : draftStyles

      return (
        <div
          class={`group relative inline-flex items-center justify-center gap-0.5 rounded transition-all duration-200 ${
            props.onToggle ? 'cursor-pointer hover:shadow-sm' : ''
          } ${isSmall ? 'px-1.5 py-0.5 text-xs leading-tight' : 'px-2 py-1 text-xs'}`}
          style={currentStyles}
          onClick={handleClick}
        >
          {/* 默认状态显示 */}
          <div class="flex items-center gap-0.5 transition-opacity duration-200 group-hover:opacity-0">
            <Icon size={isSmall ? 10 : 12}>
              {props.isPublished ? <EyeIcon /> : <EyeOffIcon />}
            </Icon>
            {props.isPublished ? '已发布' : '草稿'}
          </div>

          {/* hover时的切换提示 */}
          <div
            class={`absolute inset-0 flex items-center justify-center rounded bg-inherit opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
              isSmall ? 'text-xs' : 'text-xs'
            }`}
            style={currentStyles}
          >
            {props.onToggle
              ? isSmall
                ? props.isPublished
                  ? '→草稿'
                  : '→发布'
                : `切换为${props.isPublished ? '草稿' : '发布'}`
              : props.isPublished
                ? '已发布'
                : '草稿'}
          </div>
        </div>
      )
    }
  },
})
