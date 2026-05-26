import { Link } from 'lucide-react'

import { defineMetadata } from '~/lib/route-meta'

export const metadata = defineMetadata({
  titleKey: 'routes.aiSlugBackfill.title',
  descriptionKey: 'routes.aiSlugBackfill.description',
  icon: Link,
  order: 6,
})

export { AiRouteView as default } from '~/features/ai/routes/AiRouteView'
