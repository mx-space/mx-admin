import { EventSourcePolyfill } from 'event-source-polyfill'
import { getToken } from 'utils/auth'
import { RESTManager } from 'utils/rest'
import type { Ref } from 'vue'

export const useEventStreamInstallDependencies = (
  streamData: Ref<string[]>,
  packageName: string | string[],
  onFinish?: () => void,
) => {
  const event = new EventSourcePolyfill(
    `${RESTManager.endpoint}/dependencies/install_deps?packageNames=${
      Array.isArray(packageName) ? packageName.join(',') : packageName
    }`,
    {
      headers: {
        Authorization: getToken()!,
      },
    },
  )

  event.onmessage = (e) => {
    streamData.value.push(e.data)
    if (e.data === '任务完成，可关闭此窗口。') {
      event.close()
      onFinish?.()
    }
  }
  event.onerror = (e: any) => {
    event.close()
    if (e?.data) {
      message.error(e.data)
    } else {
      console.error(e)
      message.error('执行发生未知错误')
    }
  }
}
