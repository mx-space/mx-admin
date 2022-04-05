import { Octokit } from 'octokit'

export const octokit = new Octokit(
  import.meta.env.GH_TOKEN
    ? {
        auth: import.meta.env.GH_TOKEN,
      }
    : {},
)
