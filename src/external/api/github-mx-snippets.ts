import { Octokit } from 'octokit'

const client = new Octokit({})
if (import.meta.env.GH_TOKEN) {
  client.auth(import.meta.env.GH_TOKEN)
}

export namespace GitHubSnippetRepo {
  export async function fetchRepo() {
    const repo = await client.rest.repos.get({
      owner: 'mx-space',
      repo: 'snippets',
    })
    return repo.data
  }

  export async function fetchFileTree(path = '') {
    const tree = await client.rest.repos.getContent({
      owner: 'mx-space',
      repo: 'snippets',
      path,
    })

    return tree.data
  }

  export async function searchFile(path = '') {
    const tree = await client.rest.search.code({
      q: `repo:mx-space/snippets in:path ${path}`,
      sort: 'indexed',
      order: 'desc',
    })
    return tree.data
  }
}
