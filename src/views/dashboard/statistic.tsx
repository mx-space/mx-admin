import { NSkeleton, NSpace, NStatistic } from 'naive-ui'
import { defineComponent } from 'vue'

export const Statistic = defineComponent({
  props: { label: String, value: [String, Number] },
  setup(props) {
    return () => {
      const value = props.value
      return (
        <Fragment>
          {props.value === 'N/A' ? (
            <NSpace vertical align="center" class="min-h-[4rem]">
              <NSkeleton style={{ height: '.8rem', width: '5rem' }} />
              <NSkeleton style={{ height: '1.8rem', width: '3rem' }} />
            </NSpace>
          ) : (
            <NStatistic
              label={props.label}
              value={
                typeof value === 'string'
                  ? value
                  : typeof value === 'undefined'
                    ? ''
                    : Intl.NumberFormat('en-us').format(value)
              }
              tabularNums
            />
          )}
        </Fragment>
      )
    }
  },
})
