export enum EnumPageType {
  'md' = 'md',
  'html' = 'html',
  'frame' = 'frame',
}
export interface PageModel {
  /** Slug */
  slug: string

  /** Title */
  title: string

  /** SubTitle */
  subtitle?: string

  /** Order */
  order?: number

  /** Text */
  text: string

  /** Type (MD | html | frame) */
  type?: EnumPageType

  /** Other Options */
  options?: object
}
