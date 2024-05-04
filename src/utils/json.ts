export const JSONSafeParse: typeof JSON.parse = (...rest) => {
  try {
    return JSON.parse(...rest)
  } catch {
    return null
  }
}

export const JSONParseReturnOriginal: typeof JSON.parse = (...rest) => {
  try {
    return JSON.parse(...rest)
  } catch {
    return rest[0]
  }
}
