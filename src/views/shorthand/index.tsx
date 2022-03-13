/**
 * 最近 & 速记
 */

import { Icon } from '@vicons/utils'
import { AddIcon, PenIcon } from 'components/icons'
import { useShorthand } from 'components/shorthand'
import { RelativeTime } from 'components/time/relative-time'
import { RecentlyModel } from 'models/recently'
import { NButton, NPopconfirm, NTimeline, NTimelineItem } from 'naive-ui'
import { defineComponent, onMounted } from 'vue'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'
import styles from './index.module.css'
export default defineComponent({
  setup() {
    const data = ref([] as RecentlyModel[])
    const loading = ref(true)
    onMounted(async () => {
      RESTManager.api.recently.all
        .get<{ data: RecentlyModel[] }>()
        .then((res) => {
          data.value = res.data
          loading.value = false
        })
    })
    const { create } = useShorthand()
    return () => (
      <ContentLayout
        actionsElement={
          <>
            <HeaderActionButton
              onClick={() => {
                create().then((res) => {
                  if (res) {
                    data.value.unshift(res)
                  }
                })
              }}
              icon={<AddIcon />}
            />
          </>
        }
      >
        <NTimeline>
          {data.value.map((item) => {
            return (
              <NTimelineItem type="success" key={item.id}>
                {{
                  icon() {
                    return (
                      <Icon>
                        <PenIcon />
                      </Icon>
                    )
                  },
                  default() {
                    return (
                      <div class={styles['timeline-grid']}>
                        <span>{item.content}</span>

                        <div class="action">
                          <NPopconfirm
                            placement="left"
                            positiveText={'取消'}
                            negativeText="删除"
                            onNegativeClick={async () => {
                              await RESTManager.api.recently(item.id).delete()
                              message.success('删除成功')
                              data.value.splice(data.value.indexOf(item), 1)
                            }}
                          >
                            {{
                              trigger: () => (
                                <NButton text type="error" size="tiny">
                                  移除
                                </NButton>
                              ),

                              default: () => (
                                <span class={'break-all max-w-48'}>
                                  确定要删除 {item.content} ?
                                </span>
                              ),
                            }}
                          </NPopconfirm>
                        </div>
                      </div>
                    )
                  },
                  footer() {
                    return <RelativeTime time={item.created} />
                  },
                }}
              </NTimelineItem>
            )
          })}
        </NTimeline>
      </ContentLayout>
    )
  },
})
