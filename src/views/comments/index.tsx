import { CheckCircleRegular, Times, TrashAlt } from '@vicons/fa'
import { HeaderActionButton } from 'components/button/rounded-button'
import { Table } from 'components/table'
import { baseUrl } from 'constants/env'
import { useTable } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import { CommentModel, CommentsResponse } from 'models/comment'
import {
  NAvatar,
  NButton,
  NCard,
  NForm,
  NFormItemRow,
  NInput,
  NModal,
  NPopconfirm,
  NSpace,
  NTabPane,
  NTabs,
  useMessage,
} from 'naive-ui'
import { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import { RouteName } from 'router/constants'
import { RESTManager } from 'utils/rest'
import { relativeTimeFromNow } from 'utils/time'
import { defineComponent, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

enum CommentType {
  Pending,
  Marked,
  Trash,
}

const ManageComment = defineComponent(() => {
  const route = useRoute()
  const router = useRouter()
  const tabValue = ref((route.query.state as any | 0) ?? CommentType.Pending)

  const { data, checkedRowKeys, fetchDataFn, pager } = useTable<CommentModel>(
    (data, pager) => async (
      page = route.query.page || 1,
      size = 10,
      state: CommentType = route.query.state as any,
    ) => {
      const response = await RESTManager.api.comments.get<CommentsResponse>({
        params: {
          page,
          size,
          state: state | 0,
        },
      })
      data.value = response.data
      pager.value = response.page
    },
  )
  const message = useMessage()
  const replyDialogShow = ref<boolean>(false)
  const replyComment = ref<CommentModel | null>(null)
  const replyText = ref('')

  const onReplySubmit = async () => {
    if (!replyComment.value) {
      return
    }
    await RESTManager.api.comments.master.reply(replyComment.value.id).post({
      data: {
        text: replyText.value,
      },
    })
    replyDialogShow.value = false
    replyComment.value = null
    message.success('回复成功啦~')
    await fetchData()
  }

  const fetchData = fetchDataFn
  watch(
    () => route.query.page,
    async n => {
      // @ts-expect-error
      await fetchData(n)
    },
    { immediate: true },
  )

  watch(
    () => route.query.state,
    async _ => {
      await fetchData()
    },
    { immediate: true },
  )

  async function changeState(id: string | string[], state: CommentType) {
    if (Array.isArray(id)) {
      id.map(async i => {
        await RESTManager.api.comments(i).patch({ data: { state } })
      })
    } else {
      await RESTManager.api.comments(id).patch({ data: { state } })
    }
    message.success('操作完成')
    await fetchData()
  }

  async function handleDelete(id: string | string[]) {
    if (Array.isArray(id)) {
      id.map(async i => {
        try {
          await RESTManager.api.comments(i).delete()
        } catch {}
      })
    } else {
      await RESTManager.api.comments(id).delete()
    }
    await fetchData()
    message.success('删除成功')
  }
  const columns: TableColumns = reactive([
    {
      title: '',
      key: 'avatar',
      width: 60,
      render(row) {
        return <NAvatar circle src={row.avatar as any}></NAvatar>
      },
    },
    {
      title: '作者',
      key: 'author',
      width: 200,
      render(row, index) {
        return (
          <NSpace vertical size={2}>
            <a href={(row.url as any) || '#'} target="_blank">
              {row.author}
            </a>

            <a href={(('mailto:' + row.mail) as any) || ''} target="_blank">
              {row.mail as any}
            </a>

            <div>
              <span class="text-gray-400">{row.ip}</span>
            </div>
          </NSpace>
        )
      },
    },
    {
      title: '内容',
      key: 'text',
      render(row: any) {
        const link = (() => {
          switch (row.refType) {
            case 'Post': {
              return baseUrl + '/posts/' + row.ref.slug
            }
            case 'Note': {
              return baseUrl + '/notes/' + row.ref.nid
            }
            case 'Page': {
              return baseUrl + '/' + row.ref.slug
            }
          }
        })() as string
        return (
          <NSpace vertical size={2}>
            <NSpace size={5}>
              <span>{relativeTimeFromNow(row.created)}</span>
              <span>于</span>
              <a href={link} target="_blank">
                {row.ref.title}
              </a>
            </NSpace>
            <p>{row.text}</p>

            {row.parent && (
              <blockquote class="border-l-[3px] border-solid border-primary-default pl-[12px] my-2 ml-4">
                <NSpace size={2} align="center" class="text-gray-600">
                  <span>{row.parent.author}</span>
                  <span>在</span>
                  <span>{relativeTimeFromNow(row.parent.created)}说: </span>
                  <span>{row.parent.text}</span>
                </NSpace>
              </blockquote>
            )}

            <NSpace size="medium">
              {/* // TODO */}
              <NButton
                text
                size="tiny"
                type="success"
                onClick={() => changeState(row.id, 1)}
              >
                已读
              </NButton>
              <NButton
                text
                size="tiny"
                type="warning"
                onClick={() => changeState(row.id, 2)}
              >
                垃圾
              </NButton>
              <NButton
                text
                size="tiny"
                type="info"
                onClick={e => {
                  replyComment.value = row
                  replyDialogShow.value = true
                }}
              >
                回复
              </NButton>
              <NPopconfirm
                positiveText={'取消'}
                negativeText="删除"
                onNegativeClick={() => {
                  handleDelete(row.id)
                }}
              >
                {{
                  trigger: () => (
                    <NButton text size="tiny" type="error">
                      删除
                    </NButton>
                  ),

                  default: () => (
                    <span style={{ maxWidth: '12rem' }}>
                      确定要删除 {row.title} ?
                    </span>
                  ),
                }}
              </NPopconfirm>
            </NSpace>
          </NSpace>
        )
      },
    },
  ])

  return () => (
    <ContentLayout
      actionsElement={
        <Fragment>
          <HeaderActionButton
            name="已读"
            icon={<CheckCircleRegular />}
            variant="success"
          ></HeaderActionButton>

          <HeaderActionButton
            name="标记为垃圾"
            icon={<TrashAlt />}
            variant="warning"
          ></HeaderActionButton>

          <HeaderActionButton
            name="删除"
            icon={<Times />}
            variant="error"
          ></HeaderActionButton>
        </Fragment>
      }
    >
      <NTabs
        size="medium"
        value={tabValue.value}
        onUpdateValue={e => {
          tabValue.value = e
          router.push({ name: RouteName.Comment, query: { state: e } })
        }}
      >
        <NTabPane name={CommentType.Pending} tab="未读">
          <div class=""></div>
        </NTabPane>

        <NTabPane name={CommentType.Marked} tab="已读">
          <div class=""></div>
        </NTabPane>

        <NTabPane name={CommentType.Trash} tab="垃圾">
          <div class=""></div>
        </NTabPane>
      </NTabs>

      <Table
        data={data}
        onFetchData={fetchData}
        pager={pager}
        onUpdateCheckedRowKeys={keys => {
          checkedRowKeys.value = keys
        }}
        columns={[
          {
            type: 'selection',
            options: ['none', 'all'],
            width: 30,
          },
          ...columns,
        ]}
      />

      {/* reply dialog */}
      <NModal
        show={!!replyDialogShow.value}
        onUpdateShow={s => {
          if (!s) {
            replyDialogShow.value = s
          }
        }}
      >
        {replyComment.value && (
          <NCard
            style="width: 400px;"
            headerStyle={{ textAlign: 'center' }}
            title={'回复: ' + replyComment.value.author}
          >
            <NForm onSubmit={onReplySubmit}>
              <NFormItemRow label={replyComment.value.author + ' 说:'}>
                <NInput
                  disabled
                  value={replyComment.value.text}
                  type="textarea"
                  autosize={{ minRows: 4, maxRows: 10 }}
                ></NInput>
              </NFormItemRow>

              <NFormItemRow label={'回复内容'}>
                <NInput
                  value={replyText.value}
                  type="textarea"
                  onInput={e => (replyText.value = e)}
                  autosize={{ minRows: 4, maxRows: 10 }}
                ></NInput>
              </NFormItemRow>

              <div class="text-right">
                <NSpace size={12} align="center" inline>
                  <NButton type="success" onClick={onReplySubmit} round>
                    确定
                  </NButton>
                  <NButton
                    onClick={() => (replyDialogShow.value = false)}
                    round
                  >
                    取消
                  </NButton>
                </NSpace>
              </div>
            </NForm>
          </NCard>
        )}
      </NModal>
    </ContentLayout>
  )
})

export default ManageComment
