import { isEqual, isObject } from 'es-toolkit/compat'
import transform from 'lodash.transform'
import { toRaw } from 'vue'

export * from './build-menus'
export * from './time'
export * from './version'

/**
 * diff 两层，Object 浅层比较，引用不一致返回整个不一样的 Object
 * @param origin
 * @param newObject
 * @returns
 */
export const shallowDiff = <T extends KV>(
  origin: T,
  newObject: T,
): Partial<T> => {
  const diff = {} as Partial<T>

  for (const key in newObject) {
    if (isObject(newObject[key])) {
      const insideObject = newObject[key]
      const originInsideObject = origin[key]
      Object.keys(toRaw(insideObject)).map((key$) => {
        if (isObject(insideObject[key$])) {
          const insideObject$ = insideObject[key$]
          for (const k in insideObject$) {
            if (insideObject$[k] !== originInsideObject[key$][k]) {
              diff[key] = insideObject

              break
            }
          }
        } else if (insideObject[key$] !== originInsideObject[key$]) {
          diff[key] = insideObject
        }
      })
    } else if (newObject[key] !== origin[key]) {
      diff[key] = newObject[key]
    }
  }

  return diff
}

/**
 * 深层 diff, 返回不一致的 KV
 * @param base
 * @param object
 * @returns
 */
export function deepDiff<T extends KV>(base: T, object: T): Partial<T> {
  function changes(object: any, base: any) {
    return transform(object, (result: any, value, key) => {
      if (!isEqual(value, base?.[key])) {
        result[key] =
          isObject(value) && isObject(base?.[key])
            ? changes(value, base?.[key])
            : value
      }
    })
  }
  return changes(object, base)
}

export function responseBlobToFile(response: any, filename: string): void {
  const url = window.URL.createObjectURL(new Blob([response as any]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.append(link)
  link.click()
}

export function toPascalCase(string: string) {
  return `${string}`
    .replaceAll(new RegExp(/[_-]+/, 'g'), ' ')
    .replaceAll(new RegExp(/[^\s\w]/, 'g'), '')
    .replaceAll(
      new RegExp(/\s+(.)(\w*)/, 'g'),
      (_$1, $2, $3) => `${$2.toUpperCase() + $3.toLowerCase()}`,
    )
    .replace(new RegExp(/\w/), (s) => s.toUpperCase())
}

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
