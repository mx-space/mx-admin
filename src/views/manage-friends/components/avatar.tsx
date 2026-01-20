import { NAvatar } from 'naive-ui'
import { defineComponent, ref } from 'vue'

import { useIntersectionObserver } from '@vueuse/core'

import FallbackAvatar from './fallback.jpg'

export const Avatar = defineComponent<{ avatar: string; name: string }>(
  (props) => {
    const $ref = ref<HTMLElement>()

    const inView = ref(false)
    const observer = useIntersectionObserver($ref, (intersection) => {
      if (intersection[0].isIntersecting) {
        inView.value = true
        observer.stop()
      }
    })
    return () => (
      <div ref={$ref}>
        {props.avatar ? (
          inView.value ? (
            <NAvatar
              src={props.avatar as string}
              round
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = FallbackAvatar
              }}
            />
          ) : (
            <NAvatar round>{props.name.charAt(0)}</NAvatar>
          )
        ) : (
          <NAvatar round>{props.name.charAt(0)}</NAvatar>
        )}
      </div>
    )
  },
)
;(Avatar as any).props = ['avatar', 'name']
