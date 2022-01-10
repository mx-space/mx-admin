import { useProviders } from 'hooks/use-deps-injection'
import { AppStore } from './app'
import { CategoryStore } from './category'
import { UIStore } from './ui'
import { UserStore } from './user'

export const provideStore = () =>
  useProviders(UIStore, UserStore, CategoryStore, AppStore)
