import { throttle } from 'es-toolkit/compat'
import { reactive, watch } from 'vue'
import type { z } from 'zod'

const key2reactive = new Map<string, any>()

export const useStorageObject = <T extends z.ZodObject<any>>(
  schema: T,
  storageKey: string,
  fixWrongPropertyData = true,
) => {
  type U = z.infer<T>

  const getDefaultValue = (): U => {
    const shape = schema.shape
    const defaults: Record<string, any> = {}
    for (const key of Object.keys(shape)) {
      const field = shape[key]
      // 尝试获取默认值
      if (field._def.defaultValue !== undefined) {
        defaults[key] =
          typeof field._def.defaultValue === 'function'
            ? field._def.defaultValue()
            : field._def.defaultValue
      } else {
        defaults[key] = undefined
      }
    }
    return defaults as U
  }

  const getObjectStorage = (): U | null => {
    const saved = localStorage.getItem(storageKey)
    if (!saved) {
      console.debug(storageKey, ': no saved data')
      return null
    }
    try {
      const parsed = JSON.parse(saved)
      const result = schema.safeParse(parsed)

      if (!result.success) {
        if (fixWrongPropertyData) {
          const defaultValue = getDefaultValue()
          const issues = result.error.issues
          issues.forEach((e) => {
            const propertyName = e.path[0] as string
            if (propertyName) {
              parsed[propertyName] = defaultValue[propertyName]
            }
          })
          localStorage.setItem(storageKey, JSON.stringify(parsed))
        }
        if (__DEV__) {
          console.error(result.error.issues)
          console.error(
            'wrong property key:',
            result.error.issues.map((e) => e.path.join('.')).toString(),
          )
          fixWrongPropertyData &&
            console.debug('after fix wrong property:', parsed)
        }
        return fixWrongPropertyData ? parsed : null
      }
      return result.data
    } catch (error) {
      console.error(error)
      return null
    }
  }

  const storedReactive = key2reactive.get(storageKey)
  const objectStorage: U =
    storedReactive ?? reactive<U>(getObjectStorage() ?? getDefaultValue())
  if (!storedReactive) {
    key2reactive.set(storageKey, objectStorage)
  }

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

  onBeforeMount(() => {
    localStorage.setItem(storageKey, JSON.stringify(objectStorage))
  })

  return {
    storage: objectStorage as U,
    reset: () => {
      Object.assign(objectStorage, getDefaultValue())
    },
    clear() {
      localStorage.removeItem(storageKey)
    },
    destory() {
      key2reactive.delete(storageKey)
    },
  }
}
