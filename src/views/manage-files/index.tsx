import { HeaderActionButton } from 'components/button/rounded-button'
import { ArchiveIcon, UploadIcon } from 'components/icons'
import { Table } from 'components/table'
import { ContentLayout } from 'layouts/content'
import type { UploadFileInfo } from 'naive-ui'
import {
  NButton,
  NButtonGroup,
  NCard,
  NIcon,
  NImage,
  NModal,
  NPopconfirm,
  NPopover,
  NTabPane,
  NTabs,
  NText,
  NUpload,
  NUploadDragger,
} from 'naive-ui'
import { RESTManager, getToken } from 'utils'
import { defineComponent } from 'vue'

type FileType = 'file' | 'icon' | 'photo' | 'avatar'

export default defineComponent({
  setup() {
    const type = ref<FileType>('icon')

    const list = ref([] as { url: string; name: string }[])

    watch(
      () => type.value,
      () => {
        fetch()
      },
    )

    onMounted(() => {
      fetch()
    })
    const loading = ref(false)

    const fetch = () => {
      loading.value = true
      RESTManager.api
        .files(type.value)
        .get<any>()
        .then(({ data }) => {
          list.value = data
          loading.value = false
        })
    }

    const modalShow = ref(false)
    const checkUploadFile = async (data: {
      file: UploadFileInfo
      fileList: UploadFileInfo[]
    }) => {
      if (type.value === 'icon') {
        if (data.file.file?.type.startsWith('image')) {
          return true
        }
        message.error('只能上传图片文件，请重新上传')
      }

      return false
    }

    const handleFinish = ({
      file,
      event,
    }: {
      file: UploadFileInfo
      event?: ProgressEvent
    }) => {
      const xhr = event?.target as XMLHttpRequest
      const { url, name } = JSON.parse(xhr.responseText)

      file.name = name
      file.url = url

      list.value.unshift({
        url,
        name,
      })

      return file
    }

    return () => (
      <ContentLayout
        actionsElement={
          <>
            <HeaderActionButton
              variant="info"
              onClick={() => {
                modalShow.value = true
              }}
              icon={<UploadIcon />}
            ></HeaderActionButton>
          </>
        }
      >
        <NTabs
          value={type.value}
          onUpdateValue={(val) => {
            type.value = val
          }}
        >
          <NTabPane tab={'图标'} name={'icon'}></NTabPane>
          <NTabPane tab={'头像'} name={'avatar'}></NTabPane>
        </NTabs>
        <Table
          loading={loading.value}
          data={list}
          columns={[
            {
              key: 'name',
              title: '文件名',
              width: 300,
              ellipsis: {
                lineClamp: 1,
                tooltip: true,
              },
            },
            {
              key: 'url',
              title: 'URL',
              render(row) {
                return (
                  <NPopover placement="bottom" class={'w-[400px]'}>
                    {{
                      trigger() {
                        return (
                          <a href={row.url} target="_blank">
                            {row.url}
                          </a>
                        )
                      },
                      default() {
                        return (
                          <NCard bordered>
                            <NImage src={row.url} />
                          </NCard>
                        )
                      },
                    }}
                  </NPopover>
                )
              },
            },
            {
              key: 'action',
              title: '操作',
              width: 150,
              render(row) {
                return (
                  <NButtonGroup>
                    <NPopconfirm
                      onPositiveClick={() => {
                        RESTManager.api
                          .files(type.value)(row.name)
                          .delete()
                          .then(() => {
                            message.success('删除成功')
                            list.value = list.value.filter(
                              (item) => item.name !== row.name,
                            )
                          })
                      }}
                    >
                      {{
                        trigger() {
                          return (
                            <NButton text type="error" tertiary size="tiny">
                              删除
                            </NButton>
                          )
                        },
                        default() {
                          return `确定要删除 ${row.name} 吗？`
                        },
                      }}
                    </NPopconfirm>
                  </NButtonGroup>
                )
              },
            },
          ]}
        />

        <NModal
          closable
          closeOnEsc
          show={modalShow.value}
          onUpdateShow={(s) => {
            modalShow.value = s
          }}
        >
          <NCard
            title="文件上传"
            class={'modal-card sm flex justify-center'}
            closable
          >
            <NUpload
              class={'flex flex-col items-center w-full'}
              headers={{
                authorization: getToken() || '',
              }}
              action={`${RESTManager.endpoint}/files/upload?type=${type.value}`}
              directory-dnd
              multiple
              onBeforeUpload={checkUploadFile}
              onFinish={handleFinish}
              onError={(e) => {
                const xhr = e.event?.target as XMLHttpRequest
                e.file.status = 'error'
                if (!xhr) {
                  message.warning('网络异常')
                  return e.file
                }
                const { message: errMessage } = JSON.parse(xhr.responseText)
                message.warning(errMessage)
                return e.file
              }}
            >
              <NUploadDragger
                class={
                  'flex flex-col items-center justify-center w-full m-auto py-28'
                }
              >
                <NIcon size="48" depth="3">
                  <ArchiveIcon />
                </NIcon>
                <NText class={'mt-2'}>点击或者拖动文件到该区域来上传</NText>
              </NUploadDragger>
            </NUpload>
          </NCard>
        </NModal>
      </ContentLayout>
    )
  },
})
