import { reactive, watch } from 'vue'
import { ClassConstructor, classToPlain, plainToClass } from 'class-transformer'
import { validateSync } from 'class-validator'
import { throttle } from 'lodash-es'

// @ts-expect-error
export const useStorageObject = <U, T extends { new () } = unknown>(
  dto: T,
  storageKey: string,
) => {
  const getObjectStorage = () => {
    const saved = localStorage.getItem(storageKey)
    if (!saved) {
      return null
    }
    try {
      const parsed = JSON.parse(saved)
      const classify = plainToClass(dto as any as ClassConstructor<T>, parsed)
      const err = validateSync(classify)
      if (err.length > 0) {
        if (__DEV__) {
          console.log(err)
        }
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  const objectStorage = reactive<T>(
    getObjectStorage() ?? classToPlain(new dto()),
  )
  watch(
    () => objectStorage,
    throttle(
      (n) => {
        localStorage.setItem(storageKey, JSON.stringify(n))
      },
      400,
      { trailing: true },
    ),
    { deep: true },
  )

  return objectStorage as U
}
