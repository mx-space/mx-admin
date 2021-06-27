export interface ShiJuData {
  id: number
  content: string
  origin: {
    title: string
    dynasty: string
    author: string
    content: string[]
    matchTags: string[]
  }
}
export const getJinRiShiCiOne = async () => {
  const res = await fetch('https://v2.jinrishici.com/one.json')
  const json = await res.json()
  return json.data as ShiJuData
}
