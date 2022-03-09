import { HeaderActionButton } from 'components/button/rounded-button'
import { CheckCircleOutlinedIcon } from 'components/icons'
import { useMountAndUnmount } from 'hooks/use-react'
import { dump, load } from 'js-yaml'
import { useLayout } from 'layouts/content'
import { TwoColGridLayout } from 'layouts/two-col'
import { debounce, omit } from 'lodash-es'
import {
  NForm,
  NFormItem,
  NGi,
  NInput,
  NSelect,
  NSwitch,
  useMessage,
} from 'naive-ui'
import { RESTManager } from 'utils'
import { useRoute, useRouter } from 'vue-router'
import {
  defaultServerlessFunction,
  SnippetModel,
  SnippetType,
  SnippetTypeToLanguage,
} from '../../../models/snippet'
import { CodeEditorForSnippet } from '../code-editor'

export const Tab2ForEdit = defineComponent({
  setup() {
    const router = useRouter()
    const route = useRoute()
    const editId = computed(() => route.query.id as string)

    const data = ref<SnippetModel>(new SnippetModel())

    const typeToValueMap = reactive<Record<SnippetType, string>>(
      // 有 Id 的情况下，避免闪白, 留空数据
      editId.value
        ? { json: '', yaml: '', text: '', function: '' }
        : {
            json: JSON.stringify({ name: 'hello world' }, null, 2),
            text: '',
            yaml: `name: hello world`,
            function: defaultServerlessFunction,
          },
    )

    // 监听 type 变化, 实时同时 typeToValueMap 中的值 到 data.raw
    watch(
      () => data.value.type,
      (type) => {
        data.value.raw = typeToValueMap[type]
      },
    )

    // json yaml 同步转换
    watch(
      () => [typeToValueMap.json, typeToValueMap.yaml],
      debounce(([json, yaml], [oldJson, oldYaml]) => {
        const isUpdateJSON = json !== oldJson
        const isUpdateYAML = yaml !== oldYaml

        // use escapeObject to avoid re-render hell
        const escapeObject = toRaw(typeToValueMap)

        try {
          if (isUpdateJSON) {
            escapeObject.yaml = dump(JSON.parse(json))
          } else if (isUpdateYAML) {
            escapeObject.json = JSON.stringify(load(yaml), null, 2)
          }
        } catch {}
      }, 100),
    )

    watch(
      () => editId,
      async (editId) => {
        if (editId.value) {
          const _data = await RESTManager.api
            .snippets(editId.value)
            .get<SnippetModel>()
          switch (_data.type) {
            case SnippetType.JSON: {
              _data.raw = JSON.stringify(JSON.parse(_data.raw), null, 2)

              break
            }
          }
          data.value = _data
          // 同时更新 typeToValueMap 中的值
          typeToValueMap[_data.type] = _data.raw
        }
      },
      {
        immediate: true,
      },
    )

    const layout = useLayout()
    const message = useMessage()
    const handleUpdateOrCreate = async () => {
      const tinyJson = (text: string) => {
        try {
          return JSON.stringify(JSON.parse(text), null, 0)
        } catch {
          message.error('JSON 格式错误')
        }
      }

      const handleRawText = () => {
        const currentTypeText = typeToValueMap[data.value.type]
        switch (data.value.type) {
          case SnippetType.JSON: {
            return tinyJson(currentTypeText)
          }
          case SnippetType.YAML: {
            try {
              load(currentTypeText)
            } catch {
              message.error('YAML 格式错误')
            }
            return currentTypeText
          }

          case SnippetType.Function: {
            // TODO 验证，暂时不验证，服务端验证
            return currentTypeText
          }
          default: {
            return currentTypeText
          }
        }
      }

      const omitData = omit(data.value, ['_id', 'id', 'created', 'data'])
      const finalData = { ...omitData, raw: handleRawText() }
      if (!finalData.metatype) {
        delete finalData.metatype
      }

      if (editId.value) {
        await RESTManager.api.snippets(editId.value).put({
          data: finalData,
        })
      } else {
        await RESTManager.api.snippets.post({
          data: finalData,
        })
      }

      message.success(`${editId.value ? '更新' : '创建'}成功`)
      router.replace({
        query: {
          ...route.query,
          tab: 0,
        },
      })
    }
    useMountAndUnmount(() => {
      layout.setHeaderButton(
        <HeaderActionButton
          variant="success"
          onClick={handleUpdateOrCreate}
          icon={<CheckCircleOutlinedIcon />}
        ></HeaderActionButton>,
      )

      return () => {
        layout.setHeaderButton(null)
      }
    })

    return () => (
      <TwoColGridLayout>
        <NGi span={12}>
          <NForm>
            <NFormItem label="名称" required>
              <NInput
                onUpdateValue={(e) => void (data.value.name = e)}
                value={data.value.name}
              ></NInput>
            </NFormItem>

            <NFormItem label="引用" required>
              <NInput
                value={data.value.reference}
                onUpdateValue={(e) => void (data.value.reference = e)}
                defaultValue={'root'}
              ></NInput>
            </NFormItem>

            <NFormItem label="元类型">
              <NInput
                value={data.value.metatype}
                onUpdateValue={(e) => void (data.value.metatype = e)}
              ></NInput>
            </NFormItem>

            <NFormItem label="数据类型">
              <NSelect
                value={data.value.type}
                defaultValue={SnippetType.JSON}
                onUpdateValue={(val) => void (data.value.type = val)}
                options={Object.entries(SnippetType).map(([k, v]) => {
                  return {
                    label: k,
                    value: v,
                  }
                })}
              ></NSelect>
            </NFormItem>

            <NFormItem label="公开" labelPlacement="left">
              <div class="w-full flex justify-end">
                <NSwitch
                  value={!data.value.private}
                  onUpdateValue={(val) => void (data.value.private = !val)}
                ></NSwitch>
              </div>
            </NFormItem>
            <NFormItem label="备注">
              <NInput
                resizable={false}
                value={data.value.comment}
                onUpdateValue={(val) => void (data.value.comment = val)}
                type="textarea"
                rows={4}
              ></NInput>
            </NFormItem>
          </NForm>
        </NGi>

        <NGi span={24}>
          <CodeEditorForSnippet
            language={SnippetTypeToLanguage[data.value.type]}
            value={typeToValueMap[data.value.type]}
            onChange={(value) => {
              typeToValueMap[data.value.type] = value
            }}
          />
        </NGi>
      </TwoColGridLayout>
    )
  },
})
