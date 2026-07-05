/**
 * Employees Dashboard Page
 * Refactored with better component chunking, improved UI theme, and optimized re-renders
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useUpdateEmployeeStatus,
  useMutatingIds,
} from '@/features/employees/hooks/use-employees';
import type { Employee, EmployeeInput } from '@/features/employees/api/employee.service';
import { useDebouncedValue } from '@/components/employee';
import { EmployeeDeleteConfirm, EmployeeFormModal } from '@/components/employee/modal-components';
import { EmployeeHeader } from '@/components/employee/employee-header-component';
import { EmployeeFilters } from '@/components/employee/employee-filters-component';
import { EmployeeTableContainer } from '@/components/employee/employee-table-container';

// Import refactored sub-components



// ─────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────

export function EmployeesPage() {
  // ─────────────────── STATE ────────────────────────
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  // ─────────────────── QUERIES & MUTATIONS ────────────────────────

  const { data, isLoading, isError, isFetching } = useEmployees({
    q: debouncedSearch || undefined,
    department: departmentFilter === 'all' ? undefined : departmentFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });


  const employeesData = {
    items:[
        {
                "id": "emp2",
                "name": "Jacob Jones",
                "email": "jacob@example.com",
                "department": "Kitchen",
                "designation": "Grill Cook",
                "employmentType": "Intern",
                "status": "Active",
                "salary": 2400,
                "phone": "0170000002",
                "address": "5 Bahnhofstrasse, Zurich",
                "avatar": "https://api.dicebear.com/7.x/notionists/svg?seed=Jacob",
                "categories": [
                    "kitchen"
                ],
                "contract": "monthly",
                "workload": 100,
                "createdAt": "2024-01-06T00:00:00Z"
            },
            {
                "id": "emp3",
                "name": "Kathryn Murphy",
                "email": "kathryn@example.com",
                "department": "Bar",
                "designation": "Bartender",
                "employmentType": "Full-time",
                "status": "Suspension",
                "salary": 3800,
                "phone": "0170000003",
                "address": "22 Lakeside Ave, Lucerne",
                "avatar": "https://api.dicebear.com/7.x/notionists/svg?seed=Kathryn",
                "categories": [
                    "service",
                    "bar"
                ],
                "contract": "monthly",
                "workload": 100,
                "createdAt": "2024-01-07T00:00:00Z"
            },
    ],
    total:2
  }

  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();
  const deleteMut = useDeleteEmployee();
  const statusMut = useUpdateEmployeeStatus();

  const mutatingId = useMutatingIds(createMut, updateMut, deleteMut);

  // ─────────────────── DATA ────────────────────────

  const employees = employeesData?.items ?? [];
  const totalCount = employeesData?.total ?? 0;

  // ─────────────────── HANDLERS ────────────────────────

  const handleOpenAddModal = useCallback(() => {
    setEditingEmployee(null);
    setModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((emp: Employee) => {
    setEditingEmployee(emp);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingEmployee(null);
  }, []);

  const handleSaveEmployee = useCallback(
    (formData: EmployeeInput) => {
      if (editingEmployee) {
        updateMut.mutate(
          { id: editingEmployee.id, data: formData },
          { onSuccess: handleCloseModal }
        );
      } else {
        createMut.mutate(formData, { onSuccess: handleCloseModal });
      }
    },
    [editingEmployee, updateMut, createMut]
  );

  const handleToggleStatus = useCallback(
    (emp: Employee) => {
      const nextStatus = emp.status === 'Active' ? 'Suspension' : 'Active';
      statusMut.mutate({ id: emp.id, status: nextStatus });
    },
    [statusMut]
  );

  const handleDeleteClick = useCallback((emp: Employee) => {
    setDeleteTarget(emp);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMut.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    }
  }, [deleteTarget, deleteMut]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  // ─────────────────── RENDER ────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <EmployeeHeader onAddClick={handleOpenAddModal} totalCount={totalCount} />

        {/* Filters */}
        <EmployeeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          isFetching={isFetching && !isLoading}
        />

        {/* Table */}
        <EmployeeTableContainer
          employees={employees as any}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          mutatingId={mutatingId}
          onEdit={handleOpenEditModal}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteClick}
          onAdd={handleOpenAddModal}
        />

        {/* Modals */}
        <EmployeeFormModal
          open={modalOpen}
          onOpenChange={handleCloseModal}
          editing={editingEmployee}
          onSave={handleSaveEmployee}
          isLoading={createMut.isPending || updateMut.isPending}
        />

        <EmployeeDeleteConfirm
          open={!!deleteTarget}
          onOpenChange={handleCloseDeleteDialog}
          employee={deleteTarget}
          isLoading={deleteMut.isPending}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
}
