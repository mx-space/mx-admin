import type { PopoverTrigger } from 'naive-ui'
import { NPopover } from 'naive-ui'
import { RESTManager } from 'utils'
import type { PropType } from 'vue'
import { defineComponent, ref } from 'vue'

const ipLocationCacheMap = new Map<string, IP>()

export const IpInfoPopover = defineComponent({
  props: {
    ip: {
      type: String,
      required: true,
    },
    triggerEl: {
      type: [Object, Function] as PropType<(() => JSX.Element) | JSX.Element>,
      required: true,
    },
    trigger: {
      type: String as PropType<PopoverTrigger>,
      default: 'click',
    },
  },
  setup(props) {
    const ipInfoText = ref('获取中..')
    const setIpInfoText = (info: IP) => {
      ipInfoText.value = `IP: ${info.ip}<br />
      城市: ${
        [info.countryName, info.regionName, info.cityName]
          .filter(Boolean)
          .join(' - ') || 'N/A'
      }<br />
      ISP: ${info.ispDomain || 'N/A'}<br />
      组织: ${info.ownerDomain || 'N/A'}<br />
      范围: ${info.range ? Object.values(info.range).join(' - ') : 'N/A'}
      `
    }
    const resetIpInfoText = () => (ipInfoText.value = '获取中..')

    const onIpInfoShow = async (show: boolean, ip: string) => {
      if (!ip) {
        return
      }
      if (show) {
        if (ipLocationCacheMap.has(ip)) {
          const ipInfo = ipLocationCacheMap.get(ip)!
          setIpInfoText(ipInfo)
          return
        }

        const data: any = await RESTManager.api.tools.ip(ip).get()

        setIpInfoText(data)
        ipLocationCacheMap.set(ip, data)
      } else {
        resetIpInfoText()
      }
    }

    return () => (
      <NPopover
        trigger={props.trigger}
        placement="top"
        onUpdateShow={async (show) => {
          if (!props.ip) {
            return
          }
          await onIpInfoShow(show, props.ip)
        }}
      >
        {{
          trigger() {
            return typeof props.triggerEl == 'function'
              ? props.triggerEl()
              : props.triggerEl
          },
          default() {
            return <div innerHTML={ipInfoText.value}></div>
          },
        }}
      </NPopover>
    )
  },
})

interface IP {
  ip: string
  countryName: string
  regionName: string
  cityName: string
  ownerDomain: string
  ispDomain: string
  range?: {
    from: string
    to: string
  }
}
