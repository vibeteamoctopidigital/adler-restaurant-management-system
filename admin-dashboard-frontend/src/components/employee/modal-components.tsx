/**
 * Employee Feature - Modal Components
 * Form modal for create/edit and confirmation dialogs
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { toast } from 'sonner';
import {
  type Employee,
  type EmployeeInput,
  EMPLOYMENT_TYPES,
  EMPLOYEE_STATUSES,
} from '@/features/employees/api/employee.service';
import {
  validateEmployeeForm,
  DEPARTMENTS,
} from '@/lib/employee-utilities';

// ─────────────────────────────────────────────────────────────
// DEFAULT FORM VALUES
// ─────────────────────────────────────────────────────────────

const DEFAULT_FORM: EmployeeInput = {
  name: '',
  email: '',
  password: '',
  department: 'Service',
  designation: '',
  employmentType: 'Full-time',
  status: 'Active',
  salary: 0,
  phone: '',
  address: '',
  avatar: '',
  categories: [],
  contract: 'monthly',
};

// ─────────────────────────────────────────────────────────────
// FORM MODAL COMPONENT
// ─────────────────────────────────────────────────────────────

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Employee | null;
  onSave: (data: EmployeeInput) => void;
  isLoading: boolean;
}

export function EmployeeFormModal({
  open,
  onOpenChange,
  editing,
  onSave,
  isLoading,
}: EmployeeFormModalProps) {
  const [form, setForm] = useState<EmployeeInput>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when editing
  useEffect(() => {
    if (editing && open) {
      const { id: _id, createdAt: _c, ...rest } = editing;
      setForm(rest);
      setErrors({});
    } else if (open) {
      setForm(DEFAULT_FORM);
      setErrors({});
    }
  }, [editing, open]);

  const handleChange = useCallback(
    (field: keyof EmployeeInput, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(() => {
    // Validate form
    const validationErrors = validateEmployeeForm(form);

    if (validationErrors.length > 0) {
      const errorMap = validationErrors.reduce(
        (acc, err) => ({ ...acc, [err.field]: err.message }),
        {}
      );
      setErrors(errorMap);
      toast.error('Please fix the errors before saving');
      return;
    }

    // Submit
    onSave(form);
  }, [form, onSave]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
    }
  }, [isLoading, onOpenChange]);

  const isEditing = !!editing;
  const title = isEditing ? `Edit ${editing?.name}` : 'Add new employee';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl border-slate-200/60 bg-white/95 backdrop-blur-md shadow-2xl shadow-slate-900/20 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4 max-h-[60vh] overflow-y-auto">
          {/* Name */}
          <FormField
            label="Full Name"
            error={errors.name}
            required
          >
            <Input
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isLoading}
              className="rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white placeholder:text-slate-400"
            />
          </FormField>

          {/* Email */}
          <FormField
            label="Email"
            error={errors.email}
            required
          >
            <Input
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isLoading}
              className="rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white placeholder:text-slate-400"
            />
          </FormField>

          {/* Department & Designation */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Department"
              error={errors.department}
              required
            >
              <Select value={form.department} onValueChange={(value) => handleChange('department', value)}>
                <SelectTrigger disabled={isLoading} className="rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='rounded-lg border-slate-200  bg-white'>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Designation"
              error={errors.designation}
              required
            >
              <Input
                placeholder="e.g. Senior Chef"
                value={form.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                disabled={isLoading}
                className="rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </FormField>
          </div>

          {/* Employment Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Employment Type" required>
              <Select value={form.employmentType} onValueChange={(value) => handleChange('employmentType', value)}>
                <SelectTrigger disabled={isLoading} className="rounded-lg border-slate-200 bg-slate-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='rounded-lg border-slate-200  bg-white'>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Status" required>
              <Select value={form.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger disabled={isLoading} className="rounded-lg border-slate-200 bg-slate-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='rounded-lg border-slate-200  bg-white'>
                  {EMPLOYEE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Salary & Workload */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Monthly Salary (CHF)" error={errors.salary} required>
              <Input
                type="number"
                placeholder="3000"
                value={form.salary}
                onChange={(e) => handleChange('salary', Number(e.target.value))}
                disabled={isLoading}
                className="rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </FormField>

            <FormField label="Default Password" error={errors.password} required>
              <Input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={isLoading}
                min="0"
                max="100"
                className="rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </FormField>
          </div>

          {/* Phone & Address */}
          <FormField label="Phone" error={errors.phone}  required>
            <Input
              placeholder="+41 79 123 4567"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={isLoading}
              className="rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white"
            />
          </FormField>

          <FormField label="Address" error={errors.address}  required>
            <Input
              placeholder="123 Main St, Zurich"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={isLoading}
              className="rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white"
            />
          </FormField>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-lg border-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// DELETE CONFIRMATION DIALOG
// ─────────────────────────────────────────────────────────────

interface EmployeeDeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  isLoading: boolean;
  onConfirm: () => void;
}

export function EmployeeDeleteConfirm({
  open,
  onOpenChange,
  employee,
  isLoading,
  onConfirm,
}: EmployeeDeleteConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={(newOpen) => !isLoading && onOpenChange(newOpen)}>
      <AlertDialogContent className="rounded-2xl border-slate-200/60 bg-white/95 backdrop-blur-md shadow-2xl shadow-slate-900/20">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg font-bold text-slate-900">
                Delete {employee?.name}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 mt-2">
                This will permanently remove the employee from the system. This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            disabled={isLoading}
            className="rounded-lg border-slate-200"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={onConfirm}
            className="rounded-lg bg-red-600 hover:bg-red-700 font-semibold shadow-lg shadow-red-600/25 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────────────────────
// FORM FIELD COMPONENT
// ─────────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-slate-700 font-semibold text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
