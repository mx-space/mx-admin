import TrashSharp from '@vicons/ionicons5/es/TrashSharp'
import UndoRound from '@vicons/material/es/UndoRound'
import RedoRound from '@vicons/material/es/RedoRound'

import { HeaderActionButton } from 'components/button/rounded-button'
import { Table } from 'components/table'
import { useTable } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import { NButton, NPopconfirm, NSpace, useDialog } from 'naive-ui'
import { socket } from 'socket'
import { responseBlobToFile, RESTManager } from 'utils'
import { defineComponent, onBeforeMount } from 'vue'

export default defineComponent(() => {
  const { checkedRowKeys, data, fetchDataFn } = useTable<{
    filename: string
    size: string
  }>((data) => async () => {
    const response = (await RESTManager.api.backups.get()) as any
    // sort by filename
    const data$ = response.data as { filename: string; size: string }[]
    data$.sort((b, a) => a.filename.localeCompare(b.filename))

    data.value = data$ as any
  })
  onBeforeMount(() => {
    fetchDataFn()
  })
  const dialog = useDialog()
  const handleBackup = async () => {
    const info = message.info('备份中', { duration: 10e8, closable: true })

    const blob = await RESTManager.api.backups.new.get({
      responseType: 'blob',
      timeout: 10e8,
    })
    info.destroy()
    message.success('备份完成')
    responseBlobToFile(blob, 'backup.zip')
  }
  const handleUploadAndRestore = async () => {
    const $file = document.createElement('input')
    $file.type = 'file'
    $file.style.cssText = `position: absolute; opacity: 0; z-index: -9999;top: 0; left: 0`
    $file.accept = '.zip'
    document.body.append($file)
    $file.click()
    $file.onchange = () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const file = $file.files![0]
      const formData = new FormData()
      formData.append('file', file)
      RESTManager.api.backups
        .post({
          data: formData,
          timeout: Infinity,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then(() => {
          message.success('恢复成功, 页面将会重载')
          setTimeout(() => {
            location.reload()
          }, 1000)
        })
    }
  }
  const handleDelete = async (filename: string | string[]) => {
    let files = ''
    if (Array.isArray(filename)) {
      files = filename.join(',')
    } else {
      files = filename
    }
    await RESTManager.api.backups.delete({
      params: {
        files,
      },
    })

    message.success('删除成功')
    if (Array.isArray(filename)) {
      filename.forEach((filename) => {
        const index = data.value.findIndex((i) => i.filename === filename)
        if (index != -1) {
          data.value.splice(index, 1)
        }
      })
    } else {
      const index = data.value.findIndex((i) => i.filename === filename)
      if (index != -1) {
        data.value.splice(index, 1)
      }
    }
  }
  const handleRollback = async (filename: string) => {
    await RESTManager.api.backups(filename).patch({
      // TODO socket id
      params: { sid: socket.socket.id },
    })
  }
  const handleDownload = async (filename: string) => {
    const info = message.info('下载中', { duration: 10e8, closable: true })
    const blob = await RESTManager.api.backups(filename).get({
      responseType: 'blob',
      timeout: 10e8,
      getResponse: true,
    })
    info.destroy()
    message.success('下载完成')

    responseBlobToFile(blob, filename + '.zip')
  }

  return () => (
    <ContentLayout
      actionsElement={
        <>
          <HeaderActionButton
            icon={<UndoRound />}
            name="立即备份"
            variant="primary"
            onClick={handleBackup}
          ></HeaderActionButton>
          <HeaderActionButton
            icon={<RedoRound />}
            onClick={handleUploadAndRestore}
            name="上传恢复"
            variant="info"
          ></HeaderActionButton>
          <HeaderActionButton
            icon={<TrashSharp />}
            name="批量删除"
            variant="error"
            disabled={!checkedRowKeys.value.length}
            onClick={() => {
              dialog.warning({
                title: '警告',
                content: '你确定要删除多个备份？',
                positiveText: '达咩',
                negativeText: '确定',
                onNegativeClick: async () => {
                  handleDelete(checkedRowKeys.value)
                },
              })
            }}
          ></HeaderActionButton>
        </>
      }
    >
      <Table
        {...{ data, fetchDataFn }}
        checkedRowKey="filename"
        nTableProps={{
          maxHeight: 'calc(100vh - 17rem)',
          virtualScroll: true,
        }}
        onUpdateCheckedRowKeys={(keys) => {
          checkedRowKeys.value = keys
        }}
        maxWidth={500}
        columns={[
          {
            type: 'selection',
            options: ['none', 'all'],
          },

          { title: '日期', key: 'filename' },
          { title: '大小', key: 'size', width: 200 },
          {
            title: '操作',
            fixed: 'right',
            key: 'filename',
            render(row) {
              const filename = row.filename
              return (
                <NSpace inline>
                  <NButton
                    text
                    size="tiny"
                    type="primary"
                    onClick={() => void handleDownload(filename)}
                  >
                    下载
                  </NButton>

                  <NButton
                    text
                    size="tiny"
                    type="warning"
                    onClick={() => void handleRollback(filename)}
                  >
                    回退
                  </NButton>

                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={() => {
                      handleDelete(filename)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton text size="tiny" type="error">
                          移除
                        </NButton>
                      ),

                      default: () => (
                        <span style={{ maxWidth: '12rem' }}>确定要删除?</span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          },
        ]}
        noPagination
      ></Table>
    </ContentLayout>
  )
})
