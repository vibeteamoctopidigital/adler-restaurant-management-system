import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { buildQuery, type ListResponse } from '@/types';

// ─── Schemas & Types ────────────────────────────────────────
export const EMPLOYMENT_TYPES = ['Full-time', 'Part time', 'Intern', 'Remote', 'Hybrid'] as const;
export const EMPLOYEE_STATUSES = [
  'Active', 'Leave', 'Suspension', 'Sacked', 'Resigned', 'Retired',
] as const;

export const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  password: z.string(),
  department: z.string(),
  designation: z.string(),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  status: z.enum(EMPLOYEE_STATUSES),
  salary: z.number(),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  avatar: z.string().optional().default(''),
  categories: z.array(z.string()).optional().default([]),
  contract: z.string().optional().default('monthly'),
  createdAt: z.string().optional().default(''),
});

export type Employee = z.infer<typeof employeeSchema>;
export type EmployeeInput = Omit<Employee, 'id' | 'createdAt'>;

const listResponseSchema = z.object({
  items: z.array(employeeSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export interface EmployeeFilters {
  q?: string;
  department?: string;
  status?: string;
  employmentType?: string;
  categories?: string;
  _page?: number;
  _limit?: number;
  _sort?: string;
  _order?: 'asc' | 'desc';
}

// ─── Service ────────────────────────────────────────────────
export const employeeService = {
  /** Fetch employees with optional filters (pagination, search, sort). */
  getAll: (filters: EmployeeFilters = {}): Promise<ListResponse<Employee>> =>
    apiClient.get(`/employees${buildQuery(filters)}`, { schema: listResponseSchema }),

  /** Get single employee by ID. */
  getById: (id: string): Promise<Employee> =>
    apiClient.get(`/employees/${id}`, { schema: employeeSchema }),

  /** Create new employee. */
  create: (data: EmployeeInput): Promise<Employee> =>
    apiClient.post('/employees', data, { schema: employeeSchema }),

  /** Update existing employee (partial). */
  update: (id: string, data: Partial<EmployeeInput>): Promise<Employee> =>
    apiClient.patch(`/employees/${id}`, data, { schema: employeeSchema }),

  /** Delete employee. */
  remove: (id: string): Promise<{ id: string }> =>
    apiClient.delete(`/employees/${id}`),

  /** Batch update status. */
  updateStatus: (id: string, status: Employee['status']): Promise<Employee> =>
    employeeService.update(id, { status }),

  // ─── Client-side utilities ─────────────────────────────

  /** Compute stats from an employee array. */
  getStats: (employees: Employee[]) => ({
    total: employees.length,
    active: employees.filter((e) => e.status === 'Active').length,
    suspended: employees.filter((e) => e.status === 'Suspension').length,
    onLeave: employees.filter((e) => e.status === 'Leave').length,
    byDepartment: groupBy(employees, 'department'),
    byType: groupBy(employees, 'employmentType'),
  }),

  /** Filter employees client-side by multiple criteria. */
  filterEmployees: (
    employees: Employee[],
    filters: { search?: string; department?: string; status?: string; type?: string }
  ): Employee[] =>
    employees.filter((e) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!e.name.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q)) return false;
      }
      if (filters.department && e.department !== filters.department) return false;
      if (filters.status && e.status !== filters.status) return false;
      if (filters.type && e.employmentType !== filters.type) return false;
      return true;
    }),
};

/** Group an array by a key. */
function groupBy<T extends Record<string, unknown>>(
  arr: T[],
  key: keyof T
): Record<string, number> {
  return arr.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      acc[groupKey] = (acc[groupKey] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}
