import { PageHeader } from "@/components/shared/page-header";

export default function MyListPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="My School List"
        description="Your saved school list organized by reach, target, and safety tiers."
      />
      {/* TODO: Saved schools with tier badges, notes, and AI-suggested balance */}
    </div>
  );
}
