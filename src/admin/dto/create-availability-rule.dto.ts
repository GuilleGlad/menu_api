export interface CreateAvailabilityRuleDto {
  restaurant_id?: string;
  target_type?: string | null;
  target_id?: string | null;
  day_of_week?: number | null; // 0-6 or null
  start_time?: number; // default 0
  end_time?: number; // default 1440
  start_date?: string | null; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD

}
