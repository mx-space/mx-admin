import { defineComponent, ref } from 'vue'

import { ShellOutputXterm } from '~/components/output-modal/xterm'
import { API_URL } from '~/constants/env'

export const InstallDepsXterm = defineComponent({
  setup(_, { expose }) {
    const $shell = ref<any>()
    expose({
      install(pkg: string | string[], onFinish?: () => any) {
        $shell.value.run(
          `${API_URL}/dependencies/install_deps?packageNames=${
            Array.isArray(pkg) ? pkg.join(',') : pkg
          }`,
          onFinish,
        )
      },
    })

    return () => <ShellOutputXterm ref={$shell} />
  },
})
