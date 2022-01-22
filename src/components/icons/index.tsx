import TelegramPlane from '@vicons/fa/es/TelegramPlane'
import Add12Filled from '@vicons/fluent/es/Add12Filled'
import Delete16Regular from '@vicons/fluent/es/Delete16Regular'
export const MagnifyIcon = defineComponent({
  setup() {
    return () => (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path
          d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5l-1.5 1.5l-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16A6.5 6.5 0 0 1 3 9.5A6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14S14 12 14 9.5S12 5 9.5 5z"
          fill="currentColor"
        ></path>
      </svg>
    )
  },
})

export const AddIcon = defineComponent({
  setup() {
    return () => <Add12Filled />
  },
})

export const DeleteIcon = defineComponent({
  setup() {
    return () => <Delete16Regular />
  },
})

export const SendIcon = defineComponent({
  setup() {
    return () => <TelegramPlane />
  },
})

export const GithubIcon = defineComponent({
  setup() {
    return () => (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path
          d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
          fill="#fff"
        ></path>
      </svg>
    )
  },
})

export const MenuDownIcon = defineComponent({
  setup() {
    return () => (
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path d="M7 10l5 5l5-5H7z" fill="currentColor"></path>
      </svg>
    )
  },
})
