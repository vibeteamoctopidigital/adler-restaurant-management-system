import { useMemo } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  employeeService,
  type Employee,
  type EmployeeFilters,
  type EmployeeInput,
} from '../api/employee.service';
import type { ListResponse } from '@/types';

// ─── Query Keys ────────────────────────────────────────────
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: EmployeeFilters) => [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  stats: () => [...employeeKeys.all, 'stats'] as const,
};

// ─── Queries ───────────────────────────────────────────────
export function useEmployees(
  filters: EmployeeFilters = {}
): UseQueryResult<ListResponse<Employee>> {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: () => employeeService.getAll(filters),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useEmployee(id: string): UseQueryResult<Employee> {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeeService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Mutations ─────────────────────────────────────────────
export function useCreateEmployee(): UseMutationResult<Employee, Error, EmployeeInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeeInput) => employeeService.create(data),
    onMutate: async (newEmployee) => {
      await qc.cancelQueries({ queryKey: employeeKeys.lists() });
      const previousLists = qc.getQueriesData({ queryKey: employeeKeys.lists() });
      qc.setQueriesData(
        { queryKey: employeeKeys.lists() },
        (old: any) => ({
          ...old,
          items: old?.items ? [{ id: '__temp__', ...newEmployee }, ...old.items] : [],
          total: (old?.total ?? 0) + 1,
        })
      );
      return { previousLists };
    },
    onError: (_error, _variables, context: any) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]: any) => qc.setQueryData(key, data));
      }
      toast.error('Failed to create employee');
    },
    onSuccess: (emp) => {
      qc.invalidateQueries({ queryKey: employeeKeys.lists() });
      toast.success(`✓ ${emp.name} added`);
    },
  });
}

export function useUpdateEmployee(): UseMutationResult<
  Employee, Error, { id: string; data: Partial<EmployeeInput> }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => employeeService.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: employeeKeys.detail(id) });
      const previousEmployee = qc.getQueryData<Employee>(employeeKeys.detail(id));
      if (previousEmployee) {
        qc.setQueryData(employeeKeys.detail(id), { ...previousEmployee, ...data });
      }
      return { previousEmployee };
    },
    onError: (_error, variables, context: any) => {
      if (context?.previousEmployee) {
        qc.setQueryData(employeeKeys.detail(variables.id), context.previousEmployee);
      }
      toast.error('Failed to update employee');
    },
    onSuccess: (emp) => {
      qc.setQueryData(employeeKeys.detail(emp.id), emp);
      qc.invalidateQueries({ queryKey: employeeKeys.lists() });
      toast.success(`✓ ${emp.name} updated`);
    },
  });
}

export function useDeleteEmployee(): UseMutationResult<{ id: string }, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeService.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: employeeKeys.lists() });
      const previousLists = qc.getQueriesData({ queryKey: employeeKeys.lists() });
      qc.setQueriesData(
        { queryKey: employeeKeys.lists() },
        (old: any) => ({
          ...old,
          items: old?.items ? old.items.filter((e: Employee) => e.id !== id) : [],
          total: Math.max(0, (old?.total ?? 0) - 1),
        })
      );
      return { previousLists, deletedId: id };
    },
    onError: (_error, _id, context: any) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]: any) => qc.setQueryData(key, data));
      }
      toast.error('Failed to delete employee');
    },
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: employeeKeys.detail(id) });
      toast.success('✓ Employee removed');
    },
  });
}

export function useUpdateEmployeeStatus(): UseMutationResult<
  Employee, Error, { id: string; status: Employee['status'] }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => employeeService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: employeeKeys.detail(id) });
      const previousEmployee = qc.getQueryData<Employee>(employeeKeys.detail(id));
      if (previousEmployee) {
        qc.setQueryData(employeeKeys.detail(id), { ...previousEmployee, status });
      }
      return { previousEmployee };
    },
    onError: (_error, variables, context: any) => {
      if (context?.previousEmployee) {
        qc.setQueryData(employeeKeys.detail(variables.id), context.previousEmployee);
      }
    },
    onSuccess: (emp) => {
      qc.setQueryData(employeeKeys.detail(emp.id), emp);
      qc.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

// ─── Utility Hooks ─────────────────────────────────────────
export function useMutatingIds(
  createMut: UseMutationResult<Employee, Error, EmployeeInput>,
  updateMut: UseMutationResult<Employee, Error, { id: string; data: Partial<EmployeeInput> }>,
  deleteMut: UseMutationResult<{ id: string }, Error, string>
): string | null {
  return useMemo(() => {
    if (createMut.isPending) return '__creating__';
    if (updateMut.isPending && updateMut.variables?.id) return updateMut.variables.id;
    if (deleteMut.isPending && deleteMut.variables) return deleteMut.variables;
    return null;
  }, [createMut.isPending, updateMut.isPending, updateMut.variables?.id, deleteMut.isPending, deleteMut.variables]);
}

export function useEmployeeStats(employees: Employee[]) {
  return useMemo(() => employeeService.getStats(employees), [employees]);
}
