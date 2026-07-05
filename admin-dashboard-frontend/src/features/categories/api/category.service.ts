import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { buildQuery, type ListResponse } from '@/types';

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(''),
  defaultRate: z.number().optional().default(0),
  maxShifts: z.number().optional().default(0),
  sub: z.array(z.string()).optional().default([]),
  createdAt: z.string().optional().default(''),
});

export type Category = z.infer<typeof categorySchema>;

const listSchema = z.object({
  items: z.array(categorySchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export interface CategoryFilters {
  q?: string;
}

export type CategoryInput = Omit<Category, 'id' | 'createdAt'>;

export const categoryService = {
  getAll: (filters: CategoryFilters = {}): Promise<ListResponse<Category>> =>
    apiClient.get(`/categories${buildQuery(filters)}`, { schema: listSchema }),

  create: (data: Partial<CategoryInput> & { id?: string; name: string }): Promise<Category> =>
    apiClient.post('/categories', data, { schema: categorySchema }),

  update: (id: string, data: Partial<CategoryInput>): Promise<Category> =>
    apiClient.patch(`/categories/${id}`, data, { schema: categorySchema }),

  remove: (id: string): Promise<{ id: string }> =>
    apiClient.delete(`/categories/${id}`),
};
