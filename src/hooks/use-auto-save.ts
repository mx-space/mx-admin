import { toRaw } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { z } from 'zod'

import { useStorageObject } from './use-storage'

const SaveSchema = z.object({
  savedTime: z.string().default(''),
  text: z.string().default(''),
  title: z.string().default(''),
})

type SaveDto = z.infer<typeof SaveSchema>

// TODO
export const useAutoSave = (
  cacheKey: string,
  interval: number,
  getSaveData: () => Omit<SaveDto, 'savedTime'>,
) => {
  let timer: any
  const key = `auto-save-${cacheKey}`
  const { storage, reset, clear, destory } = useStorageObject(
    SaveSchema,
    key,
    false,
  )
  let memoPreviousValue = getSaveData()
  const save = () => {
    const { text, title } = getSaveData()
    if (!text && !title) {
      return
    }
    if (memoPreviousValue.text == text && memoPreviousValue.title == title) {
      return
    } else {
      memoPreviousValue = { text, title }
    }
    Object.assign(storage, {
      savedTime: new Date().toISOString(),
      text,
      title,
    } as SaveDto)

    console.log('saved data:', storage)
  }

  function disposer() {
    clearInterval(timer)
  }

  onUnmounted(() => {
    destory()
  })
  return {
    reset,
    getPrevSaved() {
      return { ...toRaw(storage) }
    },
    save,
    track() {
      disposer()
      save()
      timer = setInterval(save, interval)
    },
    disposer,
    clearSaved: clear,
  }
}

export const useAutoSaveInEditor = <T extends { text: string; title: string }>(
  data: T,
  hook: ReturnType<typeof useAutoSave>,
) => {
  const { disposer, clearSaved, getPrevSaved, save, track } = hook

  const dialog = window.dialog

  const check = async () => {
    const prevSaved = getPrevSaved()

    console.log('prev saved:', prevSaved)

    if (
      (prevSaved.text || prevSaved.title) &&
      (prevSaved.text !== data.text || prevSaved.title !== data.title)
    ) {
      requestAnimationFrame(() => {
        dialog.info({
          title: '检测到未保存的内容，是否恢复？',
          negativeText: '清除',
          positiveText: '恢复',
          onNegativeClick() {
            clearSaved()
          },
          onPositiveClick() {
            Object.assign(data, {
              text: prevSaved.text,
              title: prevSaved.title,
            })
          },
        })
      })
    }
  }

  // const initialSaved = getPrevSaved()
  onBeforeRouteLeave(() => {
    save()
    // if (initialSaved.text == data.text && initialSaved.title == data.title) {
    //   clearSaved()
    // }
    disposer()
  })

  return {
    ...hook,
    enable() {
      check()
      track()
    },
  }
}
