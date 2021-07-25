import SlidersH from '@vicons/fa/es/SlidersH'
import TelegramPlane from '@vicons/fa/es/TelegramPlane'
import Search24Regular from '@vicons/fluent/es/Search24Regular'
import Location24Regular from '@vicons/fluent/es/Location24Regular'
import { Icon } from '@vicons/utils'
import camelcaseKeys from 'camelcase-keys'
import { HeaderActionButton } from 'components/button/rounded-button'
import { EditorToggleWrapper } from 'components/editor'
import { MaterialInput } from 'components/input/material-input'
import { ParseContentButton } from 'components/logic/parse-button'
import { configs } from 'configs'
import { BASE_URL } from 'constants/env'
import { MOOD_SET, WEATHER_SET } from 'constants/note'
import { add } from 'date-fns/esm'
import { useAutoSave, useAutoSaveInEditor } from 'hooks/use-auto-save'
import { useParsePayloadIntoData } from 'hooks/use-parse-payload'
import { ContentLayout } from 'layouts/content'
import { debounce, isString, throttle } from 'lodash-es'
import { Amap, AMapSearch, Regeocode } from 'models/amap'
import { Coordinate, NoteModel, NoteMusicRecord } from 'models/note'
import {
  NAutoComplete,
  NButton,
  NButtonGroup,
  NCard,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NDynamicTags,
  NForm,
  NFormItem,
  NFormItemRow,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NSwitch,
  useMessage,
} from 'naive-ui'
import { RouteName } from 'router/name'
import { RESTManager } from 'utils/rest'
import { getDayOfYear } from 'utils/time'
import {
  computed,
  defineComponent,
  onBeforeMount,
  onMounted,
  PropType,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AutoCompleteOption } from 'naive-ui/lib/auto-complete/src/interface'
type NoteReactiveType = {
  title: string
  text: string
  hide: boolean
  mood: string
  weather: string
  password: string | null
  secret: Date | null
  hasMemory: boolean
  music: NoteMusicRecord[]
  location: null | string
  coordinates: null | Coordinate
}

const NoteWriteView = defineComponent(() => {
  const route = useRoute()

  const defaultTitle = ref('写点什么呢')
  const id = computed(() => route.query.id)

  onBeforeMount(() => {
    if (id.value) {
      return
    }
    const currentTime = new Date()
    defaultTitle.value = `记录 ${currentTime.getFullYear()} 年第 ${getDayOfYear(
      currentTime,
    )} 天`
  })

  const resetReactive: () => NoteReactiveType = () => ({
    text: '',
    title: '',
    hide: false,
    hasMemory: false,
    mood: '',
    music: [],
    password: null,
    secret: null,
    weather: '',
    location: '',
    coordinates: null,
  })

  const parsePayloadIntoReactiveData = (payload: NoteModel) =>
    useParsePayloadIntoData(data)(payload)
  const data = reactive<NoteReactiveType>(resetReactive())
  const nid = ref<number>()

  const loading = computed(() => !!(id.value && !data.title))

  const disposer = watch(
    () => loading.value,
    (loading) => {
      if (loading) {
        return
      }

      const autoSaveHook = useAutoSave(
        'note-' + (id.value || 'new'),
        3000,
        () => ({
          text: data.text,
          title: data.title,
        }),
      )

      useAutoSaveInEditor(data, autoSaveHook)
      requestAnimationFrame(() => {
        disposer()
      })
    },
    { immediate: true },
  )

  onMounted(async () => {
    const $id = id.value
    if ($id && typeof $id == 'string') {
      const payload = (await RESTManager.api.notes($id).get({
        params: {
          single: true,
        },
      })) as any

      const data = payload.data
      nid.value = data.nid
      data.secret = data.secret ? new Date(data.secret) : null

      const created = new Date((data as any).created)
      defaultTitle.value = `记录 ${created.getFullYear()} 年第 ${getDayOfYear(
        created,
      )} 天`

      parsePayloadIntoReactiveData(data as NoteModel)
    }
  })

  const drawerShow = ref(false)

  const message = useMessage()
  const router = useRouter()

  const enablePassword = computed(() => typeof data.password === 'string')

  const handleSubmit = async () => {
    const parseDataToPayload = (): { [key in keyof NoteModel]?: any } => {
      return {
        ...toRaw(data),
        title:
          data.title && data.title.trim() ? data.title.trim() : defaultTitle,
        password:
          data.password && data.password.length > 0 ? data.password : null,
        secret: data.secret
          ? (() => {
              const date = new Date(data.secret)
              if (+date - +new Date() <= 0) {
                return null
              } else {
                return date
              }
            })()
          : null,
        music: data.music,
      }
    }
    if (id.value) {
      // update
      if (!isString(id.value)) {
        return
      }
      const $id = id.value as string
      await RESTManager.api.notes($id).put({
        data: parseDataToPayload(),
      })
      message.success('修改成功')
    } else {
      // create
      await RESTManager.api.notes.post({
        data: parseDataToPayload(),
      })
      message.success('发布成功')
    }

    router.push({ name: RouteName.ViewNote, hash: '|publish' })
  }

  return () => (
    <ContentLayout
      title={'树洞'}
      actionsElement={
        <>
          <ParseContentButton data={data} />

          <HeaderActionButton
            icon={<TelegramPlane />}
            onClick={handleSubmit}
          ></HeaderActionButton>
        </>
      }
      footerButtonElement={
        <>
          <button
            onClick={() => {
              drawerShow.value = true
            }}
          >
            <Icon>
              <SlidersH />
            </Icon>
          </button>
        </>
      }
    >
      <MaterialInput
        class="mt-3 relative z-10"
        label={defaultTitle.value}
        value={data.title}
        onChange={(e) => {
          data.title = e
        }}
      ></MaterialInput>

      <div class={'text-gray-500 py-3'}>
        <label>{`${BASE_URL}/notes/${nid.value ?? ''}`}</label>
      </div>

      <EditorToggleWrapper
        loading={loading.value}
        onChange={(v) => {
          data.text = v
        }}
        text={data.text}
      />

      {/* Drawer  */}

      <NDrawer
        show={drawerShow.value}
        width={450}
        style={{ maxWidth: '90vw' }}
        placement="right"
        onUpdateShow={(s) => {
          drawerShow.value = s
        }}
      >
        <NDrawerContent title="文章设定">
          {/* @ts-ignore */}
          <NForm name="note-options">
            <NFormItem label="心情" required>
              <NSelect
                value={data.mood}
                filterable
                tag
                options={MOOD_SET.map((i) => ({ label: i, value: i }))}
                onUpdateValue={(e) => void (data.mood = e)}
              ></NSelect>
            </NFormItem>
            <NFormItem label="天气" required>
              <NSelect
                value={data.weather}
                filterable
                tag
                options={WEATHER_SET.map((i) => ({ label: i, value: i }))}
                onUpdateValue={(e) => void (data.weather = e)}
              ></NSelect>
            </NFormItem>

            <NFormItem label="获取当前地址" labelPlacement="left">
              <NSpace vertical>
                <NButtonGroup>
                  <GetLocationButton
                    onChange={(amap, coordinates) => {
                      data.location = amap.formattedAddress
                      data.coordinates = {
                        longitude: coordinates[0],
                        latitude: coordinates[1],
                      }
                    }}
                  />
                  <SearchLocationButton
                    placeholder={data.location}
                    onChange={(locationName, coo) => {
                      data.location = locationName
                      data.coordinates = coo
                    }}
                  />

                  <NButton
                    round
                    disabled={!data.location}
                    onClick={() => {
                      data.location = ''
                      data.coordinates = null
                    }}
                  >
                    清楚
                  </NButton>
                </NButtonGroup>

                <NSpace vertical>
                  <span>{data.location}</span>
                  {data.coordinates && (
                    <span>
                      {data.coordinates.longitude}, {data.coordinates.latitude}
                    </span>
                  )}
                </NSpace>
              </NSpace>
            </NFormItem>

            <NFormItem
              label="设定密码?"
              labelAlign="right"
              labelPlacement="left"
            >
              <NSwitch
                value={enablePassword.value}
                onUpdateValue={(e) => {
                  if (e) {
                    data.password = ''
                  } else {
                    data.password = null
                  }
                }}
              />
            </NFormItem>
            {enablePassword.value && (
              <NFormItem label="输入密码">
                <NInput
                  disabled={!enablePassword.value}
                  placeholder=""
                  type="password"
                  value={data.password}
                  inputProps={{
                    name: 'note-password',
                    autocapitalize: 'off',
                    autocomplete: 'new-password',
                  }}
                  onInput={(e) => void (data.password = e)}
                ></NInput>
              </NFormItem>
            )}
            <NFormItem
              label="多久之后公开"
              labelWidth={'50%'}
              labelAlign="right"
              labelPlacement="left"
            >
              <NDatePicker
                type="datetime"
                isDateDisabled={(ts: number) => +new Date(ts) - +new Date() < 0}
                placeholder="选择时间"
                // @ts-expect-error
                value={data.secret}
                onUpdateValue={(e) => {
                  data.secret = e ? new Date(e) : null
                }}
              >
                {{
                  footer: () => {
                    const date = new Date()
                    return (
                      <NSpace>
                        <NButton
                          round
                          type="default"
                          size="small"
                          onClick={() => {
                            data.secret = add(date, { days: 1 })
                          }}
                        >
                          一天后
                        </NButton>
                        <NButton
                          round
                          type="default"
                          size="small"
                          onClick={() => {
                            data.secret = add(date, { weeks: 1 })
                          }}
                        >
                          一周后
                        </NButton>
                        <NButton
                          round
                          type="default"
                          size="small"
                          onClick={() => {
                            data.secret = add(date, { days: 14 })
                          }}
                        >
                          半个月后
                        </NButton>
                        <NButton
                          round
                          type="default"
                          size="small"
                          onClick={() => {
                            data.secret = add(date, { months: 1 })
                          }}
                        >
                          一个月后
                        </NButton>
                      </NSpace>
                    )
                  },
                }}
              </NDatePicker>
            </NFormItem>

            <NFormItem
              label="隐藏"
              labelWidth={'50%'}
              labelAlign="right"
              labelPlacement="left"
            >
              <NSwitch
                value={data.hide}
                onUpdateValue={(e) => void (data.hide = e)}
              ></NSwitch>
            </NFormItem>

            <NFormItem
              label="是否存在回忆, 日后需要重温?"
              labelAlign="right"
              labelPlacement="left"
              labelWidth={'50%'}
            >
              <NSwitch
                value={data.hasMemory}
                onUpdateValue={(e) => void (data.hasMemory = e)}
              ></NSwitch>
            </NFormItem>

            <NFormItem label="音乐 (网易云 ID)">
              <NDynamicTags
                value={data.music.map((i) => i.id)}
                onUpdateValue={(e) => {
                  data.music = e.map((id) => ({ type: 'netease', id }))
                }}
              ></NDynamicTags>
            </NFormItem>
          </NForm>
        </NDrawerContent>
      </NDrawer>
      {/* Drawer END */}
    </ContentLayout>
  )
})

export default NoteWriteView

const GetLocationButton = defineComponent({
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
      if (!configs.amapKey) {
        message.error('高德地图 Key 未配置.')
        return
      }
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
          const res = await fetch(
            'https://restapi.amap.com/v3/geocode/regeo?key=' +
              configs.amapKey +
              '&location=' +
              coo.join(','),
          )
          const json = camelcaseKeys(await res.json(), { deep: true }) as Amap
          // const location = json.regeocode.formattedAddress

          props.onChange(json.regeocode, coo)
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
                <Location24Regular />
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

const SearchLocationButton = defineComponent({
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
    const message = useMessage()
    const loading = ref(false)
    const modalOpen = ref(false)
    const keyword = ref('')
    const searchLocation = async (keyword: string) => {
      if (!configs.amapKey) {
        const msg = '高德地图 Key 未配置.'
        message.error(msg)
        throw new Error(msg)
      }
      const params = new URLSearchParams([
        ['key', configs.amapKey as string],
        ['keywords', keyword.replace(/\s/g, '|')],
      ])

      const res = await fetch(
        'https://restapi.amap.com/v3/place/text?' + params.toString(),
      )
      return (await res.json()) as AMapSearch
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
                  <Search24Regular />
                </Icon>
              )
            },
            default() {
              return '自定义'
            },
          }}
        </NButton>
        <NModal
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
                        // onSelect={(e) => {
                        //   const parsed = JSON.parse(e as string)
                        //   props.onChange.apply(this, parsed)
                        // }}
                        placeholder={props.placeholder || ''}
                        onSelect={(j) => {
                          json = j
                        }}
                        options={autocompleteOption.value}
                        // clearable
                        loading={loading.value}
                        onUpdate:value={(e) => {
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
