import { HeaderActionButton } from 'components/button/rounded-button'
import { AddIcon } from 'components/icons'
import { tableRowStyle } from 'components/table'
import { useStoreRef } from 'hooks/use-store-ref'
import { ContentLayout } from 'layouts/content'
import type { TagModel } from 'models/category'
import type { PostModel } from 'models/post'
import {
  NBadge,
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItemRow,
  NH3,
  NInput,
  NModal,
  NPopconfirm,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui'
import { CategoryStore } from 'stores/category'
import { RESTManager } from 'utils/rest'
import type { Ref } from 'vue'
import { defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

export const CategoryView = defineComponent((props) => {
  const categoryStore = useStoreRef(CategoryStore)

  const tags = reactive<TagModel[]>([])
  const loading = ref(true)
  const fetchCategory = categoryStore.fetch

  const message = useMessage()
  onMounted(async () => {
    loading.value = true
    await fetchCategory()
    loading.value = false
    const { data: $tags } = (await RESTManager.api.categories.get({
      params: { type: 'tag' },
    })) as any

    tags.push(...$tags)
  })

  const checkedTag = ref('')
  const checkedTagPosts = reactive<PostModel[]>([])

  watch(
    () => checkedTag.value,
    async (name) => {
      if (!name) {
        return
      }
      const res = (await RESTManager.api
        .categories(name)
        .get({ params: { tag: 'true' } })) as any
      checkedTagPosts.length = 0
      checkedTagPosts.push(...res.data)
    },
  )

  const showDialog = ref<boolean | string>(false)
  const resetState = () => ({ name: '', slug: '' })
  const editCategoryState = ref<CategoryState>(resetState())
  return () => (
    <ContentLayout
      actionsElement={
        <>
          <HeaderActionButton
            variant="success"
            icon={<AddIcon />}
            onClick={() => {
              showDialog.value = true
              editCategoryState.value = resetState()
            }}
          ></HeaderActionButton>
        </>
      }
    >
      <NH3 prefix="bar">??????</NH3>

      {/* Action */}
      <EditCategoryDialog
        show={showDialog}
        onSubmit={async (state) => {
          const { name, slug } = state
          const id =
            typeof showDialog.value == 'string' ? showDialog.value : null
          if (!id) {
            const payload = (await RESTManager.api.categories.post({
              data: {
                name,
                slug,
              },
            })) as any
            message.success('????????????')
            categoryStore.data.value!.push(payload.data)
          } else {
            await RESTManager.api.categories(id).put({
              data: {
                name,
                slug,
                type: 0,
              },
            })

            message.success('????????????')

            const index = categoryStore.data.value!.findIndex((i) => i.id == id)
            categoryStore.data.value![index] = {
              ...categoryStore.data.value![index],
              ...state,
            }
          }
        }}
        initialState={editCategoryState.value}
      />

      <NDataTable
        rowClassName={() => tableRowStyle}
        bordered={false}
        data={categoryStore.data.value || []}
        remote
        loading={loading.value}
        columns={[
          { title: '??????', key: 'name' },
          { title: '???', key: 'count' },
          { title: '??????', key: 'slug', width: 300 },
          {
            width: 300,
            title: '??????',
            fixed: 'right',
            key: 'id',
            render(row) {
              return (
                <NSpace size={12}>
                  <NButton
                    size="tiny"
                    text
                    type="primary"
                    onClick={(e) => {
                      editCategoryState.value = {
                        name: row.name,
                        slug: row.slug,
                      }

                      showDialog.value = row.id
                    }}
                  >
                    ??????
                  </NButton>

                  <NPopconfirm
                    positiveText={'??????'}
                    negativeText="??????"
                    onNegativeClick={async () => {
                      await RESTManager.api.categories(row.id).delete()
                      message.success('????????????')
                      await categoryStore.fetch(true)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton text type="error" size="tiny">
                          ??????
                        </NButton>
                      ),

                      default: () => (
                        <span class="max-w-48">??????????????? {row.title} ?</span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          },
        ]}
      />

      <NH3 prefix="bar">??????</NH3>
      <NSpace size={12}>
        {tags.map((tag) => {
          return (
            <NBadge value={tag.count} key={tag.name}>
              <NTag
                class="border-gray-200 border"
                round
                type="success"
                checkable
                bordered
                checked={checkedTag.value == tag.name}
                onUpdateChecked={(check) => {
                  if (check) {
                    checkedTag.value = tag.name
                  }
                }}
              >
                {tag.name}
              </NTag>
            </NBadge>
          )
        })}
      </NSpace>

      {checkedTagPosts.length != 0 && (
        <NDataTable
          remote
          class="mt-4"
          data={checkedTagPosts}
          columns={[
            {
              title: '??????',
              key: 'title',
              render(row) {
                return (
                  <RouterLink to={`/posts/edit?id=${row.id}`}>
                    <NButton type="primary" text>
                      {row.title}
                    </NButton>
                  </RouterLink>
                )
              },
            },
            {
              title: '??????',
              key: 'category',
              render(row) {
                return row.category.name
              },
            },
          ]}
        />
      )}
    </ContentLayout>
  )
})

type CategoryState = {
  name: string
  slug: string
}
const EditCategoryDialog = defineComponent<{
  initialState?: CategoryState
  onSubmit: (state: CategoryState) => void
  show: Ref<boolean | string>
}>((props) => {
  const state = reactive<CategoryState>(
    props.initialState ?? { name: '', slug: '' },
  )

  watch(
    () => props.initialState,
    (n) => {
      if (n) {
        state.name = n.name
        state.slug = n.slug
      }
    },
  )
  const message = useMessage()
  const onSubmit = () => {
    if (!state.name || !state.slug) {
      message.error('?????? ??? ?????? ????????????')
      return
    }
    props.onSubmit(state)
    props.show.value = false
  }

  return () => (
    <NModal
      transformOrigin="center"
      show={!!props.show.value}
      onUpdateShow={(s) => {
        props.show.value = s
      }}
    >
      {{
        default: () => (
          <NCard
            style="width: 500px;max-width: 90vw"
            headerStyle={{ textAlign: 'center' }}
            title={props.initialState ? '??????' : '??????'}
          >
            <NForm
              onSubmit={onSubmit}
              model={state}
              rules={{
                name: {
                  required: true,
                  trigger: ['input', 'blur'],
                },
                slug: {
                  required: true,
                  trigger: ['input', 'blur'],
                },
              }}
            >
              <NFormItemRow path="name" label="??????">
                <NInput
                  placeholder=""
                  onInput={(e) => {
                    state.name = e
                  }}
                  value={state.name}
                ></NInput>
              </NFormItemRow>

              <NFormItemRow path="slug" label="??????">
                <NInput
                  placeholder=""
                  onInput={(e) => {
                    state.slug = e
                  }}
                  value={state.slug}
                ></NInput>
              </NFormItemRow>

              <div class="text-center">
                <NSpace size={12} align="center" inline>
                  <NButton type="success" onClick={onSubmit} round>
                    ??????
                  </NButton>
                  <NButton onClick={() => (props.show.value = false)} round>
                    ??????
                  </NButton>
                </NSpace>
              </div>
            </NForm>
          </NCard>
        ),
      }}
    </NModal>
  )
})

EditCategoryDialog.props = ['initialState', 'onSubmit', 'show'] as const
