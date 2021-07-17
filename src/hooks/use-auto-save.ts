import { IsISO8601, IsString } from 'class-validator'
import { useDialog } from 'naive-ui'
import { toRaw, onMounted, Ref, reactive } from 'vue'
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
  const { storage, reset, clear } = useStorageObject<SaveDto>(
    SaveDto,
    'auto-save-' + cacheKey,
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
  const { disposer, clearSaved, getPrevSaved, reset, save, track } = hook
  const dialog = useDialog()

  const ref = { timer: null as any, raf: null as any }
  onMounted(async () => {
    const prevSaved = getPrevSaved()

    console.log('prev saved: ', prevSaved)

    ref.timer = setTimeout(() => {
      ref.raf = requestAnimationFrame(() => {
        console.log(data.text, prevSaved.text)

        if (
          (prevSaved.text || prevSaved.title) &&
          (prevSaved.text !== data.text || prevSaved.title !== data.title)
        ) {
          dialog.info({
            title: '发现有未保存的内容, 是否还原?',
            negativeText: '不用啦',
            positiveText: '嗯',
            onPositiveClick() {
              Object.assign(data, {
                text: prevSaved.text,
                title: prevSaved.title,
              })
            },
          })
        }
      })

      track()
    }, 1200)
  })

  // const initialSaved = getPrevSaved()
  onBeforeRouteLeave(() => {
    save()
    // if (initialSaved.text == data.text && initialSaved.title == data.title) {
    //   clearSaved()
    // }
    disposer()
    clearTimeout(ref.timer)
    cancelAnimationFrame(ref.raf)
  })

  return hook
}
