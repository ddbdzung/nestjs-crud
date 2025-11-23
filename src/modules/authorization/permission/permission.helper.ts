import {
  EPermission,
  EPermissionAction,
  EPermissionFeature,
  EPermissionModule,
} from '../authorization.constant'

export function makePerm(
  module: EPermissionModule,
  action: EPermissionAction,
  feature?: EPermissionFeature
): EPermission {
  return [module, action, feature].filter(Boolean).join(':') as EPermission
}

export function parsePerm(perm: EPermission): {
  module: EPermissionModule
  action: EPermissionAction
  feature?: EPermissionFeature
} {
  const [module, action, feature] = perm.split(':')
  return {
    module: module as EPermissionModule,
    action: action as EPermissionAction,
    feature: feature as EPermissionFeature,
  }
}
