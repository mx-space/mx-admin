import { SearchIcon } from 'components/icons'
import { debounce } from 'lodash-es'
import type { AMapSearch } from 'models/amap'
import {
  NAutoComplete,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NModal,
  NSpace,
} from 'naive-ui'
import type { AutoCompleteOption } from 'naive-ui/lib/auto-complete/src/interface'
import { RESTManager } from 'utils/rest'
import type { PropType } from 'vue'
import { defineComponent, ref, watch } from 'vue'

import { Icon } from '@vicons/utils'

export const SearchLocationButton = defineComponent({
  props: {
    placeholder: {
      type: String as PropType<string | undefined | null>,
      default: '',
    },
    onChange: {
      type: Function as PropType<
        (
          location: string,
          coordinates: {
            latitude: number
            longitude: number
          },
        ) => any
      >,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(false)
    const modalOpen = ref(false)
    const keyword = ref('')
    const searchLocation = async (keyword: string) => {
      const res = await RESTManager.api
        .fn('built-in')
        .geocode_search.get<AMapSearch>({
          params: { keywords: keyword },
        })
      return res
    }

    const autocompleteOption = ref([] as AutoCompleteOption[])

    watch(
      () => keyword.value,
      debounce(
        async (keyword) => {
          loading.value = true

          const res = await searchLocation(keyword)
          autocompleteOption.value = []
          res.pois.forEach((p) => {
            const label = p.cityname + p.adname + p.address + p.name
            const [longitude, latitude] = p.location.split(',').map(Number)
            autocompleteOption.value.push({
              key: p.cityname,
              label,
              value: JSON.stringify([label, { latitude, longitude }]),
            })
          })
          loading.value = false
        },
        400,
        { trailing: true, leading: true },
      ),
    )

    let json: any

    return () => (
      <>
        <NButton
          ghost
          round
          onClick={() => {
            modalOpen.value = true
          }}
        >
          {{
            icon() {
              return (
                <Icon>
                  <SearchIcon />
                </Icon>
              )
            },
            default() {
              return '自定义'
            },
          }}
        </NButton>
        <NModal
          transformOrigin="center"
          show={modalOpen.value}
          onUpdateShow={(e) => void (modalOpen.value = e)}
        >
          <NCard
            class="modal-card sm"
            bordered={false}
            closable
            onClose={() => {
              modalOpen.value = false
            }}
            title="搜索关键字查找地点"
          >
            {{
              default: () => (
                <>
                  <NForm labelPlacement="top">
                    <NFormItem label="搜索地点">
                      <NAutoComplete
                        placeholder={props.placeholder || ''}
                        onSelect={(j) => {
                          json = j
                        }}
                        options={autocompleteOption.value}
                        loading={loading.value}
                        onUpdateValue={(e) => {
                          keyword.value = e
                        }}
                        value={keyword.value}
                      />
                    </NFormItem>
                  </NForm>
                  <NSpace justify="end">
                    <NButton
                      round
                      type="primary"
                      onClick={() => {
                        const parsed = JSON.parse(json as string)
                        props.onChange.apply(this, parsed)

                        modalOpen.value = false
                      }}
                      disabled={loading.value}
                    >
                      确定
                    </NButton>
                  </NSpace>
                </>
              ),
            }}
          </NCard>
        </NModal>
      </>
    )
  },
})
