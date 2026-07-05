import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { buildQuery, type ListResponse } from '@/types';

export const shiftSchema = z.object({
  day: z.string(),
  date: z.string().optional().default(''),
  shiftType: z.string().optional().default(''),
  startTime: z.string(),
  endTime: z.string(),
  hours: z.number(),
});

export const assignmentSchema = z.object({
  employeeId: z.string(),
  categoryId: z.string(),
  shifts: z.array(shiftSchema),
  totalHours: z.number(),
});

export const manpowerNeedSchema = z.object({
  day: z.string(),
  shiftType: z.string(),
  categoryId: z.string(),
  required: z.number(),
});

export const planSchema = z.object({
  id: z.string(),
  weekNumber: z.number(),
  month: z.string(),
  dateRange: z.object({ start: z.string(), end: z.string() }),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']),
  manpower: z.array(manpowerNeedSchema).optional().default([]),
  assignments: z.array(assignmentSchema).optional().default([]),
  violations: z.array(z.string()).optional().default([]),
  createdBy: z.string().optional().default(''),
  createdAt: z.string().optional().default(''),
  submittedAt: z.string().nullable().optional().default(null),
  approvedBy: z.string().nullable().optional().default(null),
  approvedAt: z.string().nullable().optional().default(null),
});

export type Plan = z.infer<typeof planSchema>;
export type ManpowerNeed = z.infer<typeof manpowerNeedSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type PlanStatus = Plan['status'];

const listSchema = z.object({
  items: z.array(planSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export interface PlanFilters {
  status?: string;
  month?: string;
  _sort?: string;
  _order?: 'asc' | 'desc';
}

export type PlanInput = Partial<Omit<Plan, 'id'>>;

export const planService = {
  getAll: (filters: PlanFilters = {}): Promise<ListResponse<Plan>> =>
    apiClient.get(`/plans${buildQuery(filters)}`, { schema: listSchema }),

  getById: (id: string): Promise<Plan> =>
    apiClient.get(`/plans/${id}`, { schema: planSchema }),

  create: (data: PlanInput): Promise<Plan> =>
    apiClient.post('/plans', data, { schema: planSchema }),

  update: (id: string, data: PlanInput): Promise<Plan> =>
    apiClient.patch(`/plans/${id}`, data, { schema: planSchema }),

  changeStatus: (id: string, status: PlanStatus): Promise<Plan> => {
    const patch: PlanInput = { status };
    if (status === 'submitted') patch.submittedAt = new Date().toISOString();
    if (status === 'approved') {
      patch.approvedBy = 'admin1';
      patch.approvedAt = new Date().toISOString();
    }
    return apiClient.patch(`/plans/${id}`, patch, { schema: planSchema });
  },

  remove: (id: string): Promise<{ id: string }> => apiClient.delete(`/plans/${id}`),
};
