import { omit } from 'es-toolkit/compat'
import { dump, load } from 'js-yaml'
import JSON5 from 'json5'
import { useMessage } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'

import { snippetsApi } from '~/api'

import {
  defaultServerlessFunction,
  SnippetModel,
  SnippetType,
} from '../../../../models/snippet'

export function useSnippetEditor(selectedId: Ref<string | null>) {
  const message = useMessage()

  const editData = ref<SnippetModel>(new SnippetModel())

  // Type to raw value mapping for format conversion
  const typeToValueMap = reactive<Record<SnippetType, string>>({
    [SnippetType.JSON]: JSON.stringify({ name: 'hello world' }, null, 2),
    [SnippetType.JSON5]: JSON5.stringify({ name: 'hello world' }, null, 2),
    [SnippetType.YAML]: 'name: hello world',
    [SnippetType.Function]: defaultServerlessFunction,
    [SnippetType.Text]: '',
  })

  let jsonFormatBeforeType: SnippetType = SnippetType.JSON

  const isNew = computed(() => !selectedId.value)
  const isFunctionType = computed(
    () => editData.value.type === SnippetType.Function,
  )
  const isBuiltFunction = computed(
    () =>
      editData.value.type === SnippetType.Function &&
      editData.value.builtIn &&
      !!selectedId.value,
  )

  // Watch type changes for format conversion
  watch(
    () => editData.value.type,
    (type, beforeType) => {
      if (type === 'function' || type === 'text') {
        editData.value.raw = typeToValueMap[type]

        if (type !== 'text') {
          editData.value.method ??= 'GET'
          editData.value.enable ??= true
        }
        return
      }

      if (beforeType !== 'function' && beforeType !== 'text') {
        jsonFormatBeforeType = beforeType
      }

      const object = (() => {
        switch (jsonFormatBeforeType) {
          case 'json':
            return JSON.parse(typeToValueMap.json)
          case 'yaml':
            return load(typeToValueMap.yaml)
          case 'json5':
            return JSON5.parse(typeToValueMap.json5)
          case 'function':
            delete editData.value.method
            delete editData.value.enable
            return ''
        }
      })()

      const current = (() => {
        switch (type) {
          case 'json':
            return JSON.stringify(object, null, 2)
          case 'yaml':
            return dump(object)
          case 'json5':
            return JSON5.stringify(object, null, 2)
        }
      })()

      editData.value.raw = current || ''
      typeToValueMap[type] = current || ''
    },
  )

  // Fetch snippet data when ID changes
  const fetchSnippet = async (id: string) => {
    const data = await snippetsApi.getById(id)

    // Normalize JSON formatting
    if (data.type === SnippetType.JSON) {
      data.raw = JSON.stringify(JSON5.parse(data.raw), null, 2)
    }

    editData.value = data
    jsonFormatBeforeType = data.type
    typeToValueMap[data.type] = data.raw
  }

  // Reset to default state for new snippet
  const reset = (reference?: string) => {
    editData.value = new SnippetModel()
    if (reference) {
      editData.value.reference = reference
    }

    // Reset typeToValueMap to defaults
    typeToValueMap[SnippetType.JSON] = JSON.stringify(
      { name: 'hello world' },
      null,
      2,
    )
    typeToValueMap[SnippetType.JSON5] = JSON5.stringify(
      { name: 'hello world' },
      null,
      2,
    )
    typeToValueMap[SnippetType.YAML] = 'name: hello world'
    typeToValueMap[SnippetType.Function] = defaultServerlessFunction
    typeToValueMap[SnippetType.Text] = ''

    jsonFormatBeforeType = SnippetType.JSON
  }

  // Save snippet (create or update)
  const save = async (): Promise<SnippetModel | null> => {
    const tinyJson = (text: string) => {
      try {
        return JSON.stringify(JSON.parse(text), null, 0)
      } catch {
        message.error('JSON 格式错误')
        return null
      }
    }

    const handleRawText = () => {
      const currentTypeText = typeToValueMap[editData.value.type]
      switch (editData.value.type) {
        case SnippetType.JSON:
          return tinyJson(currentTypeText)
        case SnippetType.YAML:
          try {
            load(currentTypeText)
          } catch {
            message.error('YAML 格式错误')
            return null
          }
          return currentTypeText
        case SnippetType.Function:
          return currentTypeText
        default:
          return currentTypeText
      }
    }

    const rawText = handleRawText()
    if (rawText === null) return null

    const omitData = omit(editData.value, ['_id', 'id', 'created', 'data'])
    const finalData = { ...omitData, raw: rawText }

    if (!finalData.metatype) {
      delete finalData.metatype
    }

    try {
      let result: SnippetModel
      if (selectedId.value) {
        result = await snippetsApi.update(selectedId.value, finalData)
        message.success('更新成功')
      } else {
        result = await snippetsApi.create(finalData as any)
        message.success('创建成功')
      }
      return result
    } catch (error) {
      message.error('保存失败')
      return null
    }
  }

  // Update editor value for current type
  const updateEditorValue = (value: string) => {
    typeToValueMap[editData.value.type] = value
  }

  // Get current editor value
  const editorValue = computed(() => typeToValueMap[editData.value.type])

  return {
    editData,
    typeToValueMap,
    isNew,
    isFunctionType,
    isBuiltFunction,
    editorValue,
    fetchSnippet,
    reset,
    save,
    updateEditorValue,
  }
}
