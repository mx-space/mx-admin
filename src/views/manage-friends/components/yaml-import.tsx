import { defineComponent, ref, reactive, computed, onMounted } from 'vue'
import {
  NCard,
  NInput,
  NButton,
  NSpace,
  NAlert,
  NGrid,
  NGridItem,
  NCheckbox,
  NSpin,
  NProgress,
  NTooltip,
  NIcon,
  NSwitch,
  useMessage,
} from 'naive-ui'
import { HelpCircle } from '@vicons/ionicons5'
import type { HexoLinkItem } from '~/utils/yaml-parser'
import { parseHexoLinkYaml, batchConvertHexoLinks, tryFixYamlFormat } from '~/utils/yaml-parser'
import { Avatar } from './avatar'
import { RESTManager } from '~/utils'
import type { LinkModel } from '~/models/link'

export const YamlImport = defineComponent({
  name: 'YamlImport',
  emits: ['import-success'],
  setup(_, { emit }) {
    const message = useMessage()
    const yamlContent = ref('')
    const isLoading = ref(false)
    const parseError = ref('')
    const parsedLinks = ref<HexoLinkItem[]>([])
    const selectedLinks = reactive(new Set<number>())
    const importResult = ref<{
      success: number
      fail: number
      skip: number
      total: number
    }>({
      success: 0,
      fail: 0,
      skip: 0,
      total: 0,
    })
    
    // 现有友链列表
    const existingLinks = ref<LinkModel[]>([])
    const showResult = ref(false)
    const autoFixEnabled = ref(true)

    // 示例YAML
    const exampleYaml = `# 普通列表格式
- name: Mix-Space
  link: https://mx-space.js.org
  avatar: https://mx-space.js.org
  descr: Mix Space 是一个现代化的前后端分离个人空间解决方案，也可以作为个人博客使用。
- name: 云游君的小站
  link: https://www.yunyoujun.cn
  avatar: https://www.yunyoujun.cn/images/avatar.jpg
  descr: 希望能成为一个有趣的人。
- name: 静かな森
  link: https://innei.ren
  avatar: https://cdn.jsdelivr.net/gh/Innei/static@master/avatar.png
  descr: 致虚极，守静笃。`

    // 分类格式示例YAML
    const categoryExampleYaml = `# 分类格式
class1:
  class_name: 博主
  link_list:
    - name: Terorの客栈
      link: https://blog.trfox.top
      avatar: https://img.trfox.top/assets/avatar.jpg
      descr: 欢迎光临～
class2:
  class_name: 大佬们
  link_list:
    - name: 张洪Heo
      link: https://blog.zhheo.com/
      avatar: https://blog.zhheo.com/img/avatar.png
      descr: 分享设计与科技生活
    - name: 安知鱼\`Blog
      link: https://anzhiy.cn/
      avatar: https://img02.anzhiy.cn/adminuploads/1/2022/09/15/63232b7d91d22.jpg
      descr: 生活明朗，万物可爱
    - name: 静かな森
      link: https://innei.ren
      avatar: https://cdn.jsdelivr.net/gh/Innei/static@master/avatar.png
      descr: 致虚极，守静笃。  `

    // 当前示例类型
    const exampleType = ref<'normal' | 'category'>('normal')

    // 填充示例
    const fillExample = () => {
      yamlContent.value = exampleType.value === 'normal' ? exampleYaml : categoryExampleYaml
    }

    // 切换示例类型
    const toggleExampleType = () => {
      exampleType.value = exampleType.value === 'normal' ? 'category' : 'normal'
    }

    // 重置
    const resetForm = () => {
      yamlContent.value = ''
      parsedLinks.value = []
      parseError.value = ''
      selectedLinks.clear()
      showResult.value = false
    }

    // 计算属性：是否有选中的友链
    const hasSelectedLinks = computed(() => selectedLinks.size > 0)
    
    // 计算属性：是否全选
    const isAllSelected = computed(() => 
      parsedLinks.value.length > 0 && selectedLinks.size === parsedLinks.value.length
    )
    
    // 计算属性：是否部分选中
    const isIndeterminate = computed(() => 
      selectedLinks.size > 0 && selectedLinks.size < parsedLinks.value.length
    )

    // 解析YAML
    const parseYaml = async () => {
      if (!yamlContent.value.trim()) {
        message.warning('请输入YAML内容')
        return
      }

      try {
        isLoading.value = true
        parseError.value = ''
        
        // 刷新现有友链列表
        await fetchExistingLinks()
        
        // 使用自动修复选项解析YAML
        parsedLinks.value = parseHexoLinkYaml(yamlContent.value, autoFixEnabled.value)
        
        if (parsedLinks.value.length === 0) {
          message.warning('未找到有效的友链数据')
          return
        }
        
        // 如果启用了自动修复，更新文本框中的内容为修复后的格式
        if (autoFixEnabled.value) {
          const fixedYaml = tryFixYamlFormat(yamlContent.value)
          if (fixedYaml !== yamlContent.value) {
            yamlContent.value = fixedYaml
            message.success('已自动修复YAML格式')
          }
        }
        
        // 默认选中不存在的友链，跳过已存在的友链
        let existingCount = 0
        parsedLinks.value.forEach((link, index) => {
          if (!isLinkExists(link.link)) {
            selectedLinks.add(index)
          } else {
            existingCount++
          }
        })
        
        const newLinksCount = parsedLinks.value.length - existingCount
        
        if (existingCount > 0) {
          message.info(`成功解析 ${parsedLinks.value.length} 个友链，其中 ${existingCount} 个已存在（默认不选中）`)
        } else {
          message.success(`成功解析 ${parsedLinks.value.length} 个友链`)
        }
      } catch (error) {
        if (error instanceof Error) {
          parseError.value = error.message
          
          // 如果启用了自动修复但仍然失败，提示用户
          if (autoFixEnabled.value) {
            parseError.value += '（即使启用了自动修复也无法解析，请手动检查格式）'
          } else {
            parseError.value += '（尝试启用自动修复功能可能会解决此问题）'
          }
        } else {
          parseError.value = '解析YAML时发生未知错误'
        }
        parsedLinks.value = []
      } finally {
        isLoading.value = false
      }
    }

    // 切换选择状态
    const toggleSelect = (index: number) => {
      if (selectedLinks.has(index)) {
        selectedLinks.delete(index)
      } else {
        selectedLinks.add(index)
      }
    }

    // 全选/取消全选
    const toggleSelectAll = () => {
      if (selectedLinks.size === parsedLinks.value.length) {
        selectedLinks.clear()
      } else {
        parsedLinks.value.forEach((_, index) => {
          selectedLinks.add(index)
        })
      }
    }

    // 获取现有友链列表
    const fetchExistingLinks = async () => {
      try {
        // 先获取第一页，了解总数
        const { data, pagination } = await RESTManager.api.links.get<LinkModel[]>({
          params: {
            page: 1,
            size: 50,
            state: 0
          }
        })
        
        let allLinks = [...data]
        
        // 如果有多页，继续获取剩余页面
        if (pagination && pagination.total > pagination.size) {
          const totalPages = Math.ceil(pagination.total / pagination.size)
          
          // 从第2页开始获取剩余页面
          for (let page = 2; page <= totalPages; page++) {
            const { data: pageData } = await RESTManager.api.links.get<LinkModel[]>({
              params: {
                page,
                size: 50,
                state: 0
              }
            })
            allLinks = [...allLinks, ...pageData]
          }
        }
        
        existingLinks.value = allLinks
      } catch (error) {
        console.error('获取友链列表失败:', error)
        message.error('获取友链列表失败')
      }
    }
    
    // 组件挂载时获取友链列表
    onMounted(() => {
      fetchExistingLinks()
    })
    
    // 检查链接是否已存在
    const isLinkExists = (url: string): boolean => {
      if (!url) return false
      
      // 标准化URL，移除协议前缀和尾部斜杠，便于比较
      const normalizeUrl = (urlStr: string): string => {
        return urlStr.replace(/^https?:\/\//, '')
                    .replace(/\/$/, '')
                    .toLowerCase()
      }
      
      const normalizedUrl = normalizeUrl(url)
      return existingLinks.value.some(link => 
        normalizeUrl(link.url) === normalizedUrl
      )
    }
    
    // 导入进度
    const importProgress = ref(0)
    
    // 导入友链
    const importLinks = async () => {
      if (selectedLinks.size === 0) {
        message.warning('请至少选择一个友链')
        return
      }

      try {
        isLoading.value = true
        showResult.value = true
        importProgress.value = 0
        
        const selectedLinkItems = Array.from(selectedLinks).map(
          (index) => parsedLinks.value[index]
        )
        
        const systemLinks = batchConvertHexoLinks(selectedLinkItems)
        
        let successCount = 0
        let failCount = 0
        const total = selectedLinkItems.length
        
        // 在导入前刷新友链列表
        await fetchExistingLinks()
        
        // 逐个导入友链，并更新进度
        let skipCount = 0
        for (let i = 0; i < systemLinks.length; i++) {
          const link = systemLinks[i]
          
          // 检查链接是否已存在
          if (isLinkExists(link.url)) {
            skipCount++
            console.log(`跳过已存在的友链: ${link.name} (${link.url})`)
          } else {
            try {
              await RESTManager.api.links.post({
                data: link,
              })
              successCount++
            } catch (error) {
              console.error('导入友链失败:', error, link)
              failCount++
            }
          }
          
          // 更新进度
          importProgress.value = Math.round(((i + 1) / total) * 100)
        }
        
        importResult.value = {
          success: successCount,
          fail: failCount,
          skip: skipCount,
          total: selectedLinkItems.length,
        }
        
        if (successCount > 0) {
          message.success(`成功导入 ${successCount} 个友链`)
          emit('import-success')
        }
        
        if (failCount > 0) {
          message.error(`${failCount} 个友链导入失败`)
        }
      } catch (error) {
        console.error('批量导入友链失败:', error)
        message.error('批量导入友链失败')
      } finally {
        isLoading.value = false
      }
    }

    return () => (
      <div class="yaml-import">
        <NSpace vertical size="large">
          {/* YAML输入区域 */}
          <NCard title="批量导入友链" bordered={false}>
            <NSpace vertical>
              <div class="flex justify-between items-center">
                <div class="flex items-center">
                  <span class="text-sm text-gray-500 mr-1">
                    请粘贴Hexo的link.yaml格式的友链数据
                  </span>
                </div>
                <div class="flex items-center space-x-2">
                  <NTooltip>
                    {{
                      trigger: () => (
                        <NButton
                          size="small"
                          quaternary
                          type={exampleType.value === 'normal' ? 'primary' : 'default'}
                          onClick={() => {
                            exampleType.value = 'normal'
                            fillExample()
                          }}
                        >
                          普通列表示例
                        </NButton>
                      ),
                      default: () => "使用普通列表格式的友链示例",
                    }}
                  </NTooltip>
                  <NTooltip>
                    {{
                      trigger: () => (
                        <NButton
                          size="small"
                          quaternary
                          type={exampleType.value === 'category' ? 'primary' : 'default'}
                          onClick={() => {
                            exampleType.value = 'category'
                            fillExample()
                          }}
                        >
                          分类格式示例
                        </NButton>
                      ),
                      default: () => "使用分类格式的友链示例",
                    }}
                  </NTooltip>
                </div>
              </div>
              
              <div class="flex items-center mb-2">
                <NSwitch
                  value={autoFixEnabled.value}
                  onUpdateValue={(v) => (autoFixEnabled.value = v)}
                />
                <span class="ml-2 text-sm">
                  自动修复格式错误
                  <NTooltip>
                    {{
                      trigger: () => (
                        <NIcon size={16} class="ml-1">
                          <HelpCircle />
                        </NIcon>
                      ),
                      default: () => "尝试自动修复YAML格式错误，如缩进不正确、缺少引号等问题",
                    }}
                  </NTooltip>
                </span>
              </div>
              
              <NInput
                type="textarea"
                value={yamlContent.value}
                onUpdateValue={(v) => (yamlContent.value = v)}
                placeholder="请粘贴YAML格式的友链数据"
                rows={10}
                disabled={isLoading.value}
              />
              
              {parseError.value && (
                <NAlert type="error" title="解析错误">
                  {parseError.value}
                </NAlert>
              )}
              
              <div class="flex justify-end">
                <NSpace>
                  <NButton
                    onClick={resetForm}
                    disabled={isLoading.value}
                    ghost
                  >
                    重置
                  </NButton>
                  <NButton
                    type="primary"
                    onClick={parseYaml}
                    loading={isLoading.value}
                    disabled={!yamlContent.value.trim()}
                  >
                    解析预览
                  </NButton>
                </NSpace>
              </div>
              
              {isLoading.value && importProgress.value > 0 && (
                <div class="mt-4">
                  <NProgress
                    type="line"
                    percentage={importProgress.value}
                    indicatorPlacement="inside"
                    status={importProgress.value >= 100 ? "success" : "processing"}
                  />
                </div>
              )}
            </NSpace>
          </NCard>

          {/* 解析结果预览 */}
          {parsedLinks.value.length > 0 && (
            <NCard title="友链预览" bordered={false}>
              <NSpin show={isLoading.value}>
              <NSpace vertical>
                <div class="flex justify-between items-center mb-4">
                  <NCheckbox
                    checked={isAllSelected.value}
                    indeterminate={isIndeterminate.value}
                    onUpdateChecked={toggleSelectAll}
                  >
                    全选 ({selectedLinks.size}/{parsedLinks.value.length})
                  </NCheckbox>
                  
                  <NButton
                    type="primary"
                    onClick={importLinks}
                    loading={isLoading.value}
                    disabled={!hasSelectedLinks.value}
                  >
                    导入选中的友链
                  </NButton>
                </div>
                
                <NGrid cols="1 s:2 m:3" responsive="screen" xGap={12} yGap={12}>
                  {parsedLinks.value.map((link, index) => (
                    <NGridItem key={index}>
                      <NCard
                        class={`cursor-pointer transition-all duration-300 ${
                          selectedLinks.has(index)
                            ? 'border-primary border-2'
                            : 'opacity-70'
                        }`}
                        onClick={() => toggleSelect(index)}
                      >
                        <div class="flex items-center space-x-3">
                          <Avatar name={link.name} avatar={link.avatar} />
                          <div class="flex-1 min-w-0">
                            <div class="font-medium truncate">{link.name}</div>
                            <div class="text-xs text-gray-500 truncate">
                              {link.link}
                            </div>
                          </div>
                          <NCheckbox
                            checked={selectedLinks.has(index)}
                            onClick={(e) => e.stopPropagation()}
                            onUpdateChecked={() => toggleSelect(index)}
                          />
                        </div>
                        {link.descr && (
                          <div class="mt-2 text-sm text-gray-600 line-clamp-2">
                            {link.descr}
                          </div>
                        )}
                      </NCard>
                    </NGridItem>
                  ))}
                </NGrid>
              </NSpace>
              </NSpin>
            </NCard>
          )}

          {/* 导入结果 */}
          {showResult.value && importProgress.value === 100 && (
            <NAlert
              type={
                importResult.value.fail === 0 ? 'success' : 'warning'
              }
              title="导入结果"
              closable
              onClose={() => (showResult.value = false)}
            >
              <div class="text-sm">
                <p>总计: {importResult.value.total} 个友链</p>
                <p>成功: {importResult.value.success} 个</p>
                {importResult.value.skip > 0 && (
                  <p>跳过(已存在): {importResult.value.skip} 个</p>
                )}
                {importResult.value.fail > 0 && (
                  <p>失败: {importResult.value.fail} 个</p>
                )}
                {importResult.value.success > 0 && (
                  <p class="mt-2 text-green-600">友链已成功添加到系统中</p>
                )}
              </div>
            </NAlert>
          )}
        </NSpace>
      </div>
    )
  },
})