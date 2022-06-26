import { ExternalLinkIcon } from 'components/icons'
import { IframePreviewButton } from 'components/special-button/iframe-preview'
import { WEB_URL } from 'constants/env'
import { useStoreRef } from 'hooks/use-store-ref'
import { NButton, NEllipsis } from 'naive-ui'
import { UIStore } from 'stores/ui'
import { RESTManager, getToken } from 'utils'
import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'

import { Icon } from '@vicons/utils'

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

    const endpoint = RESTManager.endpoint
    const url = new URL(endpoint)

    const path = `${url.protocol}//${url.host}/render/markdown/${props.id}${
      props.withToken ? `?token=${getToken()}` : ''
    }`
    return () => (
      <RouterLink
        to={props.inPageTo}
        class="inline-flex items-center space-x-2"
      >
        <NEllipsis lineClamp={2} tooltip={{ width: 500 }}>
          {props.title}
        </NEllipsis>
        {slots.default?.()}
        {fullExternalLinkTo.value && (
          <NButton
            text
            tag="a"
            class="cursor-[alias]"
            // @ts-expect-error
            href={fullExternalLinkTo.value}
            target="_blank"
            type="primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon>
              <ExternalLinkIcon />
            </Icon>
          </NButton>
        )}

        {props.id && isPC.value && <IframePreviewButton path={path} />}
      </RouterLink>
    )
  },
})
