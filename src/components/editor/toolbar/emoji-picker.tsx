import { NScrollbar } from 'naive-ui'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'

const EMOJI_GROUPS = {
  常用: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😝',
    '😜',
    '🤪',
    '🤨',
    '🧐',
    '🤓',
  ],
  手势: [
    '👍',
    '👎',
    '👌',
    '✌️',
    '🤞',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
    '👆',
    '👇',
    '☝️',
    '👏',
    '🙌',
    '👐',
    '🤲',
    '🤝',
    '🙏',
  ],
  动物: [
    '🐶',
    '🐱',
    '🐭',
    '🐹',
    '🐰',
    '🦊',
    '🐻',
    '🐼',
    '🐨',
    '🐯',
    '🦁',
    '🐮',
    '🐷',
    '🐸',
    '🐵',
    '🐔',
    '🐧',
    '🐦',
    '🐤',
    '🦆',
    '🦅',
    '🦉',
    '🦇',
    '🐺',
    '🐗',
  ],
  自然: [
    '🌸',
    '🌺',
    '🌻',
    '🌷',
    '🌹',
    '🥀',
    '🌼',
    '🌱',
    '🌿',
    '🍀',
    '🍃',
    '🍂',
    '🍁',
    '🌾',
    '🌵',
    '🌴',
    '🌳',
    '🌲',
    '☘️',
    '🎋',
    '🎍',
    '🌾',
  ],
  食物: [
    '🍎',
    '🍊',
    '🍋',
    '🍌',
    '🍉',
    '🍇',
    '🍓',
    '🍈',
    '🍒',
    '🍑',
    '🥭',
    '🍍',
    '🥥',
    '🥝',
    '🍅',
    '🥑',
    '🍆',
    '🌽',
    '🌶️',
    '🥒',
    '🥬',
    '🥦',
    '🍄',
    '🥜',
    '🌰',
  ],
  活动: [
    '⚽',
    '🏀',
    '🏈',
    '⚾',
    '🥎',
    '🎾',
    '🏐',
    '🏉',
    '🥏',
    '🎱',
    '🏓',
    '🏸',
    '🏒',
    '🏑',
    '🥍',
    '🏏',
    '🥅',
    '⛳',
    '🏹',
    '🎣',
    '🤿',
    '🥊',
    '🥋',
    '🎽',
    '🛹',
  ],
  物品: [
    '⌚',
    '📱',
    '💻',
    '⌨️',
    '🖥️',
    '🖨️',
    '🖱️',
    '💾',
    '💿',
    '📀',
    '📷',
    '📹',
    '🎥',
    '📞',
    '☎️',
    '📟',
    '📠',
    '📺',
    '📻',
    '🎙️',
    '🎚️',
    '🎛️',
    '⏱️',
    '⏰',
    '⏲️',
  ],
  符号: [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❣️',
    '💕',
    '💞',
    '💓',
    '💗',
    '💖',
    '💘',
    '💝',
    '✨',
    '⭐',
    '🌟',
    '💫',
    '✔️',
    '❌',
    '⚠️',
  ],
}

export const EmojiPicker = defineComponent({
  name: 'EmojiPicker',
  props: {
    onSelect: {
      type: Function as PropType<(emoji: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const handleEmojiClick = (emoji: string) => {
      props.onSelect(emoji)
    }

    return () => (
      <div class="emoji-picker max-h-96 w-80 rounded-lg bg-white shadow-lg dark:bg-neutral-800">
        <NScrollbar style={{ maxHeight: '24rem' }}>
          <div class="p-3">
            {Object.entries(EMOJI_GROUPS).map(([groupName, emojis]) => (
              <div key={groupName} class="mb-4">
                <div class="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {groupName}
                </div>
                <div class="grid grid-cols-8 gap-1">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      class="emoji-button flex h-8 w-8 cursor-pointer items-center justify-center rounded text-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </NScrollbar>

        <style>
          {`
          .emoji-button {
            border: none;
            background: transparent;
            user-select: none;
          }
          .emoji-button:active {
            transform: scale(0.95);
          }
          `}
        </style>
      </div>
    )
  },
})
