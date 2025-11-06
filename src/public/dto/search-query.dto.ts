export class MenuSearchQueryDto {
  q?: string;
  locale?: string;
  section_id?: string;
  tags?: string | string[]; // comma separated or repeated param
}
