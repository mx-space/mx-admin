// Inlined from @mx-space/api-client to drop the runtime dependency.

const isObject = (obj: unknown) => obj && typeof obj === 'object'

const isPlainObject = (obj: unknown) =>
  isObject(obj) &&
  Object.prototype.toString.call(obj) === '[object Object]' &&
  Object.getPrototypeOf(obj) === Object.prototype

const isMongoId = (id: string) => id.length === 24 && /^[\da-f]{24}$/i.test(id)

function camelcase(str: string) {
  return str.replace(/^_+/, '').replaceAll(/([_-][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace('-', '').replace('_', '')
  })
}

export interface CamelcaseKeysOptions {
  /**
   * Predicate to keep a key untouched. Composed (OR) with the built-in
   * legacy MongoDB ObjectId skip.
   */
  shouldSkipKey?: (key: string) => boolean
}

export const simpleCamelcaseKeys = <T = any>(
  obj: any,
  options: CamelcaseKeysOptions = {},
): T => {
  if (Array.isArray(obj)) {
    return obj.map((x) => simpleCamelcaseKeys(x, options)) as any
  }

  if (isPlainObject(obj)) {
    return Object.keys(obj).reduce((result: any, key) => {
      const skip = isMongoId(key) || options.shouldSkipKey?.(key) === true
      const nextKey = skip ? key : camelcase(key)
      result[nextKey] = simpleCamelcaseKeys(obj[key], options)
      return result
    }, {}) as any
  }

  return obj
}
