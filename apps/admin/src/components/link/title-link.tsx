import {
  ExternalLink as ExternalLinkIcon,
  Sparkles as SparklesIcon,
} from 'lucide-vue-next'
import { NButton, NEllipsis } from 'naive-ui'
import { computed, defineComponent } from 'vue'
import { RouterLink } from 'vue-router'

import { IframePreviewButton } from '~/components/special-button/iframe-preview'
import { WEB_URL } from '~/constants/env'
import { useStoreRef } from '~/hooks/use-store-ref'
import { RouteName } from '~/router/name'
import { UIStore } from '~/stores/ui'
import { buildMarkdownRenderUrl } from '~/utils/endpoint'

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
    /** markdown render url query with token  */
    withToken: {
      type: Boolean,
      required: false,
    },
  },
  setup(props, { slots }) {
    const { viewport } = useStoreRef(UIStore)
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

    const path = buildMarkdownRenderUrl(props.id!, props.withToken)

    return () => (
      <RouterLink to={props.inPageTo} class="inline-flex items-center">
        <NEllipsis lineClamp={2} tooltip={{ width: 500 }}>
          {props.title}
        </NEllipsis>
        {slots.default?.()}
        {fullExternalLinkTo.value && (
          <NButton
            text
            tag="a"
            class="ml-2 flex cursor-pointer items-center"
            // @ts-expect-error
            href={fullExternalLinkTo.value}
            target="_blank"
            type="primary"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLinkIcon size={12} />
          </NButton>
        )}

        {props.id && isPC.value && (
          <div class="ml-2 flex items-center">
            <IframePreviewButton path={path} />
          </div>
        )}

        {/* AI Summary */}
        <RouterLink
          to={{
            name: RouteName.AiSummary,
            query: { refId: props.id },
          }}
          class="ml-2 flex cursor-pointer items-center"
        >
          <SparklesIcon size={12} />
        </RouterLink>
      </RouterLink>
    )
  },
})
