import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { buildQuery, type ListResponse } from '@/types';

export const approvalSchema = z.object({
  id: z.string(),
  planId: z.string().optional().default(''),
  type: z.string().optional().default('swap_request'),
  status: z.enum(['pending', 'approved', 'rejected']),
  submittedBy: z.string().optional().default(''),
  submittedDate: z.string().optional().default(''),
  reviewedBy: z.string().nullable().optional().default(null),
  reviewDate: z.string().nullable().optional().default(null),
  comments: z.string().optional().default(''),
  swapData: z.object({
    fromEmployeeId: z.string(),
    toEmployeeId: z.string(),
    fromShift: z.object({ day: z.string(), time: z.string(), category: z.string() }),
    toShift: z.object({ day: z.string(), time: z.string(), category: z.string() }),
    ruleCheck: z.enum(['pass', 'fail']),
    ruleNote: z.string().nullable().optional().default(null),
  }),
});

export type Approval = z.infer<typeof approvalSchema>;

const listSchema = z.object({
  items: z.array(approvalSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export interface ApprovalFilters {
  status?: string;
}

export const approvalService = {
  getAll: (filters: ApprovalFilters = {}): Promise<ListResponse<Approval>> =>
    apiClient.get(`/approvals${buildQuery(filters)}`, { schema: listSchema }),

  review: (
    id: string,
    action: 'approve' | 'reject',
    comments = ''
  ): Promise<Approval> =>
    apiClient.patch(
      `/approvals/${id}`,
      {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: 'admin1',
        reviewDate: new Date().toISOString(),
        comments,
      },
      { schema: approvalSchema }
    ),
};
