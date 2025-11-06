import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type AdminRole = 'owner' | 'manager' | 'editor' | 'viewer';
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
