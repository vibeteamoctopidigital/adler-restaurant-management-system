import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { approvalService, type ApprovalFilters } from '../api/approval.service';

export const approvalKeys = {
  all: ['approvals'] as const,
  list: (filters: ApprovalFilters) => [...approvalKeys.all, 'list', filters] as const,
};

export function useApprovals(filters: ApprovalFilters = {}) {
  return useQuery({
    queryKey: approvalKeys.list(filters),
    queryFn: () => approvalService.getAll(filters),
    placeholderData: keepPreviousData,
  });
}

export function useReviewApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      comments,
    }: {
      id: string;
      action: 'approve' | 'reject';
      comments?: string;
    }) => approvalService.review(id, action, comments),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: approvalKeys.all });
      toast.success(vars.action === 'approve' ? 'Swap approved' : 'Swap rejected');
    },
  });
}
