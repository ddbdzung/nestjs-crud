import { ClsService } from 'nestjs-cls'

import { IAccountAuth } from './services/base.interface'

export function getViewer(req: any): IAccountAuth | null {
  return req?.viewer ?? null
}

export function getViewerId(req: any): string | null {
  const viewer = getViewer(req)
  if (!viewer) return null

  return viewer.id ?? null
}

export function getViewerName(req: any): string {
  const viewer = getViewer(req)
  if (!viewer) return ''

  return viewer.name ?? ''
}

export function getViewerEmail(req: any): string {
  const viewer = getViewer(req)
  if (!viewer) return ''

  return viewer.email ?? ''
}

export function setViewerToRequest(req: any, viewer: IAccountAuth) {
  req['viewer'] = viewer as IAccountAuth
}

export function setViewerIdToCls(cls: ClsService, viewerId: string | null) {
  cls.set('viewerId', viewerId)
}

export function setViewerNameToCls(cls: ClsService, viewerName: string) {
  cls.set('viewerName', viewerName)
}

export function setViewerEmailToCls(cls: ClsService, viewerEmail: string) {
  cls.set('viewerEmail', viewerEmail)
}
