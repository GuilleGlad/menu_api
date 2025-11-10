export class CreateMenuDto {
  name?: string;
  description?: string;
  is_published?: boolean;
  published_at?: string; // ISO string
  // Stored as JSONB; accept any serializable structure
  content?: any;
}
