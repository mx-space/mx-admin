import { NButton, NInput, useDialog } from 'naive-ui'
import { defineComponent, onMounted, ref } from 'vue'
import type { IGithubRepo } from '~/external/api/github-repo'
import type { PropType } from 'vue'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { getRepoDetail, getRepoReadme } from '~/external/api/github-repo'

const GithubIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24">
    <path
      d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
      fill="currentColor"
    />
  </svg>
)

export const FetchGithubRepoButton = defineComponent({
  props: {
    onData: {
      type: Function as PropType<
        (data: IGithubRepo, readme?: string | null) => void
      >,
      required: true,
    },
    defaultValue: {
      type: String,
    },
  },
  setup(props) {
    const dialog = useDialog()
    const handleParseFromGithub = () => {
      const instance = dialog.create({
        title: '从 GitHub 解析',
        content: () => {
          const Comp = defineComponent({
            setup() {
              const url = ref(props.defaultValue ?? '')
              const loading = ref(false)
              const handleFetch = async () => {
                loading.value = true
                const repoUrl = url.value.replace(/\.git$/, '')
                const repoFullName = repoUrl.replace(
                  /^https?:\/\/github.com\//,
                  '',
                )
                const [owner, repo] = repoFullName.split('/')
                const [data, readme] = await Promise.all([
                  getRepoDetail(owner, repo),
                  getRepoReadme(owner, repo),
                ])

                props.onData(data, readme)
                loading.value = false
                requestAnimationFrame(() => {
                  instance.destroy()
                })
              }
              const inputRef = ref()

              onMounted(() => {
                setTimeout(() => {
                  inputRef.value.focus()
                }, 10)
              })
              return () => (
                <>
                  <NInput
                    ref={inputRef}
                    onKeydown={(e) => {
                      if (e.code === 'Enter') {
                        handleFetch()
                      }
                    }}
                    class="my-4"
                    value={url.value}
                    placeholder="在此输入项目地址"
                    onUpdateValue={(val) => void (url.value = val)}
                  />
                  <div class="flex justify-end space-x-4">
                    <NButton
                      type="primary"
                      round
                      onClick={handleFetch}
                      loading={loading.value}
                    >
                      获取
                    </NButton>
                  </div>
                </>
              )
            },
          })

          return <Comp />
        },
      })
    }

    return () => (
      <HeaderActionButton
        icon={<GithubIcon />}
        name="从 GitHub 获取"
        onClick={handleParseFromGithub}
      />
    )
  },
})
