import { LocationIcon } from 'components/icons'
import { Amap, Regeocode } from 'models/amap'
import { NButton, useMessage } from 'naive-ui'
import { RESTManager } from 'utils/rest'
import { PropType, defineComponent, ref } from 'vue'

import { Icon } from '@vicons/utils'

export const GetLocationButton = defineComponent({
  props: {
    onChange: {
      type: Function as PropType<
        (amap: Regeocode, coordinates: readonly [number, number]) => any
      >,
      required: true,
    },
  },
  setup(props) {
    const message = useMessage()
    const loading = ref(false)
    const handleGetLocation = async () => {
      const promisify = () =>
        new Promise<GeolocationPosition>((r, j) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              loading.value = true
              r(pos)
              loading.value = false
            },
            (err) => {
              loading.value = false
              j(err)
            },
          )
        })
      if (navigator.geolocation) {
        try {
          const coordinates = await promisify()
          // console.log(coordinates)

          const {
            coords: { latitude, longitude },
          } = coordinates

          const coo = [longitude, latitude] as const
          const res = await RESTManager.api.tools.geocode.location.get<Amap>({
            params: {
              longitude,
              latitude,
            },
          })

          props.onChange(res.regeocode, coo)
        } catch (e) {
          message.error('定位权限未打开')
        }
      } else {
        message.error('浏览器不支持定位')
      }
    }
    return () => (
      <NButton
        ghost
        round
        type="primary"
        onClick={handleGetLocation}
        loading={loading.value}
      >
        {{
          icon() {
            return (
              <Icon>
                <LocationIcon />
              </Icon>
            )
          },
          default() {
            return '定位'
          },
        }}
      </NButton>
    )
  },
})
