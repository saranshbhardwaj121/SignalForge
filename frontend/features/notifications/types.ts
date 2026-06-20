export interface Notification {
  id: string;
  alert_id: string | null;
  ticker: string;
  alert_type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  read_at: string | null;
  triggered_value: number;
  threshold: number;
  triggered_at: string;
  created_at: string;
}

export interface UnreadCount {
  count: number;
}
