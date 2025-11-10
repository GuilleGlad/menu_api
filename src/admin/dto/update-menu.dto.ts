export class UpdateMenuDto {
  name?: string;
  description?: string | null;
  is_published?: boolean;
  published_at?: string | Date | null;
  valid_from?: string | Date | null;
  valid_to?: string | Date | null;
  sort_order?: number;
  content?: any;
}
