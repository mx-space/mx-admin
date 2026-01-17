import { cloneDeep, isEmpty } from 'es-toolkit/compat'
import {
  Calendar as CalendarIcon,
  Camera as CameraIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NInput,
  NSelect,
  NSkeleton,
  NUploadDragger,
  useMessage,
} from 'naive-ui'
import { computed, defineComponent, onMounted, ref } from 'vue'
import type { UserModel } from '~/models/user'

import Avatar from '~/components/avatar'
import { IpInfoPopover } from '~/components/ip-info'
import { RelativeTime } from '~/components/time/relative-time'
import { UploadWrapper } from '~/components/upload'
import { socialKeyMap } from '~/constants/social'
import { deepDiff, RESTManager } from '~/utils'

import styles from '../index.module.css'

export const TabUser = defineComponent(() => {
  const data = ref({} as UserModel)
  const loading = ref(true)
  let origin: UserModel

  async function fetchMaster() {
    loading.value = true
    const response = (await RESTManager.api.master.get()) as UserModel
    data.value = response
    origin = { ...response }
    loading.value = false
  }

  onMounted(async () => {
    await fetchMaster()
  })

  const message = useMessage()
  const diff = computed(() => deepDiff(origin, data.value))

  const handleSave = async () => {
    const submitData = cloneDeep(unref(diff))
    if (submitData.socialIds) {
      submitData.socialIds = data.value.socialIds
    }

    await RESTManager.api.master.patch({
      data: submitData,
    })
    message.success('保存成功')
    await fetchMaster()
  }

  const socialOptions = Object.keys(socialKeyMap).map((key) => ({
    label: key,
    value: socialKeyMap[key],
  }))

  const socialEntries = computed(() => {
    const ids = data.value.socialIds || {}
    return Object.entries(ids).map(([key, value]) => ({
      key,
      value: String(value),
    }))
  })

  const usedSocialKeys = computed(
    () => new Set(socialEntries.value.map((e) => e.key)),
  )

  const addSocialEntry = () => {
    if (!data.value.socialIds) {
      data.value.socialIds = {}
    }
    const availableKey =
      socialOptions.find((o) => !usedSocialKeys.value.has(o.value))?.value || ''
    data.value.socialIds = { ...data.value.socialIds, [availableKey]: '' }
  }

  const updateSocialKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return
    const ids = { ...data.value.socialIds }
    const value = ids[oldKey]
    delete ids[oldKey]
    ids[newKey] = value
    data.value.socialIds = ids
  }

  const updateSocialValue = (key: string, value: string) => {
    data.value.socialIds = { ...data.value.socialIds, [key]: value }
  }

  const removeSocialEntry = (key: string) => {
    const ids = { ...data.value.socialIds }
    delete ids[key]
    data.value.socialIds = ids
  }

  return () => <div class={styles.userTabContainer}></div>
})
