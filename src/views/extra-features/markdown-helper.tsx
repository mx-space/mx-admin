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
import { defineComponent, ref, watch } from 'vue'
import type { ParsedModel } from '~/utils/markdown-parser'
import type { UploadFileInfo } from 'naive-ui'

import { ContentLayout } from '~/layouts/content'
import { responseBlobToFile, RESTManager } from '~/utils'
import { ParseMarkdownYAML } from '~/utils/markdown-parser'

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
  const fileList = ref([] as UploadFileInfo[])
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
        new Promise<string>((resolve, reject) => {
          const file = _file.file as File | null
          if (!file) {
            message.error('文件不存在')
            reject('File is empty')
            return
          }
          // 垃圾 windows , 不识别 mine-type 的处理
          const ext = file.name.split('.').pop()

          if (
            (file.type && file.type !== 'text/markdown') ||
            !['md', 'markdown'].includes(ext!)
          ) {
            message.error(`只能解析 markdown 文件，但是得到了 ${file.type}`)

            reject(
              `File must be markdown. got type: ${file.type}, got ext: ${ext}`,
            )
            return
          }
          const reader = new FileReader()
          reader.addEventListener('load', (e) => {
            // console.log(e.target?.result)
            resolve((e.target?.result as string) || '')
          })
          reader.readAsText(file)
        }),
      )
      console.log(res)

      strList.push(res as string)
    }
    try {
      const parsedList_ = parseMarkdown(strList)
      message.success('解析完成，结果查看 console 哦')
      parsedList.value = parsedList_.map((v, index) => ({
        ...v,
        filename: fileList.value[index].file?.name ?? '',
      }))
      //
      console.log(toRaw(parsedList))
    } catch (e: any) {
      console.error(e.err)
      message.error(
        `文件${fileList.value[e.idx].name ?? ''}解析失败，具体信息查看 console`,
      )
    }
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

    message.success('上传成功！')
    fileList.value = []
  }

  const exportConfig = reactive({
    includeYAMLHeader: true,
    titleBigTitle: false,
    filenameSlug: false,
    withMetaJson: true,
  })
  async function handleExportMarkdown() {
    const { includeYAMLHeader, filenameSlug, withMetaJson, titleBigTitle } =
      exportConfig
    const data = await RESTManager.api.markdown.export.get({
      params: {
        slug: filenameSlug,
        yaml: includeYAMLHeader,
        show_title: titleBigTitle,
        with_meta_json: withMetaJson,
      },
      responseType: 'blob',
    })

    responseBlobToFile(data, 'markdown.zip')
  }

  watch(
    () => fileList.value,
    (n) => {
      // console.log(n)

      if (n.length == 0) {
        parsedList.value = []
      } else {
        handleParse()
      }
    },
  )

  return () => (
    <ContentLayout>
      <NH3>从 Markdown 导入数据</NH3>
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
          />
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
              只能上传 markdown 文件
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
            value={exportConfig.includeYAMLHeader}
            onUpdateValue={(e) => void (exportConfig.includeYAMLHeader = e)}
          />
        </NFormItem>
        <NFormItem label="是否在第一行显示文章标题">
          <NSwitch
            value={exportConfig.titleBigTitle}
            onUpdateValue={(e) => void (exportConfig.titleBigTitle = e)}
          />
        </NFormItem>
        <NFormItem label="根据 slug 生成文件名">
          <NSwitch
            value={exportConfig.filenameSlug}
            onUpdateValue={(e) => void (exportConfig.filenameSlug = e)}
          />
        </NFormItem>

        <NFormItem label="导出元数据 JSON">
          <NSwitch
            value={exportConfig.withMetaJson}
            onUpdateValue={(e) => void (exportConfig.withMetaJson = e)}
          />
        </NFormItem>

        <div class="w-full text-right">
          <NButton type="primary" onClick={handleExportMarkdown}>
            导出
          </NButton>
        </div>
      </NForm>
    </ContentLayout>
  )
})
