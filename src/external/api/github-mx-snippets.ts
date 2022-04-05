import { octokit } from './octokit'

export namespace GitHubSnippetRepo {
  export async function fetchRepo() {
    const repo = await octokit.rest.repos.get({
      owner: 'mx-space',
      repo: 'snippets',
    })
    return repo.data
  }

  export async function fetchFileTree(path = '') {
    const tree = await octokit.rest.repos.getContent({
      owner: 'mx-space',
      repo: 'snippets',
      path,
    })

    return tree.data
  }

  export async function searchFile(path = '') {
    const tree = await octokit.rest.search.code({
      q: `repo:mx-space/snippets in:path ${path}`,
      sort: 'indexed',
      order: 'desc',
    })
    return tree.data
  }
}
