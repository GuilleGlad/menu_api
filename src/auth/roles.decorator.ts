import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Collapsed role model: only 'admin'. All non-admin authenticated users are treated as 'client'.
export type AdminRole = 'admin';
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
