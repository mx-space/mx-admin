import { camelCase, isPlainObject } from 'lodash-es'

export const camelcaseKeys = (o: any) => {
  if (isPlainObject(o)) {
    const n = {}

    Object.keys(o).forEach((k) => {
      n[camelCase(k)] = camelcaseKeys(o[k])
    })

    return n
  } else if (Array.isArray(o)) {
    return o.map((i) => {
      return camelcaseKeys(i)
    })
  }

  return o
}
