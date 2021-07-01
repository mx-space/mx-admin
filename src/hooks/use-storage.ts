import { reactive, watch } from 'vue'
import { ClassConstructor, classToPlain, plainToClass } from 'class-transformer'
import { validateSync } from 'class-validator'
import { throttle } from 'lodash-es'

// @ts-expect-error
export const useStorageObject = <U, T extends { new () } = unknown>(
  DTO: T,
  storageKey: string,
) => {
  const getObjectStorage = () => {
    const saved = localStorage.getItem(storageKey)
    if (!saved) {
      return null
    }
    try {
      const parsed = JSON.parse(saved)
      const classify = plainToClass(DTO as any as ClassConstructor<T>, parsed)
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
    getObjectStorage() ?? classToPlain(new DTO()),
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

  return {
    storage: objectStorage as U,
    reset: () => {
      Object.assign(objectStorage, classToPlain(new DTO()))
    },
  }
}
