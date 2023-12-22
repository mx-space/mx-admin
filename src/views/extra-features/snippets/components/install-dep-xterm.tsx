import { ShellOutputXterm } from 'components/output-modal/xterm'
import { RESTManager } from 'utils'

export const InstallDepsXterm = defineComponent({
  setup(_, { expose }) {
    const $shell = ref<any>()
    expose({
      install(pkg: string | string[], onFinish?: () => any) {
        $shell.value.run(
          `${RESTManager.endpoint}/dependencies/install_deps?packageNames=${
            Array.isArray(pkg) ? pkg.join(',') : pkg
          }`,
          onFinish,
        )
      },
    })

    return () => <ShellOutputXterm ref={$shell} />
  },
})
