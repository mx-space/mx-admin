import { Octokit } from 'octokit'
import { toast } from 'vue-sonner'

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

octokit.hook.error('request', async (error, _options) => {
  try {
    toast.error(error.message)
  } catch {
    // noop
  }
  throw error
})

export { octokit }
