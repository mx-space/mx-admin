import {
  Plus as AddIcon,
  FolderOpen,
  Hash,
  Pencil,
  Tag as TagIcon,
  Trash2,
} from 'lucide-vue-next'
import {
  NButton,
  NCard,
  NForm,
  NFormItemRow,
  NInput,
  NModal,
  NPopconfirm,
  NSkeleton,
} from 'naive-ui'
import {
  computed,
  defineComponent,
  reactive,
  ref,
  watch,
  watchEffect,
} from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import type { TagModel } from '~/models/category'
import type { Ref } from 'vue'

import { useMutation } from '@tanstack/vue-query'

import { categoriesApi } from '~/api/categories'
import { HeaderActionButton } from '~/components/button/header-action-button'
import {
  usePostsByTagQuery,
  useTagsQuery,
} from '~/hooks/queries/use-categories'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useLayout } from '~/layouts/content'
import { CategoryStore } from '~/stores/category'

export const CategoryView = defineComponent((_props) => {
  const categoryStore = useStoreRef(CategoryStore)
  const { data: tagsData, isLoading: tagsLoading } = useTagsQuery()
  const tags = computed(() => tagsData.value ?? [])

  const checkedTag = ref('')
  const { data: tagPostsData, isLoading: tagPostsLoading } =
    usePostsByTagQuery(checkedTag)
  const checkedTagPosts = computed(() => tagPostsData.value ?? [])

  const loading = ref(true)
  const fetchCategory = categoryStore.fetch

  watchEffect(async () => {
    loading.value = true
    await fetchCategory()
    loading.value = false
  })

  const showDialog = ref<boolean | string>(false)
  const resetState = () => ({ name: '', slug: '' })
  const editCategoryState = ref<CategoryState>(resetState())

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: async () => {
      toast.success('删除成功')
      await categoryStore.fetch(true)
    },
  })

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: (category) => {
      toast.success('创建成功')
      categoryStore.data.value!.push(category)
      showDialog.value = false
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { name: string; slug: string; type: number }
    }) => categoriesApi.update(id, data),
    onSuccess: (_, { id, data }) => {
      toast.success('修改成功')
      const index = categoryStore.data.value!.findIndex((i) => i.id == id)
      if (index !== -1) {
        categoryStore.data.value![index] = {
          ...categoryStore.data.value![index],
          name: data.name,
          slug: data.slug,
        }
      }
      showDialog.value = false
    },
  })

  const { setActions } = useLayout()
  setActions(
    <HeaderActionButton
      variant="success"
      icon={<AddIcon />}
      name="新建分类"
      onClick={() => {
        showDialog.value = true
        editCategoryState.value = resetState()
      }}
    />,
  )

  return () => (
    <div class="space-y-8">
      <section>
        <div class="mb-4 flex items-center gap-2">
          <FolderOpen class="size-5 text-neutral-500" aria-hidden="true" />
          <h2 class="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            分类
          </h2>
          <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {categoryStore.data.value?.length || 0}
          </span>
        </div>

        {loading.value ? (
          <CategoryListSkeleton />
        ) : !categoryStore.data.value?.length ? (
          <CategoryEmptyState
            onAdd={() => {
              showDialog.value = true
              editCategoryState.value = resetState()
            }}
          />
        ) : (
          <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {categoryStore.data.value.map((category) => (
              <CategoryListItem
                key={category.id}
                category={category}
                onEdit={(id) => {
                  const cat = categoryStore.data.value?.find((c) => c.id === id)
                  if (cat) {
                    editCategoryState.value = {
                      name: cat.name,
                      slug: cat.slug,
                    }
                    showDialog.value = id
                  }
                }}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div class="mb-4 flex items-center gap-2">
          <TagIcon class="size-5 text-neutral-500" aria-hidden="true" />
          <h2 class="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            标签
          </h2>
          <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {tags.value.length}
          </span>
        </div>

        {tagsLoading.value ? (
          <TagListSkeleton />
        ) : tags.value.length === 0 ? (
          <TagEmptyState />
        ) : (
          <div class="flex flex-wrap gap-2">
            {tags.value.map((tag) => (
              <TagChip
                key={tag.name}
                tag={tag}
                selected={checkedTag.value === tag.name}
                onSelect={(name) => {
                  checkedTag.value = checkedTag.value === name ? '' : name
                }}
              />
            ))}
          </div>
        )}

        {checkedTag.value && (
          <div class="mt-4">
            <h3 class="mb-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
              「{checkedTag.value}」关联的文章
            </h3>
            {tagPostsLoading.value ? (
              <div class="animate-pulse space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    class="h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800"
                  />
                ))}
              </div>
            ) : checkedTagPosts.value.length === 0 ? (
              <p class="text-sm text-neutral-500">暂无关联文章</p>
            ) : (
              <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                {checkedTagPosts.value.map((post) => (
                  <RouterLink
                    key={post.id}
                    to={`/posts/edit?id=${post.id}`}
                    class="flex items-center justify-between border-b border-neutral-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                  >
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">
                      {post.title}
                    </span>
                    <span class="text-sm text-neutral-500">
                      {post.category?.name}
                    </span>
                  </RouterLink>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <EditCategoryDialog
        show={showDialog}
        onSubmit={(state) => {
          const { name, slug } = state
          const id =
            typeof showDialog.value == 'string' ? showDialog.value : null
          if (!id) {
            createMutation.mutate({ name, slug })
          } else {
            updateMutation.mutate({ id, data: { name, slug, type: 0 } })
          }
        }}
        initialState={editCategoryState.value}
      />
    </div>
  )
})

const CategoryListItem = defineComponent({
  props: {
    category: {
      type: Object as () => {
        id: string
        name: string
        slug: string
        count?: number
      },
      required: true,
    },
    onEdit: {
      type: Function as unknown as () => (id: string) => void,
      required: true,
    },
    onDelete: {
      type: Function as unknown as () => (id: string) => void,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="group relative flex items-center gap-4 border-b border-neutral-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <FolderOpen class="size-5 text-neutral-500" aria-hidden="true" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h3 class="truncate font-medium text-neutral-900 dark:text-neutral-100">
              {props.category.name}
            </h3>
            <span class="flex shrink-0 items-center gap-1 text-sm text-neutral-400">
              <Hash class="size-3.5" aria-hidden="true" />
              <span class="font-mono">{props.category.slug}</span>
            </span>
          </div>
        </div>

        <div class="shrink-0 transition-opacity group-hover:opacity-0">
          <span class="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {props.category.count || 0} 篇
          </span>
        </div>

        <div class="absolute right-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <NButton
            size="tiny"
            quaternary
            type="primary"
            onClick={() => props.onEdit(props.category.id)}
            aria-label={`编辑分类 ${props.category.name}`}
          >
            {{
              icon: () => <Pencil class="size-3.5" />,
              default: () => '编辑',
            }}
          </NButton>

          <NPopconfirm
            positiveText="取消"
            negativeText="删除"
            onNegativeClick={() => props.onDelete(props.category.id)}
          >
            {{
              trigger: () => (
                <NButton
                  size="tiny"
                  quaternary
                  type="error"
                  aria-label={`删除分类 ${props.category.name}`}
                >
                  {{
                    icon: () => <Trash2 class="size-3.5" />,
                    default: () => '删除',
                  }}
                </NButton>
              ),
              default: () => (
                <span class="max-w-48">
                  确定要删除分类「{props.category.name}」吗？
                </span>
              ),
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})

const TagChip = defineComponent({
  props: {
    tag: {
      type: Object as () => TagModel,
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    onSelect: {
      type: Function as unknown as () => (name: string) => void,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <button
        type="button"
        onClick={() => props.onSelect(props.tag.name)}
        aria-pressed={props.selected}
        aria-label={`标签 ${props.tag.name}，${props.tag.count} 篇文章`}
        class={[
          'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900',
          props.selected
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
        ]}
      >
        <span>{props.tag.name}</span>
        <span
          class={[
            'rounded-full px-1.5 py-0.5 text-xs',
            props.selected
              ? 'bg-white/20 text-white dark:bg-neutral-900/20 dark:text-neutral-900'
              : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400',
          ]}
        >
          {props.tag.count}
        </span>
      </button>
    )
  },
})

const CategoryEmptyState = defineComponent({
  props: {
    onAdd: {
      type: Function as unknown as () => () => void,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-12 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div class="mb-4 flex size-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <FolderOpen class="size-7 text-neutral-400" aria-hidden="true" />
        </div>
        <h3 class="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
          暂无分类
        </h3>
        <p class="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
          创建分类来组织你的文章
        </p>
        <NButton type="primary" onClick={props.onAdd}>
          创建第一个分类
        </NButton>
      </div>
    )
  },
})

const TagEmptyState = defineComponent({
  setup() {
    return () => (
      <div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-10 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div class="mb-3 flex size-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <TagIcon class="size-6 text-neutral-400" aria-hidden="true" />
        </div>
        <h3 class="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
          暂无标签
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          在文章中添加标签后会自动显示在这里
        </p>
      </div>
    )
  },
})

const CategoryListSkeleton = defineComponent({
  setup() {
    return () => (
      <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            class="flex items-center gap-4 border-b border-neutral-100 px-4 py-3 last:border-b-0 dark:border-neutral-800"
          >
            <NSkeleton width={40} height={40} class="rounded-lg" />
            <div class="flex-1">
              <NSkeleton width="30%" height={20} class="rounded" />
            </div>
            <NSkeleton width={50} height={24} class="rounded-full" />
          </div>
        ))}
      </div>
    )
  },
})

const TagListSkeleton = defineComponent({
  setup() {
    return () => (
      <div class="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <NSkeleton
            key={i}
            width={80 + Math.random() * 40}
            height={32}
            class="rounded-full"
          />
        ))}
      </div>
    )
  },
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
  const handleSubmit = () => {
    if (!state.name || !state.slug) {
      toast.error('名称和路径不能为空')
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
            style="width: 480px; max-width: 90vw"
            headerStyle={{ textAlign: 'center' }}
            title={
              typeof props.show.value === 'string' ? '编辑分类' : '新建分类'
            }
            bordered={false}
            class="!rounded-xl"
          >
            <NForm onSubmit={handleSubmit} model={state}>
              <NFormItemRow
                path="name"
                label="名称"
                rule={{
                  required: true,
                  message: '请输入分类名称',
                  trigger: ['input', 'blur'],
                }}
              >
                <NInput
                  placeholder="输入分类名称…"
                  onInput={(e) => {
                    state.name = e
                  }}
                  value={state.name}
                  autofocus
                  inputProps={{ autocomplete: 'off' }}
                />
              </NFormItemRow>

              <NFormItemRow
                path="slug"
                label="路径"
                rule={{
                  required: true,
                  message: '请输入分类路径',
                  trigger: ['input', 'blur'],
                }}
              >
                <NInput
                  placeholder="输入分类路径…"
                  onInput={(e) => {
                    state.slug = e
                  }}
                  value={state.slug}
                  inputProps={{ autocomplete: 'off' }}
                />
              </NFormItemRow>

              <div class="mt-6 flex justify-end gap-3">
                <NButton onClick={() => (props.show.value = false)} round>
                  取消
                </NButton>
                <NButton type="primary" onClick={handleSubmit} round>
                  确定
                </NButton>
              </div>
            </NForm>
          </NCard>
        ),
      }}
    </NModal>
  )
})
;(EditCategoryDialog as any).props = [
  'initialState',
  'onSubmit',
  'show',
] as const
