import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  planService,
  type PlanFilters,
  type PlanInput,
  type PlanStatus,
} from '../api/plan.service';

export const planKeys = {
  all: ['plans'] as const,
  list: (filters: PlanFilters) => [...planKeys.all, 'list', filters] as const,
  detail: (id: string) => [...planKeys.all, 'detail', id] as const,
};

export function usePlans(filters: PlanFilters = {}) {
  return useQuery({
    queryKey: planKeys.list(filters),
    queryFn: () => planService.getAll(filters),
    placeholderData: keepPreviousData,
  });
}

export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: planKeys.detail(id ?? ''),
    queryFn: () => planService.getById(id as string),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PlanInput) => planService.create(data),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: planKeys.all });
      toast.success(
        plan.status === 'draft' ? 'Plan saved as draft' : 'Plan created',
        { description: `Week ${plan.weekNumber} · ${plan.month}` }
      );
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlanInput }) =>
      planService.update(id, data),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: planKeys.all });
      qc.invalidateQueries({ queryKey: planKeys.detail(plan.id) });
      toast.success('Plan updated');
    },
  });
}

export function useChangePlanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlanStatus }) =>
      planService.changeStatus(id, status),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: planKeys.all });
      qc.invalidateQueries({ queryKey: planKeys.detail(plan.id) });
      if (plan.status === 'submitted') {
        // Mock email notification to assigned employees.
        plan.assignments.forEach((a) => {
          // eslint-disable-next-line no-console
          console.log(`[email] Notifying employee ${a.employeeId} of submitted plan ${plan.id}`);
        });
        toast.success('Plan submitted — employees notified (logged)');
      } else {
        toast.success(`Plan ${plan.status}`);
      }
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: planKeys.all });
      toast.success('Plan deleted');
    },
  });
}
