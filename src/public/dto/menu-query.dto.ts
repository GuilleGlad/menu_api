export class MenuQueryDto {
  locale?: string;
  expand?: string; // comma separated list, default 'sections,items,variants,tags,allergens'
  include_availability?: string | boolean;
  at?: string; // datetime string
}
