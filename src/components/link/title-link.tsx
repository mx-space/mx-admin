import ExternalLink from '@vicons/tabler/es/ExternalLink'
import { Icon } from '@vicons/utils'
import { WEB_URL } from 'constants/env'
import { NButton, NEllipsis } from 'naive-ui'
import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'

export const TableTitleLink = defineComponent({
  props: {
    inPageTo: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    externalLinkTo: {
      type: String,
      required: false,
    },
  },
  setup(props, { slots }) {
    const fullExternalLinkTo = computed(() => {
      if (!props.externalLinkTo) {
        return null
      }
      try {
        const url = new URL(
          props.externalLinkTo,
          props.externalLinkTo.startsWith('/') ? WEB_URL : undefined,
        )
        return url.toString()
      } catch {
        return null
      }
    })
    return () => (
      <RouterLink to={props.inPageTo} class="flex items-center space-x-2">
        <NEllipsis lineClamp={2} tooltip={{ width: 500 }}>
          {props.title}
        </NEllipsis>
        {slots.default?.()}
        {fullExternalLinkTo.value && (
          <NButton
            text
            tag="a"
            style={{ cursor: 'alias' }}
            // @ts-expect-error
            href={fullExternalLinkTo.value}
            target="_blank"
            type="primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon>
              <ExternalLink />
            </Icon>
          </NButton>
        )}
      </RouterLink>
    )
  },
})
