import { Octokit } from 'octokit'

const getGHTokenFromLocalStorage = () => {
  const token = localStorage.getItem('ghToken')
  if (token) {
    return token
  }
  return null
}

const octokit = new Octokit(
  getGHTokenFromLocalStorage()
    ? {
        auth: getGHTokenFromLocalStorage(),
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
