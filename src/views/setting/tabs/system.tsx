import CheckCircleOutlined from '@vicons/antd/CheckCircleOutlined'
import { HeaderActionButton } from 'components/button/rounded-button'

import { useInjector } from 'hooks/use-deps-injection'
import { useLayout } from 'layouts/content'
import { cloneDeep, isEmpty, merge, omit } from 'lodash-es'
import { IConfig } from 'models/setting'
import {
  NCollapse,
  NCollapseItem,
  NDynamicTags,
  NForm,
  NFormItem,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NSpace,
  NSwitch,
  NText,
} from 'naive-ui'
import { UIStore } from 'stores/ui'
import { deepDiff, RESTManager } from 'utils'
import {
  computed,
  defineComponent,
  onBeforeMount,
  reactive,
  ref,
  onMounted,
  onUnmounted,
  toRaw,
  watch,
} from 'vue'

const NFormPrefixCls = 'mt-6'
const NFormBaseProps = {
  class: NFormPrefixCls,
  labelPlacement: 'left',
  labelAlign: 'right',
  labelWidth: 150,
}

// FIXME : input autocomplation

export const autosizeableProps = {
  autosize: true,
  clearable: true,
  style: 'min-width: 300px; max-width: 100%',
} as const
export const TabSystem = defineComponent(() => {
  const { setHeaderButton } = useLayout()

  onMounted(() => {
    setHeaderButton(
      <HeaderActionButton
        disabled={true}
        onClick={save}
        icon={<CheckCircleOutlined />}
      ></HeaderActionButton>,
    )
  })

  onUnmounted(() => {
    setHeaderButton(null)
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
      let canSave = false
      if (isEmpty(n)) {
        canSave = false
      } else {
        canSave = true
      }
      setHeaderButton(
        <HeaderActionButton
          disabled={!canSave}
          icon={<CheckCircleOutlined />}
          onClick={save}
        ></HeaderActionButton>,
      )
    },
  )

  async function save() {
    if (isEmpty(diff.value)) {
      return
    }

    const entries = Object.entries(diff.value)

    for await (const [key, value] of entries) {
      if (key === 'seo') {
        await RESTManager.api.options(key).patch({
          data: {
            ...(value as any),
            keywords: configs.value.seo.keywords,
          },
        })
      } else {
        await RESTManager.api.options(key).patch({
          data: value,
        })
      }
    }

    await fetchConfig()
    message.success('修改成功')
  }

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
  const uiStore = useInjector(UIStore)
  const gridCols = computed(() => (uiStore.viewport.value.mobile ? 1 : 2))
  const formProps = reactive(NFormBaseProps) as any

  watch(
    () => uiStore.viewport.value.mobile,
    (n) => {
      if (n) {
        formProps.labelPlacement = 'top'
      } else {
        formProps.labelPlacement = 'left'
      }
    },
  )
  return () => (
    <Fragment>
      <div class="pt-4"></div>
      <NCollapse
        accordion
        displayDirective="if"
        expandedNames={expandedNames.value}
        onUpdateExpandedNames={(e) => {
          expandedNames.value = e
        }}
      >
        <NCollapseItem title="网站设置" name="website">
          <NForm {...formProps}>
            <NGrid cols={gridCols.value} xGap={12}>
              <NFormItemGi span={1} label="前端地址">
                <NInput
                  value={configs.value.url.webUrl}
                  onInput={(e) => void (configs.value.url.webUrl = e)}
                ></NInput>
              </NFormItemGi>

              <NFormItemGi span={1} label="API 地址">
                <NInput
                  value={configs.value.url.serverUrl}
                  onInput={(e) => void (configs.value.url.serverUrl = e)}
                ></NInput>
              </NFormItemGi>

              <NFormItemGi span={1} label="后台地址">
                <NInput
                  value={configs.value.url.adminUrl}
                  onInput={(e) => void (configs.value.url.adminUrl = e)}
                ></NInput>
              </NFormItemGi>

              <NFormItemGi span={1} label="Gateway 地址">
                <NInput
                  value={configs.value.url.wsUrl}
                  onInput={(e) => void (configs.value.url.wsUrl = e)}
                ></NInput>
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NCollapseItem>
        <NCollapseItem title="SEO 优化" name="seo">
          <NForm {...formProps}>
            <NFormItem label="网站标题">
              <NInput
                {...autosizeableProps}
                value={configs.value.seo.title}
                onInput={(e) => void (configs.value.seo.title = e)}
              ></NInput>
            </NFormItem>

            <NFormItem label="网站描述">
              <NInput
                {...autosizeableProps}
                value={configs.value.seo.description}
                onInput={(e) => void (configs.value.seo.description = e)}
              ></NInput>
            </NFormItem>

            <NFormItem label="关键字">
              <NDynamicTags
                round
                type="primary"
                value={configs.value.seo.keywords}
                onChange={(e) => void (configs.value.seo.keywords = e)}
              ></NDynamicTags>
            </NFormItem>
          </NForm>
        </NCollapseItem>

        <NCollapseItem title="评论设置" name="comment">
          <NForm {...formProps}>
            <NFormItem label="反垃圾评论">
              <NSwitch
                value={configs.value.commentOptions.antiSpam}
                onUpdateValue={(e) =>
                  void (configs.value.commentOptions.antiSpam = e)
                }
              ></NSwitch>
            </NFormItem>

            <NFormItem label="自定义屏蔽关键词">
              <NDynamicTags
                disabled={!configs.value.commentOptions.antiSpam}
                value={configs.value.commentOptions.spamKeywords}
                onUpdateValue={(e) =>
                  void (configs.value.commentOptions.spamKeywords = e)
                }
                type="primary"
              ></NDynamicTags>
            </NFormItem>

            <NFormItem label="自定义屏蔽 IP">
              <NDynamicTags
                disabled={!configs.value.commentOptions.antiSpam}
                value={configs.value.commentOptions.blockIps}
                onUpdateValue={(e) =>
                  void (configs.value.commentOptions.blockIps = e)
                }
              ></NDynamicTags>
            </NFormItem>

            <NFormItem label="禁止非中文评论">
              <NSwitch
                value={configs.value.commentOptions.disableNoChinese}
                onUpdateValue={(e) =>
                  void (configs.value.commentOptions.disableNoChinese = e)
                }
              />
            </NFormItem>
          </NForm>
        </NCollapseItem>

        <NCollapseItem title="评论回复设置" name="reply">
          <NForm {...formProps}>
            <NFormItem label="开启评论邮箱提醒">
              <NSwitch
                value={configs.value.mailOptions.enable}
                onUpdateValue={(e) =>
                  void (configs.value.mailOptions.enable = e)
                }
              />
            </NFormItem>
            <NGrid cols={gridCols.value} xGap={12}>
              <NFormItemGi span={1} label="发件邮箱 host">
                <NInput
                  value={configs.value.mailOptions.options.host}
                  onInput={(e) =>
                    void (configs.value.mailOptions.options.host = e)
                  }
                />
              </NFormItemGi>
              <NFormItemGi span={1} label="发件邮箱端口">
                <NInputNumber
                  value={configs.value.mailOptions.options.port}
                  onChange={(e) =>
                    void (configs.value.mailOptions.options.port = e ?? 465)
                  }
                />
              </NFormItemGi>
              <NFormItemGi span={1} label="发件邮箱地址">
                <NInput
                  value={configs.value.mailOptions.user}
                  onInput={(e) => void (configs.value.mailOptions.user = e)}
                />
              </NFormItemGi>
              <NFormItemGi span={1} label="发件邮箱密码">
                <NInput
                  type="password"
                  showPasswordToggle
                  inputProps={{
                    name: 'email-password',
                    autocomplete: 'off',
                    autocapitalize: 'off',
                    autocorrect: 'off',
                  }}
                  value={configs.value.mailOptions.pass}
                  onInput={(e) => void (configs.value.mailOptions.pass = e)}
                />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NCollapseItem>

        <NCollapseItem name="img_bed" title="图床设定">
          <NForm {...formProps}>
            <NText>
              {/* TODO */}
              TODO
            </NText>
          </NForm>
        </NCollapseItem>

        <NCollapseItem name="backup" title="备份">
          <NForm {...formProps}>
            <NFormItem label="开启备份">
              <NSpace vertical>
                <NSwitch
                  value={configs.value.backupOptions.enable}
                  onUpdateValue={(e) =>
                    void (configs.value.backupOptions.enable = e)
                  }
                />
                <NText class="text-xs" depth={3}>
                  仅支持备份到 COS
                </NText>
              </NSpace>
            </NFormItem>

            <NFormItem label="地域 Region">
              <NInput
                {...autosizeableProps}
                value={configs.value.backupOptions.region}
                onInput={(e) => void (configs.value.backupOptions.region = e)}
              />
            </NFormItem>
            <NFormItem label="SecretId">
              <NInput
                {...autosizeableProps}
                value={configs.value.backupOptions.secretId}
                onInput={(e) => void (configs.value.backupOptions.secretId = e)}
              />
            </NFormItem>
            <NFormItem label="SecretKey">
              <NInput
                {...autosizeableProps}
                type="password"
                inputProps={{
                  name: 'secret-key-password',
                  autocomplete: 'off',
                  autocapitalize: 'off',
                  autocorrect: 'off',
                }}
                showPasswordToggle
                value={configs.value.backupOptions.secretKey}
                onInput={(e) =>
                  void (configs.value.backupOptions.secretKey = e)
                }
              />
            </NFormItem>
          </NForm>
        </NCollapseItem>

        <NCollapseItem name="baidu_push" title="百度推送">
          <NForm {...formProps}>
            <NFormItem label="开启推送">
              <NSwitch
                value={configs.value.baiduSearchOptions.enable}
                onUpdateValue={(e) =>
                  void (configs.value.baiduSearchOptions.enable = e)
                }
              />
            </NFormItem>
            <NFormItem label="Token" path="baidu_push">
              <NInput
                {...autosizeableProps}
                showPasswordToggle
                type="password"
                inputProps={{
                  name: 'baidu-push-password',
                  autocomplete: 'off',
                  autocapitalize: 'off',
                  autocorrect: 'off',
                }}
                disabled={!configs.value.baiduSearchOptions.enable}
                value={configs.value.baiduSearchOptions.token}
                onUpdateValue={(e) =>
                  void (configs.value.baiduSearchOptions.token = e)
                }
              />
            </NFormItem>
          </NForm>
        </NCollapseItem>
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
        spamKeywords: [],
        blockIps: [],
        disableNoChinese: false,
      },
      backupOptions: {
        enable: false,
        secretId: '',
        secretKey: '',
        bucket: '',
        region: '',
      },
      baiduSearchOptions: {
        enable: false,
        token: '',
      },
    },
    configs,
  )
}
