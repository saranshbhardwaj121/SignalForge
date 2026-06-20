import { clientFetch } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { Alert, AlertCreate, AlertUpdate, TriggeredAlert } from "@/features/alerts/types";

export async function listAlerts(status?: string): Promise<Alert[]> {
  const path = status ? `${API_ROUTES.ALERTS.LIST}?status=${status}` : API_ROUTES.ALERTS.LIST;
  return clientFetch<Alert[]>(path);
}

export async function createAlert(data: AlertCreate): Promise<Alert> {
  return clientFetch<Alert>(API_ROUTES.ALERTS.CREATE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAlert(alertId: string): Promise<Alert> {
  return clientFetch<Alert>(API_ROUTES.ALERTS.DETAIL(alertId));
}

export async function updateAlert(alertId: string, data: AlertUpdate): Promise<Alert> {
  return clientFetch<Alert>(API_ROUTES.ALERTS.UPDATE(alertId), {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAlert(alertId: string): Promise<void> {
  return clientFetch<void>(API_ROUTES.ALERTS.DELETE(alertId), {
    method: "DELETE",
  });
}

export async function getAlertTriggers(alertId: string, limit = 50, offset = 0): Promise<TriggeredAlert[]> {
  return clientFetch<TriggeredAlert[]>(
    `${API_ROUTES.ALERTS.TRIGGERS(alertId)}?limit=${limit}&offset=${offset}`
  );
}
