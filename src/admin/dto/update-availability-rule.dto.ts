export interface UpdateAvailabilityRuleDto {
  restaurant_id?: string;   
  target_type?: string | null;
  target_id?: string | null;
  dow?: number | null;
  start_min?: number;
  end_min?: number;
  start_date?: string | null;
  end_date?: string | null;
}
