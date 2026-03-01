import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/expenses/categories/")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const n = undefined as unknown as number;
  return <div>{n.toFixed(2)}</div>;
}
