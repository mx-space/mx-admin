import { HeaderActionButton } from 'components/button/rounded-button'
import { CheckIcon, TrashIcon } from 'components/icons'
import { useMountAndUnmount } from 'hooks/use-react'
import { useLayout } from 'layouts/content'
import { TwoColGridLayout } from 'layouts/two-col'
import { NGi, NSwitch, useDialog } from 'naive-ui'
import { RESTManager } from 'utils'

import { CodeEditorForTemplateEditing } from '../code-editor'
import { EJSRender } from '../ejs-render'

export const EmailTab = defineComponent({
  setup() {
    const templateString = ref('')
    const modifiedTemplate = ref('')
    const templateType = ref<'guest' | 'owner'>('guest')

    const renderProps = ref<any>(null)
    const { setHeaderButtons: setHeaderButton } = useLayout()

    const save = async () => {
      await RESTManager.api.options.email.template.reply.put({
        params: { type: templateType.value },
        data: { source: modifiedTemplate.value },
      })

      await fetch()
    }
    const modal = useDialog()

    const reset = () => {
      modal.warning({
        title: '确认重置？',
        content: '重置后，模板将被恢复为默认模板',
        async onNegativeClick() {
          await RESTManager.api.options.email.template.reply.delete({
            params: { type: templateType.value },
          })

          await fetch()
        },
        onPositiveClick() {
          return
        },
        negativeText: '嗯',
        positiveText: '达咩',
      })
    }
    // TODO
    // const canSave = computed(
    //   () =>
    //     templateString.value === '' ||
    //     modifiedTemplate.value === '' ||
    //     templateType.value === modifiedTemplate.value,
    // )

    useMountAndUnmount(() => {
      setHeaderButton(
        <>
          <HeaderActionButton
            icon={<CheckIcon />}
            name="提交"
            onClick={save}
            variant="success"
          />
          <HeaderActionButton
            icon={<TrashIcon />}
            name="重置自定义模板"
            onClick={reset}
            variant="error"
          />
        </>,
      )
      return () => {
        setHeaderButton(null)
      }
    })
    onMounted(() => {
      fetch()
    })

    const fetch = async () => {
      const { template, props } =
        await RESTManager.api.options.email.template.reply.get<{
          template: string
          props: any
        }>({
          params: { type: templateType.value },
        })
      templateString.value = template
      modifiedTemplate.value = template
      renderProps.value = props
    }

    watch(() => templateType.value, fetch)

    return () => (
      <div>
        <NSwitch
          defaultValue={templateType.value === 'guest' ? true : false}
          onUpdateValue={(isGuest) => {
            templateType.value = isGuest ? 'guest' : 'owner'
          }}
        >
          {{
            checked() {
              return '游客'
            },
            unchecked() {
              return '主人'
            },
          }}
        </NSwitch>
        <div class="pb-4"></div>
        <TwoColGridLayout>
          <NGi span={18}>
            <CodeEditorForTemplateEditing
              onChange={(val) => {
                modifiedTemplate.value = val
              }}
              value={templateString.value}
            />
          </NGi>
          <NGi span={18} class="relative h-[calc(100vh-15rem)] ">
            <EJSRender
              data={renderProps.value}
              template={modifiedTemplate.value}
            />
          </NGi>
        </TwoColGridLayout>
      </div>
    )
  },
})
