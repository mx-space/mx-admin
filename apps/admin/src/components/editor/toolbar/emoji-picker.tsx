import { Picker } from 'emoji-mart'
import { defineComponent, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'

import data from '@emoji-mart/data'

import { useUIStore } from '~/stores/ui'

export const EmojiPicker = defineComponent({
  name: 'EmojiPicker',
  props: {
    onSelect: {
      type: Function as PropType<(emoji: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const pickerRef = ref<HTMLDivElement>()
    const uiStore = useUIStore()

    const getTheme = () => (uiStore.isDark ? 'dark' : 'light')

    onMounted(() => {
      if (!pickerRef.value) return

      const picker = new Picker({
        data,
        onEmojiSelect: (emoji: any) => {
          props.onSelect(emoji.native)
        },
        locale: 'zh',
        theme: getTheme(),
        previewPosition: 'none',
        skinTonePosition: 'search',
        maxFrequentRows: 2,
        perLine: 8,
      })

      pickerRef.value.appendChild(picker as unknown as Node)

      watch(
        () => uiStore.isDark,
        (isDark) => {
          const em = pickerRef.value?.querySelector('em-emoji-picker')
          if (em) {
            em.setAttribute('theme', isDark ? 'dark' : 'light')
          }
        },
      )
    })

    return () => <div ref={pickerRef} class="emoji-mart-container" />
  },
})
