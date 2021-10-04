import { ContentLayout } from 'layouts/content'
import { debounce } from 'lodash-es'
import {
  NButton,
  NButtonGroup,
  NForm,
  NFormItem,
  NH3,
  NSelect,
  NSpace,
  NSwitch,
  NText,
  NUpload,
  useMessage,
} from 'naive-ui'
import { FileInfo } from 'naive-ui/lib/upload/src/interface'
import { responseBlobToFile, RESTManager } from 'utils'
import { ParsedModel, ParseMarkdownYAML } from 'utils/markdown-parser'
import { defineComponent, ref, watch } from 'vue'

enum ImportType {
  Post = 'post',
  Note = 'note',
}
const types = [
  {
    value: ImportType.Post,
    label: '博文',
  },
  {
    label: '日记',
    value: ImportType.Note,
  },
]
export default defineComponent(() => {
  const importType = ref(ImportType.Post)
  const fileList = ref([] as FileInfo[])
  const parsedList = ref([] as (ParsedModel & { filename: string })[])
  function parseMarkdown(strList: string[]) {
    const parser = new ParseMarkdownYAML(strList)
    return parser.start().map((i, index) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const filename = fileList.value[index].file!.name
      const title = filename.replace(/\.md$/, '')
      if (i.meta) {
        i.meta.slug = i.meta.slug ?? title
      } else {
        i.meta = {
          title,
          slug: title,
        } as any
      }

      if (!i.meta?.date) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        i.meta!.date = new Date().toISOString()
      }
      return i
    })
  }
  const message = useMessage()
  async function handleParse(e?: MouseEvent) {
    e?.preventDefault()
    e?.stopPropagation()
    if (!fileList.value.length) {
      throw new ReferenceError('fileList is empty')
    }
    const strList = [] as string[]
    for await (const _file of fileList.value) {
      const res = await Promise.resolve(
        new Promise((resolve, reject) => {
          const file = _file.file as File | null
          if (!file) {
            return reject('File is empty')
          }
          if (file.type !== 'text/markdown') {
            message.error('只能转换 markdown 文件')
            return reject('File must be markdown.')
          }
          const reader = new FileReader()
          reader.onload = (e) => {
            // console.log(e.target?.result)
            resolve((e.target?.result as string) || '')
          }
          reader.readAsText(file)
        }),
      )
      strList.push(res as string)
    }
    const parsedList_ = parseMarkdown(strList)
    message.success('解析完成, 结果查看 console 哦')
    parsedList.value = parsedList_.map((v, index) => ({
      ...v,
      filename: fileList.value[index].file?.name ?? '',
    }))
    console.log(toRaw(parsedList))
  }

  async function handleUpload(e: MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (!parsedList.value.length) {
      return message.error('请先解析!!')
    }
    await RESTManager.api.markdown.import.post({
      data: {
        type: importType.value,
        data: parsedList.value,
      },
    })

    message.success('上传成功!')
    fileList.value = []
  }

  const includeYAMLHeader = ref(true)
  const titleBigTitle = ref(false)
  const filenameSlug = ref(false)
  async function handleExportMarkdown() {
    const data = await RESTManager.api.markdown.export.get({
      params: {
        slug: filenameSlug.value,
        yaml: includeYAMLHeader.value,
        show_title: titleBigTitle.value,
      },
      responseType: 'blob',
    })

    responseBlobToFile(data, 'markdown.zip')
  }

  watch(
    () => fileList.value,
    (n) => {
      console.log(n)

      if (n.length == 0) {
        parsedList.value = []
      } else {
        handleParse()
      }
    },
  )

  return () => (
    <ContentLayout>
      <NH3>从 MarkDown 导入数据</NH3>
      <NForm
        labelAlign="right"
        labelPlacement="left"
        labelWidth={150}
        class="max-w-[300px]"
      >
        <NFormItem label="导入到:">
          <NSelect
            options={types}
            value={importType.value}
            onUpdateValue={(e) => void (importType.value = e)}
          ></NSelect>
        </NFormItem>
        <NFormItem label="准备好了吗.">
          <NSpace vertical>
            <NUpload
              multiple
              accept=".md,.markdown"
              onChange={debounce((e) => {
                fileList.value = e.fileList
              }, 250)}
              onRemove={(e) => {
                const removedFile = e.file
                const name = removedFile.name
                const index = parsedList.value.findIndex(
                  (i) => i.filename === name,
                )
                if (index != -1) {
                  parsedList.value.splice(index, 1)
                }
              }}
            >
              <NButtonGroup>
                <NButton round>先上传</NButton>
                <NButton
                  onClick={handleParse}
                  disabled={!fileList.value.length}
                >
                  再解析
                </NButton>
                <NButton
                  onClick={handleUpload}
                  round
                  disabled={!parsedList.value.length}
                >
                  最后导入
                </NButton>
              </NButtonGroup>
            </NUpload>

            <NText depth={2} class="!text-sm">
              只能上传markdown文件
            </NText>
          </NSpace>
        </NFormItem>
      </NForm>
      <NH3>导出数据到 Markdown (Hexo YAML Format)</NH3>
      <NForm
        labelAlign="right"
        labelPlacement="left"
        labelWidth={180}
        class="max-w-[400px]"
      >
        <NFormItem label="是否包括 yaml header">
          <NSwitch
            value={includeYAMLHeader.value}
            onUpdateValue={(e) => void (includeYAMLHeader.value = e)}
          ></NSwitch>
        </NFormItem>
        <NFormItem label="是否在第一行显示文章标题">
          <NSwitch
            value={titleBigTitle.value}
            onUpdateValue={(e) => void (titleBigTitle.value = e)}
          ></NSwitch>
        </NFormItem>
        <NFormItem label="根据 slug 生成文件名">
          <NSwitch
            value={filenameSlug.value}
            onUpdateValue={(e) => void (filenameSlug.value = e)}
          ></NSwitch>
        </NFormItem>
        <div class="text-right w-full">
          <NButton type="primary" onClick={handleExportMarkdown}>
            导出
          </NButton>
        </div>
      </NForm>
    </ContentLayout>
  )
})
