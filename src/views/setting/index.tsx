import {
  Fingerprint as FingerprintIcon,
  ListPlus as ListPlusIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  User as UserIcon,
} from 'lucide-vue-next'
import { defineComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import styles from './index.module.css'
import { TabAuth } from './tabs/auth'
import { TabMetaPresets } from './tabs/meta-presets'
import { TabSecurity } from './tabs/security'
import { TabSystem } from './tabs/system'
import { TabUser } from './tabs/user'

enum SettingTab {
  User = 'user',
  System = 'system',
  Security = 'security',
  Auth = 'auth',
  MetaPreset = 'meta-preset',
}

const tabConfig = [
  { key: SettingTab.User, label: '用户', icon: UserIcon, component: TabUser },
  {
    key: SettingTab.System,
    label: '系统',
    icon: SettingsIcon,
    component: TabSystem,
  },
  {
    key: SettingTab.Security,
    label: '安全',
    icon: ShieldIcon,
    component: TabSecurity,
  },
  {
    key: SettingTab.Auth,
    label: '登入方式',
    icon: FingerprintIcon,
    component: TabAuth,
  },
  {
    key: SettingTab.MetaPreset,
    label: 'Meta 预设',
    icon: ListPlusIcon,
    component: TabMetaPresets,
  },
]

export default defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()
    const tabValue = ref((route.params.type as string) || SettingTab.User)

    watch(
      () => route.params.type,
      (n) => {
        if (!n) {
          return
        }
        tabValue.value = n as any
      },
    )

    const handleTabChange = (key: string) => {
      router.replace({
        name: route.name as string,
        params: { ...route.params, type: key },
      })
    }

    return () => {
      const ActiveComponent =
        tabConfig.find((t) => t.key === tabValue.value)?.component || TabUser

      return (
        <div class={styles.container}>
          <nav class={styles.sidebar}>
            <ul class={styles.navList}>
              {tabConfig.map((tab) => {
                const Icon = tab.icon
                const isActive = tabValue.value === tab.key
                return (
                  <li key={tab.key}>
                    <button
                      class={[styles.navItem, isActive && styles.navItemActive]}
                      onClick={() => handleTabChange(tab.key)}
                      type="button"
                    >
                      <Icon class={styles.navIcon} aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <main class={styles.content}>
            <ActiveComponent />
          </main>
        </div>
      )
    }
  },
})
