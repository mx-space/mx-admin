/* eslint-disable @typescript-eslint/no-use-before-define */
import { RouteRecordNormalized } from 'vue-router'
import { routeForMenu } from '../router/router'

export interface MenuModel {
  title: string
  path: string
  icon: any
  subItems?: Array<MenuModel>
  hasParent: boolean
  fullPath: string
  query?: any
}

const model = (
  item: RouteRecordNormalized,
  hasParent: boolean,
  prevPath: string,
): MenuModel => {
  const fullPath = prevPath + '/' + item.path
  return {
    // @ts-ignore
    title: item.meta?.title || item.name || item.path,
    path: item.path && /^\//.test(item.path) ? item.path : '/' + item.path,
    icon: item.meta?.icon as any,
    subItems: buildSubMenus(item, fullPath),
    hasParent,
    fullPath,
    query: item.meta?.query,
  }
}
function buildSubMenus(route: RouteRecordNormalized, prevPath = '') {
  if (Array.isArray(route.children)) {
    return route.children
      .filter(item => {
        if (!item.meta) {
          return true
        }
        return item.meta.hide !== true
      })
      .map(item => {
        return model(item as RouteRecordNormalized, true, prevPath)
      })
  } else {
    return []
  }
}

export const buildMenus = (routes: Array<RouteRecordNormalized>): MenuModel[] =>
  (routes.find(
    item => item.name === 'home' && item.path === '/',
  ) as any).children
    .filter((item: RouteRecordNormalized) => item.path !== '*')
    .map((item: RouteRecordNormalized) => {
      return model(item, false, '')
    })
