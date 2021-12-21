import ExternalLink from '@vicons/tabler/es/ExternalLink'
import { Icon } from '@vicons/utils'
import { Magnify } from 'components/icons/magnify'
import { ArticlePreview } from 'components/preview'
import { WEB_URL } from 'constants/env'
import { useInjector } from 'hooks/use-deps-injection'
import { NButton, NEllipsis, NPopover } from 'naive-ui'
import { UIStore } from 'stores/ui'
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
    id: {
      type: String,
      required: false,
    },
  },
  setup(props, { slots }) {
    const { viewport } = useInjector(UIStore)
    const isPC = computed(() => viewport.value.widest || viewport.value.wider)
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

        {props.id && isPC.value && (
          <NPopover placement="right">
            {{
              default() {
                return props.id && <ArticlePreview id={props.id} />
              },
              trigger() {
                return (
                  <NButton text type="primary">
                    <Magnify />
                  </NButton>
                )
              },
            }}
          </NPopover>
        )}
      </RouterLink>
    )
  },
})
