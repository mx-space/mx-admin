export const JSONSafeParse: typeof JSON.parse = (...rest) => {
  try {
    return JSON.parse(...rest)
  } catch (e) {
    return null
  }
}

export const JSONParseReturnOriginal: typeof JSON.parse = (...rest) => {
  try {
    return JSON.parse(...rest)
  } catch (e) {
    return rest[0]
  }
}
