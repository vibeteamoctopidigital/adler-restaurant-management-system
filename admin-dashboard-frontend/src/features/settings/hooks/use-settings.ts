import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsService, type Settings } from '../api/settings.service';

export const settingsKeys = {
  all: ['settings'] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => settingsService.get(),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Settings>) => settingsService.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.all });
      toast.success('Settings saved');
    },
  });
}
