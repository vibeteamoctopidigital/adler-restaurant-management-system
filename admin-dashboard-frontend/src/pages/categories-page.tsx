import { useMemo, useState } from "react";

import { useCategories } from "@/features/categories/hooks/use-categories";
import { useEmployees } from "@/features/employees/hooks/use-employees";
import type { Category } from "@/lib/mock-data";
import { AddCategoryDialog, CategoriesList, CategoryHeader, DeleteCategoryDialog, EditCategoryDialog } from "@/features/categories/components/index";



export function CategoriesPage() {
  const { data, isLoading, isError } = useCategories();
  const { data: employeesData } = useEmployees();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const categories = data?.items ?? [];
  const employees = employeesData?.items ?? [];

  // Precompute qualified-staff counts once per employees change instead of
  // re-filtering the full employee list for every rendered card.
  const staffCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const employee of employees) {
      for (const categoryId of employee.categories ?? []) {
        counts[categoryId] = (counts[categoryId] ?? 0) + 1;
      }
    }
    return counts;
  }, [employees]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px]">
      <CategoryHeader onAddClick={() => setAddOpen(true)} />

      <CategoriesList
        categories={categories}
        staffCountByCategory={staffCountByCategory}
        isLoading={isLoading}
        isError={isError}
        onEdit={setEditing}
        onDeleteRequest={setDeleteTarget}
        onCreateClick={() => setAddOpen(true)}
      />

      <AddCategoryDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditCategoryDialog category={editing as any} onClose={() => setEditing(null)} />
      <DeleteCategoryDialog category={deleteTarget as any} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
