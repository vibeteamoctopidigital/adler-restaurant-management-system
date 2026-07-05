import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { buildQuery, type ListResponse } from '@/types';

// ─── Schemas ────────────────────────────────────────────────

export const workloadEntrySchema = z.object({
  day: z.string(),
  shiftType: z.string(),
  categoryId: z.string(),
  categoryName: z.string().optional().default(''),
  required: z.number().min(0),
});

export type WorkloadEntry = z.infer<typeof workloadEntrySchema>;

export const workloadSheetSchema = z.object({
  id: z.string(),
  month: z.string(),
  weekNumber: z.number(),
  dateRange: z.object({ start: z.string(), end: z.string() }),
  label: z.string().optional().default(''),
  status: z.enum(['draft', 'published']),
  entries: z.array(workloadEntrySchema).optional().default([]),
  createdAt: z.string().optional().default(''),
  updatedAt: z.string().optional().default(''),
});

export type WorkloadSheet = z.infer<typeof workloadSheetSchema>;

export type WorkloadSheetInput = Omit<WorkloadSheet, 'id' | 'createdAt' | 'updatedAt'>;

const listSchema = z.object({
  items: z.array(workloadSheetSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export interface WorkloadFilters {
  month?: string;
  weekNumber?: string;
  status?: string;
}

// ─── Default shift types ────────────────────────────────────

export const SHIFT_TYPES = ['Lunch', 'Dinner'] as const;

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

// ─── Service ────────────────────────────────────────────────

export const workloadService = {
  getAll: (filters: WorkloadFilters = {}): Promise<ListResponse<WorkloadSheet>> =>
    apiClient.get(`/workload-sheets${buildQuery(filters)}`, { schema: listSchema }),

  getById: (id: string): Promise<WorkloadSheet> =>
    apiClient.get(`/workload-sheets/${id}`, { schema: workloadSheetSchema }),

  create: (data: WorkloadSheetInput): Promise<WorkloadSheet> =>
    apiClient.post('/workload-sheets', data, { schema: workloadSheetSchema }),

  update: (id: string, data: Partial<WorkloadSheetInput>): Promise<WorkloadSheet> =>
    apiClient.patch(`/workload-sheets/${id}`, data, { schema: workloadSheetSchema }),

  remove: (id: string): Promise<{ id: string }> =>
    apiClient.delete(`/workload-sheets/${id}`),
};
