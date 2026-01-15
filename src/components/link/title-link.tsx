import { ExternalLink as ExternalLinkIcon } from 'lucide-vue-next'
import { NButton, NEllipsis, NPopover } from 'naive-ui'
import { defineComponent } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { Icon } from '@vicons/utils'

import { IframePreviewButton } from '~/components/special-button/iframe-preview'
import { WEB_URL } from '~/constants/env'
import { useStoreRef } from '~/hooks/use-store-ref'
import { RouteName } from '~/router/name'
import { UIStore } from '~/stores/ui'
import { getToken } from '~/utils'
import { buildMarkdownRenderUrl } from '~/utils/endpoint'

const OpenAIIcon = () => (
  <svg
    role="img"
    height="1em"
    width="1em"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
)

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

    const _router = useRouter()
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
            href={
              fullExternalLinkTo.value +
              (props.withToken ? `?token=${getToken()}` : '')
            }
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
                      <p key={url}>
                        <a href={url} target="_blank" rel="noreferrer">
                          {url}
                        </a>
                      </p>
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

        {/* AI Summary */}

        <RouterLink
          to={{
            name: RouteName.AiSummary,
            query: { refId: props.id },
          }}
          class={'flex items-center'}
        >
          <Icon>
            <OpenAIIcon />
          </Icon>
        </RouterLink>
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
    />
  </svg>
)
