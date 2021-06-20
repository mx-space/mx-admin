import { React } from '@vicons/fa'
import camelcaseKeys from 'camelcase-keys'
import { NPopover, PopoverTrigger } from 'naive-ui'
import { defineComponent, PropType, ref } from 'vue'

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
        const isIPv6 = ip.split(':').length == 8
        const apiUrl = isIPv6
          ? 'http://ip-api.com/json/'
          : 'https://api.i-meto.com/ip/v1/qqwry/'

        const response = await fetch(apiUrl + ip)
        const data = await response.json()
        let camelData = camelcaseKeys(data, { deep: true }) as IP
        if (isIPv6) {
          const _data = camelData as any as IPv6
          camelData = {
            cityName: _data.city,
            countryName: _data.country,
            ip: _data.query,
            ispDomain: _data.as,
            ownerDomain: _data.org,
            regionName: _data.regionName,
          }
        }
        setIpInfoText(camelData)
        ipLocationCacheMap.set(ip, camelData)
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

interface IPv6 {
  status: string
  country: string
  countryCode: string
  region: string
  regionName: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  as: string
  query: string
}
