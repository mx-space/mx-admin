import { FileText } from 'lucide-react'

import { defineMetadata } from '~/lib/route-meta'

export const metadata = defineMetadata({
  titleKey: 'routes.aiSummary.title',
  descriptionKey: 'routes.aiSummary.description',
  icon: FileText,
  order: 1,
})

export { AiRouteView as default } from '~/features/ai/routes/AiRouteView'
