import { Editor, EditorStorageKeys } from './constants'

export const useGetPrefEditor = (): Editor | null => {
  const prefValue = localStorage.getItem(EditorStorageKeys.editor)
  if (!prefValue) {
    return null
  }
  try {
    const pref = JSON.parse(prefValue)

    // valid

    const valid = Object.keys(Editor).includes(pref)
    if (valid) {
      return pref
    } else {
      return null
    }
  } catch {
    return null
  }
}
