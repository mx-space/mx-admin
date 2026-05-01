import { Check as CheckIcon, Trash as TrashIcon } from 'lucide-vue-next'
import { NForm, NFormItem, NGi, NSelect, useDialog } from 'naive-ui'
import { defineComponent, onMounted, ref, watch } from 'vue'

import { optionsApi } from '~/api'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { useMountAndUnmount } from '~/hooks/use-lifecycle'
import { useLayout } from '~/layouts/content'
import { TwoColGridLayout } from '~/layouts/two-col'

import { CodeEditorForTemplateEditing } from '../code-editor'
import { EJSRender } from '../ejs-render'

export enum ReplyMailType {
  Owner = 'owner',
  Guest = 'guest',
}

export enum NewsletterMailType {
  Newsletter = 'newsletter',
}

export const EmailTab = defineComponent({
  setup() {
    const templateString = ref('')
    const modifiedTemplate = ref('')
    const templateType = ref<ReplyMailType | NewsletterMailType>(
      ReplyMailType.Guest,
    )

    const renderProps = ref<any>(null)
    const { setActions: setHeaderButton } = useLayout()

    const save = async () => {
      await optionsApi.updateEmailTemplate(
        { type: templateType.value },
        { source: modifiedTemplate.value },
      )

      await fetch()
    }
    const modal = useDialog()

    const reset = () => {
      modal.warning({
        title: '确认重置？',
        content: '重置后，模板将被恢复为默认模板',
        async onPositiveClick() {
          await optionsApi.deleteEmailTemplate({ type: templateType.value })

          await fetch()
        },

        negativeText: '取消',
        positiveText: '确认',
      })
    }
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
      const { template, props } = await optionsApi.getEmailTemplate({
        type: templateType.value,
      })
      templateString.value = template
      modifiedTemplate.value = template
      renderProps.value = props
    }

    watch(() => templateType.value, fetch)
    const isTemplateError = ref(false)

    watch(
      () => modifiedTemplate.value,
      () => {
        isTemplateError.value = false
      },
    )

    return () => (
      <div>
        <NForm class={'w-[300px]'}>
          <NFormItem label="模板类型" labelPlacement="left">
            <NSelect
              value={templateType.value}
              onUpdateValue={(val) => (templateType.value = val)}
              options={[
                {
                  label: '回复邮件（访客）',
                  value: ReplyMailType.Guest,
                },
                {
                  label: '回复邮件（博主）',
                  value: ReplyMailType.Owner,
                },
                {
                  label: '订阅邮件',
                  value: NewsletterMailType.Newsletter,
                },
              ]}
            />
          </NFormItem>
        </NForm>
        <div class="pb-4" />
        <TwoColGridLayout>
          <NGi
            span={18}
            class={
              isTemplateError.value && 'outline outline-[3px] outline-red-300'
            }
          >
            <CodeEditorForTemplateEditing
              onChange={(val) => {
                modifiedTemplate.value = val
              }}
              value={templateString.value}
            />
          </NGi>
          <NGi span={18} class="relative h-[calc(100vh-15rem)]">
            <EJSRender
              data={renderProps.value}
              template={modifiedTemplate.value}
              onError={(_err) => {
                isTemplateError.value = true
              }}
            />
          </NGi>
        </TwoColGridLayout>
      </div>
    )
  },
})
