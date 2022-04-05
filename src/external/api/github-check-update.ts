import PKG from '../../../package.json'
import { octokit } from './octokit'

export const checkUpdateFromGitHub = async () => {
  const { data: system } = await octokit.rest.repos.getLatestRelease({
    owner: 'mx-space',
    repo: 'mx-server',
  })

  const { data: dashboard } = await octokit.rest.repos.getLatestRelease({
    owner: 'mx-space',
    repo: PKG.name,
  })

  return {
    system: system.tag_name.replace(/^v/, ''),
    dashboard: dashboard.tag_name.replace(/^v/, ''),
  }
}
