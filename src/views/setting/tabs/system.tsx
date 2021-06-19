import { CheckCircleOutlined } from '@vicons/antd'
import { HeaderActionButton } from 'components/button/rounded-button'
import { cloneDeep, isEmpty, merge, omit } from 'lodash-es'
import { IConfig } from 'models/setting'
import {
  NCollapse,
  NCollapseItem,
  NDynamicTags,
  NForm,
  NFormItem,
  NInput,
} from 'naive-ui'
import { deepDiff, RESTManager } from 'utils'
import {
  defineComponent,
  onBeforeMount,
  onMounted,
  onUnmounted,
  ref,
  toRaw,
  watch,
} from 'vue'
import { useSystemHeaderAction } from '..'

const NFromPrefixCls = 'ml-8 mt-6'
export const TabSystem = defineComponent(() => {
  const headerRef = useSystemHeaderAction()

  onMounted(() => {
    headerRef.value = (
      <HeaderActionButton
        disabled={true}
        icon={<CheckCircleOutlined />}
      ></HeaderActionButton>
    )
  })

  onUnmounted(() => {
    headerRef.value = null
  })

  let originConfigs: IConfig = {} as IConfig
  const configs = ref(mergeFullConfigs({}))
  const diff = ref({} as Partial<IConfig>)

  watch(
    () => configs.value,
    (n) => {
      diff.value = deepDiff(originConfigs, toRaw(n))
    },
    { deep: true },
  )
  watch(
    () => diff.value,
    (n) => {
      console.log(n)

      let canSave = false
      if (isEmpty(n)) {
        canSave = false
      } else {
        canSave = true
      }

      headerRef.value = (
        <HeaderActionButton
          disabled={!canSave}
          icon={<CheckCircleOutlined />}
        ></HeaderActionButton>
      )
    },
  )

  const fetchConfig = async () => {
    let response = (await RESTManager.api.options.get()) as any
    response = mergeFullConfigs(omit(response, ['ok'])) as IConfig

    originConfigs = cloneDeep(response)

    configs.value = response
  }

  onBeforeMount(() => {
    fetchConfig()
  })

  const expandedNames = ref<string[]>(['website'])

  return () => (
    <Fragment>
      <div class="pt-4"></div>
      <NCollapse
        displayDirective="if"
        expandedNames={expandedNames.value}
        onUpdateExpandedNames={(e) => {
          expandedNames.value = e
        }}
      >
        <NCollapseItem title="网站设置" name="website">
          <NForm class={NFromPrefixCls}>
            <NFormItem label="前端地址">
              <NInput
                value={configs.value.url.webUrl}
                onInput={(e) => void (configs.value.url.webUrl = e)}
              ></NInput>
            </NFormItem>

            <NFormItem label="API 地址">
              <NInput
                value={configs.value.url.serverUrl}
                onInput={(e) => void (configs.value.url.serverUrl = e)}
              ></NInput>
            </NFormItem>

            <NFormItem label="后台地址">
              <NInput
                value={configs.value.url.adminUrl}
                onInput={(e) => void (configs.value.url.adminUrl = e)}
              ></NInput>
            </NFormItem>

            <NFormItem label="Gateway 地址">
              <NInput
                value={configs.value.url.wsUrl}
                onInput={(e) => void (configs.value.url.wsUrl = e)}
              ></NInput>
            </NFormItem>
          </NForm>
        </NCollapseItem>
        <NCollapseItem title="SEO 优化" name="seo">
          <NForm class={NFromPrefixCls}>
            <NFormItem label="网站标题">
              <NInput
                value={configs.value.seo.title}
                onInput={(e) => void (configs.value.seo.title = e)}
              ></NInput>
            </NFormItem>

            <NFormItem label="网站描述">
              <NInput
                value={configs.value.seo.description}
                onInput={(e) => void (configs.value.seo.description = e)}
              ></NInput>
            </NFormItem>

            <NFormItem label="关键字">
              <NDynamicTags
                value={configs.value.seo.keywords}
                onChange={(e) => void (configs.value.seo.keywords = e)}
              ></NDynamicTags>
            </NFormItem>
          </NForm>
        </NCollapseItem>
        <NCollapseItem title="评论设置" name="comment"></NCollapseItem>
      </NCollapse>
    </Fragment>
  )
})

function mergeFullConfigs(configs: any): IConfig {
  return merge<IConfig, IConfig>(
    {
      seo: { title: '', description: '', keywords: [] },
      url: {
        wsUrl: '',
        adminUrl: '',
        serverUrl: '',
        webUrl: '',
      },
      imageBed: {
        customUrl: '',
        repo: '',
        token: '',
        type: 'github',
      },
      mailOptions: {
        user: '',
        pass: '',
        options: { host: '', port: 465 },
        enable: false,
      },
      commentOptions: {
        antiSpam: false,
      },
      backupOptions: {
        enable: false,
        SecretId: '',
        SecretKey: '',
        Bucket: '',
        Region: '',
      },
      baiduSearchOptions: {
        enable: false,
        token: '',
      },
    },
    configs,
  )
}
