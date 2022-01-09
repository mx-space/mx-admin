import { NGrid } from 'naive-ui'

export const TwoColGridLayout = defineComponent({
  setup(props, { slots }) {
    return () => (
      <NGrid cols={'36 1:12 1024:36 1600:36'} xGap={24}>
        {slots?.default?.()}
      </NGrid>
    )
  },
})
