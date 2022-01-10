import { NSkeleton, NSpace, NStatistic } from 'naive-ui'
import { defineComponent } from 'vue'

export const Statistic = defineComponent({
  props: { label: String, value: [String, Number] },
  setup(props) {
    return () => (
      <Fragment>
        {props.value === 'N/A' ? (
          <NSpace vertical align="center" class="min-h-[4rem]">
            <NSkeleton style={{ height: '.8rem', width: '5rem' }}></NSkeleton>
            <NSkeleton style={{ height: '1.8rem', width: '3rem' }}></NSkeleton>
          </NSpace>
        ) : (
          <NStatistic label={props.label} value={props.value}></NStatistic>
        )}
      </Fragment>
    )
  },
})
