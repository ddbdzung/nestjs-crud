export function getViewer(req: any) {
  return req?.user ?? req?.viewer ?? null
}

export function getViewerId(req: any) {
  const viewer = getViewer(req)
  const selector = ['id', 'viewerId', 'userId']
  const value = selector.find((key) => viewer?.[key])
  return value ? viewer?.[value] : null
}

export function getViewerName(req: any) {
  const viewer = getViewer(req)
  return viewer?.name ?? null
}

export function getViewerEmail(req: any) {
  const viewer = getViewer(req)
  return viewer?.email ?? null
}
