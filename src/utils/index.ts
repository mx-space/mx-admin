import { isObject } from 'lodash-es'
import { toRaw } from 'vue'

export * from './auth'
export * from './build-menus'
export * from './deps-injection'
export * from './rest'
export * from './time'
export * from './case'

export const shallowDiff = <T extends KV>(
  origin: T,
  newObject: T,
): Partial<T> => {
  const diff = {} as Partial<T>

  for (const key in newObject) {
    if (isObject(newObject[key])) {
      const insideObject = newObject[key]
      const originInsideObject = origin[key]
      // shallow compare
      Object.keys(toRaw(insideObject)).map((key$) => {
        if (insideObject[key$] !== originInsideObject[key$]) {
          diff[key] = insideObject
        }
      })
    } else {
      if (newObject[key] !== origin[key]) {
        diff[key] = newObject[key]
      }
    }
  }

  return diff
}
