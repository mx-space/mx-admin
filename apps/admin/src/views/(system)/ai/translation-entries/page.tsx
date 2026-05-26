import { BookOpenText } from 'lucide-react'

import { defineMetadata } from '~/lib/route-meta'

export const metadata = defineMetadata({
  titleKey: 'routes.aiTranslationEntries.title',
  descriptionKey: 'routes.aiTranslationEntries.description',
  icon: BookOpenText,
  order: 4,
})

export { AiRouteView as default } from '~/features/ai/routes/AiRouteView'
