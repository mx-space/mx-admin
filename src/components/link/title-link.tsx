import { ExternalLinkIcon } from 'components/icons'
import { IframePreviewButton } from 'components/special-button/iframe-preview'
import { WEB_URL } from 'constants/env'
import { useStoreRef } from 'hooks/use-store-ref'
import { NButton, NEllipsis, NPopover } from 'naive-ui'
import { UIStore } from 'stores/ui'
import { buildMarkdownRenderUrl } from 'utils/endpoint'
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

    xLog: {
      type: Object,
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
        {props.xLog && props.xLog.pageId && (
          <NPopover>
            {{
              default() {
                return (
                  <div class={'max-w-300px'}>
                    <p>此文章同步到 Crossbell 网络。</p>
                    <p>xLog pageId: {props.xLog!.pageId}</p>
                    {props.xLog!.relatedUrls?.map((url) => (
                      <a href={url} target="_blank">
                        {url}
                      </a>
                    ))}
                  </div>
                )
              },
              trigger() {
                return (
                  <Icon>
                    <SafeIcon />
                  </Icon>
                )
              },
            }}
          </NPopover>
        )}
      </RouterLink>
    )
  },
})

const SafeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 1024 1024"
  >
    <path
      fill="currentColor"
      d="M866.9 169.9L527.1 54.1C523 52.7 517.5 52 512 52s-11 .7-15.1 2.1L157.1 169.9c-8.3 2.8-15.1 12.4-15.1 21.2v482.4c0 8.8 5.7 20.4 12.6 25.9L499.3 968c3.5 2.7 8 4.1 12.6 4.1s9.2-1.4 12.6-4.1l344.7-268.6c6.9-5.4 12.6-17 12.6-25.9V191.1c.2-8.8-6.6-18.3-14.9-21.2zM810 654.3L512 886.5L214 654.3V226.7l298-101.6l298 101.6v427.6zm-405.8-201c-3-4.1-7.8-6.6-13-6.6H336c-6.5 0-10.3 7.4-6.5 12.7l126.4 174a16.1 16.1 0 0 0 26 0l212.6-292.7c3.8-5.3 0-12.7-6.5-12.7h-55.2c-5.1 0-10 2.5-13 6.6L468.9 542.4l-64.7-89.1z"
    ></path>
  </svg>
)
