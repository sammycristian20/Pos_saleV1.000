export interface FiscalSequence {
  id: string;
  document_type: string;
  current_prefix: string;
  last_number: number;
  range_from: number;
  range_to: number;
  range_alert_threshold: number;
  active: boolean;
  created_at: string;
}