import { NSkeleton, NSpace, NStatistic } from 'naive-ui'
import { defineComponent } from 'vue'

export const Statistic = defineComponent({
  props: { label: String, value: [String, Number] },
  setup(props) {
    const formatValue = (value: string | number | undefined): string => {
      if (typeof value === 'string') return value
      if (typeof value === 'undefined') return ''
      return Intl.NumberFormat('en-us').format(value)
    }

    return () => {
      if (props.value === 'N/A') {
        return (
          <NSpace vertical align="center" class="min-h-[4rem]">
            <NSkeleton style={{ height: '.8rem', width: '5rem' }} />
            <NSkeleton style={{ height: '1.8rem', width: '3rem' }} />
          </NSpace>
        )
      }

      return (
        <NStatistic
          label={props.label}
          value={formatValue(props.value)}
          tabularNums
        />
      )
    }
  },
})
