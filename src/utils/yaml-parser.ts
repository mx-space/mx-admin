import yaml from 'js-yaml'
import type { LinkModel } from '~/models/link'
import { LinkState, LinkType } from '~/models/link'

/**
 * 解析Hexo友链YAML格式
 * 格式示例:
 * - name: Mix-Space
 *   link: https://mx-space.js.org
 *   avatar: htttps://mx-space.js.org
 *   descr: Mix Space 是一个现代化的前后端分离个人空间解决方案，也可以作为个人博客使用。
 */
export interface HexoLinkItem {
  name: string
  link: string
  avatar: string
  descr: string
}

/**
 * 将Hexo友链格式转换为系统友链格式
 */
export function convertHexoLinkToSystemLink(hexoLink: HexoLinkItem): Omit<LinkModel, 'id' | 'created' | 'hide' | 'email'> {
  return {
    name: hexoLink.name,
    url: hexoLink.link,
    avatar: hexoLink.avatar,
    description: hexoLink.descr,
    type: LinkType.Friend,
    state: LinkState.Pass,
  }
}

/**
 * 尝试修复YAML格式错误
 * @param yamlText 可能有格式错误的YAML文本
 * @returns 修复后的YAML文本
 */
export function tryFixYamlFormat(yamlText: string): string {
  let fixedText = yamlText.trim()
  
  // 修复常见的缩进问题
  const lines = fixedText.split('\n')
  const fixedLines = []
  let currentItemIndent = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()
    
    // 跳过空行
    if (!line.trim()) {
      fixedLines.push('')
      continue
    }
    
    // 检测是否是新的列表项
    if (line.trim().startsWith('-')) {
      currentItemIndent = line.indexOf('-')
      fixedLines.push(line)
    } else {
      // 处理属性行
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()
        
        // 如果当前行没有正确缩进，修复缩进
        if (currentItemIndent >= 0) {
          const expectedIndent = currentItemIndent + 2
          const actualIndent = line.search(/\S/)
          
          if (actualIndent !== expectedIndent) {
            const fixedLine = ' '.repeat(expectedIndent) + key + ': ' + value
            fixedLines.push(fixedLine)
            continue
          }
        }
      }
      fixedLines.push(line)
    }
  }
  
  fixedText = fixedLines.join('\n')
  
  // 如果文本不是以'-'开头，且不包含'links:'或'friends:'，则添加一个顶级键
  if (!fixedText.startsWith('-') && 
      !fixedText.includes('links:') && 
      !fixedText.includes('friends:')) {
    fixedText = `links:\n${fixedText}`
  }
  
  return fixedText
}

/**
 * 解析Hexo友链YAML文本
 * @param yamlText YAML格式的友链文本
 * @param autoFix 是否尝试自动修复格式错误
 * @returns 解析后的友链数组
 */
export function parseHexoLinkYaml(yamlText: string, autoFix: boolean = false): HexoLinkItem[] {
  try {
    // 预处理YAML文本，处理可能的格式问题
    let processedText = yamlText.trim()
    
    if (autoFix) {
      processedText = tryFixYamlFormat(processedText)
    } else {
      // 如果文本不是以'-'开头，且不包含'links:'或'friends:'，则添加一个顶级键
      if (!processedText.startsWith('-') && 
          !processedText.includes('links:') && 
          !processedText.includes('friends:')) {
        processedText = `links:\n${processedText}`
      }
    }
    
    // 处理YAML格式
    let parsed
    try {
      parsed = yaml.load(processedText)
    } catch (error) {
      // 如果启用了自动修复但仍然解析失败，尝试更激进的修复
      if (autoFix) {
        // 尝试修复引号问题
        processedText = processedText.replace(/(\w+):/g, '"$1":')
                                    .replace(/: (\w+[^,\n]*)/g, ': "$1"')
        try {
          // 尝试作为JSON解析
          parsed = JSON.parse(`{${processedText}}`)
        } catch {
          // 如果JSON解析也失败，重新抛出原始错误
          throw error
        }
      } else {
        throw error
      }
    }

    // 如果解析结果不是数组，尝试其他格式
    if (!Array.isArray(parsed)) {
      // 尝试解析为对象格式的YAML
      if (typeof parsed === 'object' && parsed !== null) {
        // 检查是否是分类格式的友链
        const allLinks: any[] = []
        let hasClassFormat = false
        
        // 遍历所有顶级键，检查是否包含class_name和link_list结构
        for (const key in parsed) {
          const classObj = (parsed as any)[key]
          if (classObj && typeof classObj === 'object' && classObj.link_list && Array.isArray(classObj.link_list)) {
            hasClassFormat = true
            allLinks.push(...classObj.link_list)
          }
        }
        
        if (hasClassFormat && allLinks.length > 0) {
          return normalizeLinks(allLinks)
        }
        
        // 检查常见的友链字段名
        const possibleFields = ['links', 'friends', 'friendlinks', 'blogroll', 'sites']
        for (const field of possibleFields) {
          const links = (parsed as any)[field]
          if (Array.isArray(links)) {
            return normalizeLinks(links)
          }
        }
        
        // 如果没有找到预定义的字段，但对象本身包含多个键值对，可能是单个友链
        if (Object.keys(parsed).includes('name') && Object.keys(parsed).includes('link')) {
          return normalizeLinks([parsed as any])
        }
      }
      throw new Error('无法识别的YAML格式，请确保是有效的友链列表')
    }
    
    return normalizeLinks(parsed)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`YAML解析错误: ${error.message}`)
    }
    throw new Error('YAML解析错误')
  }
}

/**
 * 标准化友链数据，处理不同格式的字段名
 */
function normalizeLinks(items: any[]): HexoLinkItem[] {
  return items.map((item, index) => {
    // 处理不同的字段命名
    const name = item.name || item.title || item.site || ''
    const link = item.link || item.url || item.site_url || item.siteUrl || ''
    const avatar = item.avatar || item.image || item.img || item.icon || item.logo || ''
    const descr = item.descr || item.description || item.desc || item.intro || item.summary || ''
    
    // 验证必要字段
    if (!name) {
      throw new Error(`第${index + 1}个友链缺少名称字段`)
    }
    if (!link) {
      throw new Error(`友链"${name}"缺少链接字段`)
    }
    
    return {
      name,
      link,
      avatar,
      descr,
    }
  })
}

/**
 * 批量转换Hexo友链为系统友链格式
 */
export function batchConvertHexoLinks(hexoLinks: HexoLinkItem[]): Array<Omit<LinkModel, 'id' | 'created' | 'hide' | 'email'>> {
  return hexoLinks.map(convertHexoLinkToSystemLink)
}