import { Octokit } from 'octokit'

const octokit = new Octokit(
  import.meta.env.GH_TOKEN
    ? {
        auth: import.meta.env.GH_TOKEN,
      }
    : {},
)

octokit.hook.error('request', async (error, options) => {
  try {
    message.error(error.message)
  } catch {}
  throw error
})

export { octokit }
