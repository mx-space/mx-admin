import { instanceToPlain, plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { throttle } from 'lodash-es'
import { reactive, watch } from 'vue'

export const useStorageObject = <U extends object>(
  DTO: Class<U>,
  storageKey: string,
  fixWrongPropertyData = true,
) => {
  const getObjectStorage = () => {
    const saved = localStorage.getItem(storageKey)
    if (!saved) {
      return null
    }
    try {
      const parsed = JSON.parse(saved)
      const classify = plainToInstance(DTO, parsed)
      const err = validateSync(classify)
      if (err.length > 0) {
        if (fixWrongPropertyData) {
          const instanceDto = new DTO()
          err.forEach((e) => {
            const propertyName = e.property
            parsed[propertyName] = instanceDto[propertyName]

            localStorage.setItem(storageKey, JSON.stringify(parsed))
          })
        }
        if (__DEV__) {
          console.log(err)
          console.log(
            'wrong property key: ',
            err.map((e) => e.property).toString(),
          )
          fixWrongPropertyData &&
            console.log('after fix wrong property: ', parsed)
        }
        return fixWrongPropertyData ? parsed : null
      }
      return parsed
    } catch (e) {
      console.log(e)

      return null
    }
  }

  const objectStorage = reactive<U>(
    getObjectStorage() ?? instanceToPlain(new DTO()),
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

  onBeforeMount(() => {
    localStorage.setItem(storageKey, JSON.stringify(objectStorage))
  })

  return {
    storage: objectStorage as U,
    reset: () => {
      Object.assign(objectStorage, instanceToPlain(new DTO()))
    },
    clear() {
      localStorage.removeItem(storageKey)
    },
  }
}
