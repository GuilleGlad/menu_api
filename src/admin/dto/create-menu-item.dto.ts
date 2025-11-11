export class CreateMenuItemDto {
	section_id!: string;
	name!: string;
	description?: string | null;
	base_price?: number;
	sort_order?: number;
	currency_code?: string;
	is_available?: boolean;
}
