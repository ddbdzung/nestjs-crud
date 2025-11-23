/*
  1 Module -> n Feature -> n Action
*/

/** Vai trò */
export enum ERole {
  ADMIN = 'admin',
  USER = 'user',
}

/** Phân hệ */
export enum EPermissionModule {
  ACCOUNT = 'account', // Module tài khoản
  POST = 'post', // Module bài viết
  OBJECT = 'object', // Module đối tượng
}

/** Hành động */
export enum EPermissionAction {
  MANAGE = 'manage', // Quản lý
  READ = 'read', // Xem
  CREATE = 'create', // Tạo
  UPDATE = 'update', // Cập nhật
  DELETE = 'delete', // Xóa

  // OTHER = 'other', // Các hành động khác
}

/** Tính năng */
export enum EPermissionFeature {
  CAR = 'car', // Feature xe
  TOOL = 'tool', // Feature công cụ
  HOUSE = 'house', // Feature nhà

  // OTHER = 'other', // Các hành động khác
}

export type EPermission =
  | `${EPermissionModule}:${EPermissionAction}:${EPermissionFeature}`
  | `${EPermissionModule}:${EPermissionAction}`

export const WHITELIST_AUTHORIZED_EMAILS: string[] = [
  'ddbdzung.wa@gmail.com',
  'trangxinhngoanyeu@viktech.com',
]
