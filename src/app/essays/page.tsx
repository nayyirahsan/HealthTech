import { PageHeader } from "@/components/shared/page-header";

export default function EssaysPage() {
  return (
    <div className="p-8">
      <PageHeader
        title="Essay Coach"
        description="AI essay assistant — brainstorm, draft, and refine personal statements and secondary essays."
      />
      {/* TODO: Essay prompt tracker + AI feedback with school-specific context */}
    </div>
  );
}
