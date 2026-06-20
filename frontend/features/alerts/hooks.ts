import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import {
  listAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  getAlertTriggers,
} from "@/features/alerts/api";
import type { AlertCreate, AlertUpdate } from "@/features/alerts/types";

export function useAlertsQuery(status?: string) {
  return useQuery({
    queryKey: [...queryKeys.alerts.all, status].filter(Boolean),
    queryFn: () => listAlerts(status),
  });
}

export function useAlertTriggersQuery(alertId: string | null) {
  return useQuery({
    queryKey: queryKeys.alerts.triggers(alertId ?? ""),
    queryFn: () => getAlertTriggers(alertId!),
    enabled: !!alertId,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AlertCreate) => createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AlertUpdate }) => updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}
