export type AlertType = "price" | "signal" | "confidence" | "rsi";
export type AlertOperator = "gt" | "lt" | "gte" | "lte" | "eq";
export type AlertStatus = "active" | "inactive";

export interface AlertCreate {
  ticker: string;
  alert_type: AlertType;
  operator: AlertOperator;
  threshold: number;
  parameters?: Record<string, unknown>;
}

export interface AlertUpdate {
  status?: AlertStatus;
  threshold?: number;
  operator?: AlertOperator;
  parameters?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  ticker: string;
  alert_type: AlertType;
  operator: AlertOperator;
  threshold: number;
  parameters: Record<string, unknown> | null;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
  trigger_count: number;
}

export interface TriggeredAlert {
  id: string;
  alert_id: string;
  ticker: string;
  alert_type: AlertType;
  operator: AlertOperator;
  threshold: number;
  triggered_value: number;
  triggered_at: string;
  snapshot: Record<string, unknown> | null;
}
