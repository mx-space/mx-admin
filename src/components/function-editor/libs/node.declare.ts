const nodeDeclare = import.meta.glob('./node/*.d.ts', {
  as: 'raw',
})

const urlSourceMap: Record<string, string> = {}
for (const path in nodeDeclare) {
  const module = await nodeDeclare[path]()
  urlSourceMap[`ts:node/${path.split('/').pop()}`] = module
}

export { urlSourceMap as NodeDeclare }
