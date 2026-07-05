import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { buildQuery, type ListResponse } from '@/types';

export const availabilitySchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  slots: z.array(
    z.object({
      day: z.string(),
      available: z.boolean(),
      timeRange: z.object({ start: z.string(), end: z.string() }),
    })
  ),
});

export type Availability = z.infer<typeof availabilitySchema>;

const listSchema = z.object({
  items: z.array(availabilitySchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const availabilityService = {
  getAll: (employeeId?: string): Promise<ListResponse<Availability>> =>
    apiClient.get(`/availability${buildQuery({ employeeId })}`, { schema: listSchema }),
};
