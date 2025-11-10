export class CreateUserDto {
  email?: string;
  password?: string;
  role?: 'client' | 'admin';
}
