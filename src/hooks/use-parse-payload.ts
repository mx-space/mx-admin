import { toRaw } from 'vue'

export const useParsePayloadIntoData =
  (data: any) =>
  <T>(payload: T) => {
    const raw = toRaw(data)
    const keys = Object.keys(raw)
    for (const k in payload) {
      if (keys.includes(k)) {
        data[k] = payload[k]
      }
    }
  }
