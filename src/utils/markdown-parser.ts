/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export class ParseMarkdownYAML {
  constructor(private strList: string[]) {}

  parse(str: string) {
    const raw = str

    const parts = /-{3,}\n(.*?)-{3,}\n*(.*)$/gms.exec(raw)
    if (!parts) {
      return { text: raw }
    }
    const parttenYAML = parts[1]
    const text = parts.pop()
    const parseYAML = parttenYAML.split('\n')

    const tags = [] as string[]
    const categories = [] as string[]

    let cur: 'cate' | 'tag' | null = null
    const meta: any = parseYAML.reduce((meta, current) => {
      const splitPart = current
        .trim()
        .split(':')
        .filter((item) => item.length)
      const sp =
        splitPart.length >= 2
          ? [
              splitPart[0],
              splitPart
                .slice(1)
                .filter((item) => item.length)
                .join(':')
                .trim(),
            ]
          : [splitPart[0]]

      if (sp.length === 2) {
        const [property, value] = sp
        if (['date', 'updated'].includes(property)) {
          meta[property] = new Date(value.trim()).toISOString()
        } else if (['categories:', 'tags:'].includes(property)) {
          cur = property === 'categories:' ? 'cate' : 'tag'
        } else meta[property] = value.trim()
      } else {
        const item = current.trim().replace(/^\s*-\s*/, '')

        if (['', 'tags:', 'categories:'].includes(item)) {
          cur = item === 'categories:' ? 'cate' : 'tag'
          return meta
        }
        if (cur === 'tag') {
          tags.push(item)
        } else {
          categories.push(item)
        }
      }
      return meta
    }, {})

    meta.categories = categories
    meta.tags = tags
    return { meta, text } as ParsedModel
  }

  start() {
    const files = this.strList
    const contents = [] as ParsedModel[]
    for (const file of files) {
      contents.push(this.parse(file))
    }
    return contents
  }
}

export interface ParsedModel {
  meta?: {
    title: string
    updated: string
    date: string
    categories: Array<string>
    tags: Array<string>
    slug: string
  }
  text: string
}
