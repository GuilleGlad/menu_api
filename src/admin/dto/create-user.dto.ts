export class CreateUserDto {
  email?: string;
  password?: string;
  role?: 'client' | 'viewer' | 'editor' | 'manager' | 'owner';
}
