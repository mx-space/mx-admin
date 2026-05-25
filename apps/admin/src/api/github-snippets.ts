interface GitHubContentItem {
  download_url?: string | null
  html_url?: string | null
  name: string
  type: 'dir' | 'file' | string
}

const repoContentsUrl =
  'https://api.github.com/repos/mx-space/snippets/contents'

export async function fetchGitHubSnippetTree(path = '') {
  const target = path
    ? `${repoContentsUrl}/${path.split('/').map(encodeURIComponent).join('/')}`
    : repoContentsUrl
  const response = await fetch(target)

  if (!response.ok) {
    throw new Error('获取 GitHub Snippets 仓库失败')
  }

  return (await response.json()) as GitHubContentItem[] | GitHubContentItem
}

export async function fetchGitHubText(downloadUrl: string) {
  const response = await fetch(downloadUrl)

  if (!response.ok) {
    throw new Error('获取文件内容失败')
  }

  return response.text()
}
