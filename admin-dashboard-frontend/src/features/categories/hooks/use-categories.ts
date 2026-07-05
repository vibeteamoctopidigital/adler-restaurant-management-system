import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  categoryService,
  type CategoryFilters,
  type CategoryInput,
} from '../api/category.service';

export const categoryKeys = {
  all: ['categories'] as const,
  list: (filters: CategoryFilters) => [...categoryKeys.all, 'list', filters] as const,
};

/** Fetch the category list. Keeps previous data while filters change to avoid layout flicker. */
export function useCategories(filters: CategoryFilters = {}) {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: () => categoryService.getAll(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CategoryInput> & { id?: string; name: string }) =>
      categoryService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Category added');
    },
    onError: () => {
      toast.error('Could not create category. Please try again.');
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryInput> }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success('Category updated');
    },
    onError: () => {
      toast.error('Could not update category. Please try again.');
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryService.remove(id),
    onSuccess: () => {
      // qc.invalidateQueries({ queryKey: categoryKeys.all });
      // toast.success('Category deleted');
    },
    onError: () => {
      toast.error('Could not delete category. Please try again.');
    },
  });
}
