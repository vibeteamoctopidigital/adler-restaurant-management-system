import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  workloadService,
  type WorkloadFilters,
  type WorkloadSheetInput,
} from '../api/workload.service';

export const workloadKeys = {
  all: ['workload-sheets'] as const,
  list: (filters: WorkloadFilters) => [...workloadKeys.all, 'list', filters] as const,
  detail: (id: string) => [...workloadKeys.all, 'detail', id] as const,
};

export function useWorkloadSheets(filters: WorkloadFilters = {}) {
  return useQuery({
    queryKey: workloadKeys.list(filters),
    queryFn: () => workloadService.getAll(filters),
    placeholderData: keepPreviousData,
  });
}

export function useWorkloadSheet(id: string | undefined) {
  return useQuery({
    queryKey: workloadKeys.detail(id ?? ''),
    queryFn: () => workloadService.getById(id as string),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}

export function useCreateWorkloadSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WorkloadSheetInput) => workloadService.create(data),
    onSuccess: (sheet) => {
      qc.invalidateQueries({ queryKey: workloadKeys.all });
      toast.success('Workload sheet created', {
        description: `Week ${sheet.weekNumber} · ${sheet.month}`,
      });
    },
    onError: () => {
      toast.error('Could not create workload sheet. Please try again.');
    },
  });
}

export function useUpdateWorkloadSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkloadSheetInput> }) =>
      workloadService.update(id, data),
    onSuccess: (sheet) => {
      qc.invalidateQueries({ queryKey: workloadKeys.all });
      qc.invalidateQueries({ queryKey: workloadKeys.detail(sheet.id) });
      toast.success('Workload sheet updated');
    },
    onError: () => {
      toast.error('Could not update workload sheet. Please try again.');
    },
  });
}

export function useDeleteWorkloadSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workloadService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workloadKeys.all });
      toast.success('Workload sheet deleted');
    },
    onError: () => {
      toast.error('Could not delete workload sheet. Please try again.');
    },
  });
}
