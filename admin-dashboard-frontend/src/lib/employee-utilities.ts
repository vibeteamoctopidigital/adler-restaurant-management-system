/**
 * Helper Hooks & Utilities
 * Reusable utilities for employees feature
 */

import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────
// DEBOUNCE HOOK
// ─────────────────────────────────────────────────────────────

/**
 * Debounces a value with configurable delay
 * Keeps input responsive while delaying API calls
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ─────────────────────────────────────────────────────────────
// FORM VALIDATION
// ─────────────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export function validateEmployeeForm(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email address' });
  }

    if (!data.password?.trim()) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (!data.department?.trim()) {
    errors.push({ field: 'department', message: 'Department is required' });
  }

  if (!data.designation?.trim()) {
    errors.push({ field: 'designation', message: 'Designation is required' });
  }

  if (data.salary < 0) {
    errors.push({ field: 'salary', message: 'Salary cannot be negative' });
  }
  if (data.phone && !/^\+?[0-9\s\-()]+$/.test(data.phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number' });
  }
  if (data.address && data.address.length < 5) {
    errors.push({ field: 'address', message: 'Address is too short' });
  }

  return errors;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
export const DEPARTMENTS = [
  'Service',
  'Kitchen',
  'Bar',
  'Management',
  'Cleaning',
  'Delivery',
  'Reception'
] as const;
export const EMPLOYMENT_TYPES = ['Full-time', 'Part time', 'Intern', 'Remote', 'Hybrid'] as const;
export const EMPLOYEE_STATUSES = ['Active', 'Leave', 'Suspension', 'Sacked', 'Resigned', 'Retired'] as const;
