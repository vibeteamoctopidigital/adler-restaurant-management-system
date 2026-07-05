import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { availabilityService } from '../api/availability.service';

export function useAvailability(employeeId?: string) {
  return useQuery({
    queryKey: ['availability', employeeId ?? 'all'],
    queryFn: () => availabilityService.getAll(employeeId),
    placeholderData: keepPreviousData,
  });
}
