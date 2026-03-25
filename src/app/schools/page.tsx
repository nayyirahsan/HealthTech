import { PageHeader } from "@/components/shared/page-header";

export default function SchoolsPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="School Explorer"
        description="Browse and filter all U.S. medical schools by stats, location, and mission."
      />
      {/* TODO: Searchable/filterable table of 170+ med schools */}
    </div>
  );
}
