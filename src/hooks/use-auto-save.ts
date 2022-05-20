import { IsISO8601, IsString } from 'class-validator'
import { toRaw } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useStorageObject } from './use-storage'

class SaveDto {
  @IsISO8601()
  savedTime!: string

  @IsString()
  text!: string

  @IsString()
  title!: string
}
// TODO
export const useAutoSave = (
  cacheKey: string,
  interval: number,
  getSaveData: () => Omit<SaveDto, 'savedTime'>,
) => {
  let timer: any
  const key = `auto-save-${cacheKey}`
  const { storage, reset, clear } = useStorageObject(SaveDto, key, false)
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

    console.log('saved data: ', storage)
  }

  function disposer() {
    clearInterval(timer)
  }
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

    console.log('prev saved: ', prevSaved)

    if (
      (prevSaved.text || prevSaved.title) &&
      (prevSaved.text !== data.text || prevSaved.title !== data.title)
    ) {
      requestAnimationFrame(() => {
        dialog.info({
          title: '发现有未保存的内容, 是否还原?',
          negativeText: '清楚',
          positiveText: '嗯',
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
